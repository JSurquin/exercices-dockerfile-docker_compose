#!/usr/bin/env tsx
/**
 * Script de réconciliation globale des payouts.
 *
 * Pour CHAQUE payout non-final en BDD, on interroge directement l'API du provider
 * (Flexify ou Whitepay) et on aligne le statut interne via PayoutLifecycle.
 *
 * C'est le filet de sécurité quand un webhook a été manqué (provider down,
 * deploy en cours, signature invalide, etc.).
 *
 * Usage :
 *   # Lecture seule (diagnostic)
 *   npx tsx scripts/reconcile-all-payouts.ts
 *
 *   # Application des corrections
 *   npx tsx scripts/reconcile-all-payouts.ts --fix
 *
 *   # Limiter à un user
 *   npx tsx scripts/reconcile-all-payouts.ts --fix --user=<userId>
 *
 *   # Limiter à un payout
 *   npx tsx scripts/reconcile-all-payouts.ts --fix --payout=<payoutId>
 */
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { PrismaClient, PayoutStatus } from '@prisma/client';
import {
  getTransactionStatus as getFlexifyTxStatus,
  getTransactionByReference as getFlexifyTxByRef,
  checkPayoutByReference as checkFlexifyByRef,
  isTransactionCompleted as isFlexifyCompleted,
  isTransactionFailed as isFlexifyFailed,
  type FlexifyTransactionStatus,
} from '@/lib/flexify';
import {
  getTransactionStatus as getWhitepayTxStatus,
  isTransactionComplete as isWhitepayCompleted,
  isTransactionFailed as isWhitepayFailed,
} from '@/lib/whitepay';
import { PayoutLifecycle } from '@/lib/payout-lifecycle';

const prisma = new PrismaClient();

const DRY_RUN = !process.argv.includes('--fix');
const USER_FILTER = process.argv.find((a) => a.startsWith('--user='))?.split('=')[1];
const PAYOUT_FILTER = process.argv.find((a) => a.startsWith('--payout='))?.split('=')[1];

const NON_FINAL_STATUSES: PayoutStatus[] = [
  'PENDING',
  'VERIFICATION_REQUIRED',
  'VERIFIED',
  'SCHEDULED',
  'PROCESSING',
  'FLEXIFY_PENDING',
  'FLEXIFY_PROCESSING',
  'WHITEPAY_WAITING_CONFIRMATION',
  'WHITEPAY_PENDING_WITHDRAWAL',
  'WHITEPAY_PROCESSING_WITHDRAWAL',
  'PENDING_APPROVAL',
];

interface Action {
  payoutId: string;
  userId: string;
  amountCents: number;
  method: string;
  beforeStatus: string;
  providerStatus: string | null;
  action: 'debited' | 'failed' | 'unchanged' | 'orphan_failed' | 'error' | 'skipped';
  detail?: string;
}

const fmtEur = (cents: number) => `${(cents / 100).toFixed(2)} €`;
const truncate = (s: string | null | undefined, n = 30) =>
  !s ? '—' : s.length > n ? s.slice(0, n) + '…' : s;

async function fetchFlexifyStatus(p: {
  flexifyPayoutId: string | null;
  gateFiOrderId: string | null;
  paymentMethodType: string;
}): Promise<FlexifyTransactionStatus | null> {
  const pm = p.paymentMethodType.toUpperCase();
  const credentialType: 'sepa' | 'card' =
    pm === 'SEPA' || pm === 'FLEXIFY_SEPA' ? 'sepa' : 'card';

  if (p.gateFiOrderId) {
    try {
      const r = await checkFlexifyByRef(p.gateFiOrderId, credentialType);
      const s = r.transaction?.status ?? r.status;
      if (s) return s;
    } catch {
      /* ignore, fallback below */
    }
  }
  if (p.flexifyPayoutId) {
    try {
      const r = await getFlexifyTxStatus(p.flexifyPayoutId);
      const s = r.transaction?.status ?? r.status;
      if (s) return s;
    } catch {
      /* ignore */
    }
  }
  if (p.gateFiOrderId) {
    try {
      const r = await getFlexifyTxByRef(p.gateFiOrderId);
      const s = r.transaction?.status ?? r.status;
      if (s) return s;
    } catch {
      /* ignore */
    }
  }
  return null;
}

async function reconcileOne(p: {
  id: string;
  userId: string;
  status: PayoutStatus;
  amountCents: number;
  tradeId: string | null;
  flexifyPayoutId: string | null;
  gateFiOrderId: string | null;
  whitepayTransactionId: string | null;
  createdAt: Date;
  paymentMethod: { type: string };
}): Promise<Action> {
  const baseAction: Omit<Action, 'action' | 'providerStatus'> = {
    payoutId: p.id,
    userId: p.userId,
    amountCents: p.amountCents,
    method: p.paymentMethod.type,
    beforeStatus: p.status,
  };
  const t = p.paymentMethod.type;
  const isFlexify = t === 'FLEXIFY_CARD' || t === 'FLEXIFY_SEPA' || t === 'CARD' || t === 'SEPA';
  const isWhitepay = t === 'WHITEPAY_CRYPTO' || t === 'CRYPTO';

  if (isFlexify) {
    const flexStatus = await fetchFlexifyStatus({
      flexifyPayoutId: p.flexifyPayoutId,
      gateFiOrderId: p.gateFiOrderId,
      paymentMethodType: t,
    });
    if (!flexStatus) {
      return { ...baseAction, providerStatus: null, action: 'unchanged', detail: 'Flexify n\'a pas répondu' };
    }
    if (isFlexifyCompleted(flexStatus)) {
      if (DRY_RUN) {
        return { ...baseAction, providerStatus: flexStatus, action: 'debited', detail: '(dry-run) would mark PAID + debit' };
      }
      const { debited } = await PayoutLifecycle.onCompleted(
        p.userId, p.id, p.amountCents,
        { tradeId: p.tradeId, reason: `Reconcile CLI : Flexify ${p.id} complété`, finalStatus: 'PAID', paidAt: new Date() },
      );
      return { ...baseAction, providerStatus: flexStatus, action: debited ? 'debited' : 'unchanged' };
    }
    if (isFlexifyFailed(flexStatus)) {
      if (DRY_RUN) {
        return { ...baseAction, providerStatus: flexStatus, action: 'failed', detail: '(dry-run) would mark FAILED + unfreeze' };
      }
      const { unfrozen } = await PayoutLifecycle.onFailed(
        p.userId, p.id, p.amountCents,
        { tradeId: p.tradeId, finalStatus: 'FAILED' },
      );
      return { ...baseAction, providerStatus: flexStatus, action: unfrozen ? 'failed' : 'unchanged' };
    }
    return { ...baseAction, providerStatus: flexStatus, action: 'unchanged', detail: `provider: ${flexStatus}` };
  }

  if (isWhitepay) {
    if (!p.whitepayTransactionId) {
      // Orphelin : pas d'ID Whitepay → la création API a échoué.
      // Si > 24h, on libère la balance (sinon, on attend, peut-être créé à l'instant).
      const ageMs = Date.now() - p.createdAt.getTime();
      if (ageMs < 24 * 60 * 60 * 1000) {
        return { ...baseAction, providerStatus: null, action: 'skipped', detail: 'Whitepay sans txId mais < 24h' };
      }
      if (DRY_RUN) {
        return { ...baseAction, providerStatus: null, action: 'orphan_failed', detail: '(dry-run) would mark FAILED orphan' };
      }
      const { unfrozen } = await PayoutLifecycle.onFailed(
        p.userId, p.id, p.amountCents,
        { tradeId: p.tradeId, finalStatus: 'FAILED' },
      );
      return { ...baseAction, providerStatus: null, action: unfrozen ? 'orphan_failed' : 'unchanged', detail: 'orphelin > 24h' };
    }
    let wpStatus: string | null = null;
    try {
      const r = await getWhitepayTxStatus(p.whitepayTransactionId);
      wpStatus = r.transaction?.status ?? null;
    } catch (err) {
      const msg = (err as Error).message ?? '';
      // 404 = transaction inexistante chez Whitepay (expirée / jamais créée correctement)
      // On la traite comme un échec définitif pour libérer la balance, mais uniquement si > 24h
      const ageMs = Date.now() - p.createdAt.getTime();
      if ((msg.includes('404') || msg.toLowerCase().includes('not found')) && ageMs > 24 * 60 * 60 * 1000) {
        if (DRY_RUN) {
          return { ...baseAction, providerStatus: '404_NOT_FOUND', action: 'orphan_failed', detail: '(dry-run) Whitepay 404 + > 24h, would mark FAILED' };
        }
        const { unfrozen } = await PayoutLifecycle.onFailed(
          p.userId, p.id, p.amountCents,
          { tradeId: p.tradeId, finalStatus: 'FAILED' },
        );
        return { ...baseAction, providerStatus: '404_NOT_FOUND', action: unfrozen ? 'orphan_failed' : 'unchanged', detail: 'Whitepay 404, libéré' };
      }
      return { ...baseAction, providerStatus: null, action: 'error', detail: `Whitepay API: ${msg}` };
    }
    if (!wpStatus) {
      return { ...baseAction, providerStatus: null, action: 'unchanged' };
    }
    if (isWhitepayCompleted(wpStatus as never)) {
      if (DRY_RUN) {
        return { ...baseAction, providerStatus: wpStatus, action: 'debited', detail: '(dry-run) would mark PAID + debit' };
      }
      const { debited } = await PayoutLifecycle.onCompleted(
        p.userId, p.id, p.amountCents,
        { tradeId: p.tradeId, reason: `Reconcile CLI : Whitepay ${p.id} complété`, finalStatus: 'PAID', paidAt: new Date() },
      );
      return { ...baseAction, providerStatus: wpStatus, action: debited ? 'debited' : 'unchanged' };
    }
    if (isWhitepayFailed(wpStatus as never)) {
      if (DRY_RUN) {
        return { ...baseAction, providerStatus: wpStatus, action: 'failed', detail: '(dry-run) would mark FAILED + unfreeze' };
      }
      const { unfrozen } = await PayoutLifecycle.onFailed(
        p.userId, p.id, p.amountCents,
        { tradeId: p.tradeId, finalStatus: 'FAILED' },
      );
      return { ...baseAction, providerStatus: wpStatus, action: unfrozen ? 'failed' : 'unchanged' };
    }
    return { ...baseAction, providerStatus: wpStatus, action: 'unchanged', detail: `provider: ${wpStatus}` };
  }

  return { ...baseAction, providerStatus: null, action: 'skipped', detail: `méthode non gérée: ${t}` };
}

async function main() {
  console.log(`\n=== reconcile-all-payouts (${DRY_RUN ? 'LECTURE SEULE' : 'MODE CORRECTION'}) ===`);
  if (USER_FILTER) console.log(`Filtre user: ${USER_FILTER}`);
  if (PAYOUT_FILTER) console.log(`Filtre payout: ${PAYOUT_FILTER}`);
  console.log('');

  const payouts = await prisma.payout.findMany({
    where: {
      ...(PAYOUT_FILTER ? { id: PAYOUT_FILTER } : { status: { in: NON_FINAL_STATUSES } }),
      ...(USER_FILTER ? { userId: USER_FILTER } : {}),
    },
    select: {
      id: true,
      userId: true,
      status: true,
      amountCents: true,
      tradeId: true,
      flexifyPayoutId: true,
      gateFiOrderId: true,
      whitepayTransactionId: true,
      createdAt: true,
      paymentMethod: { select: { type: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (payouts.length === 0) {
    console.log('Aucun payout non-final à traiter.\n');
    await prisma.$disconnect();
    return;
  }

  console.log(`Traitement de ${payouts.length} payout(s)...\n`);

  const actions: Action[] = [];
  for (const p of payouts) {
    try {
      const a = await reconcileOne(p);
      actions.push(a);
      const arrow = `${a.beforeStatus} → ${a.action.toUpperCase()}`;
      console.log(
        `  [${a.action.toUpperCase().padEnd(14)}] ${p.id}  user=${truncate(p.userId, 12)}  ${fmtEur(a.amountCents).padStart(10)}  ${a.method.padEnd(15)}  ${arrow}${a.detail ? `  — ${a.detail}` : ''}`,
      );
    } catch (err) {
      actions.push({
        payoutId: p.id,
        userId: p.userId,
        amountCents: p.amountCents,
        method: p.paymentMethod.type,
        beforeStatus: p.status,
        providerStatus: null,
        action: 'error',
        detail: (err as Error).message,
      });
      console.error(`  [ERROR         ] ${p.id}  ${(err as Error).message}`);
    }
  }

  // Récap
  const sum = (a: Action[]) => a.length;
  const debited = actions.filter((a) => a.action === 'debited');
  const failed = actions.filter((a) => a.action === 'failed');
  const orphanFailed = actions.filter((a) => a.action === 'orphan_failed');
  const unchanged = actions.filter((a) => a.action === 'unchanged');
  const skipped = actions.filter((a) => a.action === 'skipped');
  const errors = actions.filter((a) => a.action === 'error');

  console.log('\n=== Récapitulatif ===');
  console.log(`  Payés (débit balance):       ${sum(debited).toString().padStart(4)}  (${fmtEur(debited.reduce((s, a) => s + a.amountCents, 0))})`);
  console.log(`  Échoués (dégel balance):     ${sum(failed).toString().padStart(4)}  (${fmtEur(failed.reduce((s, a) => s + a.amountCents, 0))})`);
  console.log(`  Orphelins libérés (> 24h):   ${sum(orphanFailed).toString().padStart(4)}  (${fmtEur(orphanFailed.reduce((s, a) => s + a.amountCents, 0))})`);
  console.log(`  Inchangés (toujours en cours):${sum(unchanged).toString().padStart(4)}`);
  console.log(`  Ignorés:                     ${sum(skipped).toString().padStart(4)}`);
  console.log(`  Erreurs:                     ${sum(errors).toString().padStart(4)}`);

  if (DRY_RUN) {
    console.log('\nMode lecture seule. Relancez avec --fix pour appliquer les corrections.\n');
  } else {
    console.log('\nCorrections appliquées en base.\n');
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('\nErreur fatale :', err);
  prisma.$disconnect();
  process.exit(1);
});
