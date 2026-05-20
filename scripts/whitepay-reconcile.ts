/**
 * Script de réconciliation manuelle Whitepay
 * Usage : npx tsx scripts/whitepay-reconcile.ts [--apply]
 *
 * Sans --apply : mode dry-run, affiche uniquement ce qui serait corrigé.
 * Avec --apply : applique les corrections (débit balance, statut PAID).
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const DRY_RUN = !process.argv.includes('--apply');

// ─── Config Whitepay ──────────────────────────────────────────────────────────
const WP_BASE = process.env.WHITEPAY_BASE_URL || 'https://api.whitepay.com';
const WP_KEY = process.env.WHITEPAY_API_KEY!;
const WP_SECRET = process.env.WHITEPAY_API_SECRET!;

if (!WP_KEY || !WP_SECRET) {
  console.error('❌  WHITEPAY_API_KEY / WHITEPAY_API_SECRET manquants dans .env.local');
  process.exit(1);
}

// ─── Helpers Whitepay ─────────────────────────────────────────────────────────
function wpHeaders(body?: string) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signaturePayload = `${timestamp}${body ?? ''}`;
  const signature = crypto.createHmac('sha256', WP_SECRET).update(signaturePayload).digest('hex');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${WP_KEY}`,
    'X-Signature': signature,
    'X-Timestamp': timestamp,
  };
}

async function wpGet<T>(path: string): Promise<T> {
  const url = `${WP_BASE}${path}`;
  const headers = wpHeaders();
  const res = await fetch(url, { method: 'GET', headers });
  const data = await res.json() as unknown;
  if (!res.ok) throw new Error(`Whitepay ${res.status}: ${JSON.stringify(data)}`);
  return data as T;
}

interface WpTx {
  id: string;
  type: string;
  currency: string;
  value: string;
  status: string;
  hash: string | null;
  created_at: string;
  completed_at: string | null;
  external_id?: string | null;
  explorer_link?: string | null;
}

/** Interroge /private-api/transactions avec filtres optionnels */
async function fetchWpTransactions(params: {
  date_from?: string;
  date_to?: string;
  external_id?: string;
  per_page?: number;
  page?: number;
}): Promise<{ transactions: WpTx[]; meta: { total: number; last_page: number } }> {
  // Construction manuelle de la query string (URLSearchParams encoderait les espaces en +)
  const parts: string[] = [];
  // Whitepay attend "Y-m-d H:i:s" avec + comme séparateur dans l'URL (équivaut à espace)
  if (params.date_from)   parts.push(`date_from=${encodeURIComponent(params.date_from + ' 00:00:00')}`);
  if (params.date_to)     parts.push(`date_to=${encodeURIComponent(params.date_to + ' 23:59:59')}`);
  if (params.external_id) parts.push(`external_id=${encodeURIComponent(params.external_id)}`);
  parts.push(`per_page=${params.per_page ?? 50}`);
  parts.push(`page=${params.page ?? 1}`);
  const path = `/private-api/transactions?${parts.join('&')}`;
  return wpGet(path);
}

/** Essaie de lire la conversion via l'ancien endpoint (fonctionne seulement avant confirmation) */
async function fetchWpConvertWithdrawal(txId: string): Promise<{ status: string; external_id?: string } | null> {
  try {
    const r = await wpGet<{ transaction: { status: string; external_id?: string } }>(
      `/private-api/convert-withdrawal/${txId}`
    );
    return r.transaction;
  } catch {
    return null; // 404 expected pour les tx complétées
  }
}

// ─── Correction balance ───────────────────────────────────────────────────────
async function applyCorrection(payoutId: string, userId: string, amountCents: number, wpTx: WpTx) {
  if (DRY_RUN) return;

  // 1. Passer vers PAID (peu importe le statut source)
  const reset = await prisma.payout.updateMany({
    where: {
      id: payoutId,
      status: {
        in: [
          'FAILED',
          'WHITEPAY_PENDING_WITHDRAWAL',
          'WHITEPAY_PROCESSING_WITHDRAWAL',
          'WHITEPAY_WAITING_CONFIRMATION',
          'WHITEPAY_COMPLETE',
        ],
      },
    },
    data: {
      balanceDebitedAt: null,              // sera rempli en étape 3
      status: 'PAID',
      whitepayTxHash: wpTx.hash ?? undefined,
      whitepayTransactionId: wpTx.id,      // restaurer/confirmer l'ID Whitepay
      paidAt: wpTx.completed_at ? new Date(wpTx.completed_at + ' UTC') : new Date(),
    },
  });
  if (reset.count === 0) {
    console.warn(`  ⚠️  Reset ignoré pour ${payoutId} — payout non FAILED ou concurrence`);
    return;
  }

  // 2. Débiter la balance et libérer le gel si encore actif
  // Pour les payouts PENDING : frozenBalanceCents est encore actif → on doit le libérer
  // Pour les payouts FAILED  : onFailed a déjà appelé unfreezeBalance → frozenBalanceCents déjà à 0
  await prisma.$transaction(async (tx) => {
    const result = await tx.user.updateMany({
      where: { id: userId, balanceCents: { gte: amountCents } },
      data: { balanceCents: { decrement: amountCents } },
    });
    if (result.count === 0) {
      throw new Error(`Solde insuffisant pour débiter ${amountCents} cents (user ${userId})`);
    }
    // Dégel : clamp sur le frozen actuel pour éviter de descendre sous 0
    const userForFreeze = await tx.user.findUnique({
      where: { id: userId },
      select: { frozenBalanceCents: true },
    });
    const currentFrozen = userForFreeze?.frozenBalanceCents ?? 0;
    const decrementFrozenBy = Math.min(amountCents, currentFrozen);
    if (decrementFrozenBy > 0) {
      await tx.user.update({
        where: { id: userId },
        data: { frozenBalanceCents: { decrement: decrementFrozenBy } },
      });
    }
    const user = await tx.user.findUnique({ where: { id: userId }, select: { balanceCents: true } });
    await tx.balanceTransaction.create({
      data: {
        userId,
        type: 'WITHDRAWAL',
        amountCents: -amountCents,
        balanceAfterCents: user!.balanceCents,
        reason: `Correction Whitepay — payout ${payoutId} tx ${wpTx.id} = COMPLETE`,
        metadata: { type: 'WITHDRAWAL', payoutId, whitepayTxId: wpTx.id, wpHash: wpTx.hash },
      },
    });
  });

  // 3. Marquer balanceDebitedAt
  await prisma.payout.update({
    where: { id: payoutId },
    data: { balanceDebitedAt: new Date() },
  });
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'WHITEPAY_MANUAL_CORRECTION_PAID',
      details: {
        payoutId,
        whitepayTxId: wpTx.id,
        whitepayHash: wpTx.hash,
        whitepayExternalId: wpTx.external_id,
        amountCents,
        completedAt: wpTx.completed_at,
      },
    },
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(DRY_RUN ? '🔍  Mode DRY-RUN (ajoutez --apply pour appliquer)' : '⚡  Mode APPLY — corrections réelles');
  console.log('');

  const users = [
    { id: 'lS5O83zRrSluxdvF3oAJdd5slW0RXgik', name: 'FPM' },
    { id: 'cmmm6xqo1000bt2vj5smbx9zp',       name: 'Nyouz' },
    { id: 'St8etc2E4yWUe6FiqmyzBMPsWxNYn9oC', name: 'Purple' },
  ];

  for (const user of users) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  User: ${user.name} (${user.id})`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // 1. Payouts Whitepay non résolus (FAILED ou bloqués en PENDING/PROCESSING)
    const failedPayouts = await prisma.payout.findMany({
      where: {
        userId: user.id,
        status: {
          in: [
            'FAILED',
            'WHITEPAY_PENDING_WITHDRAWAL',
            'WHITEPAY_PROCESSING_WITHDRAWAL',
            'WHITEPAY_WAITING_CONFIRMATION',
            'WHITEPAY_COMPLETE',
          ],
        },
        paidAt: null,
        paymentMethod: { type: { in: ['WHITEPAY_CRYPTO', 'CRYPTO'] } },
      },
      include: { paymentMethod: true },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`  ${failedPayouts.length} payout(s) Whitepay non résolus\n`);

    // Txs déjà matchées pour cet user (évite double-attribution)
    const usedTxIds = new Set<string>();

    for (const payout of failedPayouts) {
      try {
      // Format attendu par Whitepay : "Y-m-d" (ex: 2022-06-01)
      const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
      const dateFrom = fmtDate(new Date(payout.createdAt.getTime() - 24 * 60 * 60 * 1000));
      const dateTo   = fmtDate(new Date(payout.createdAt.getTime() + 48 * 60 * 60 * 1000));

      console.log(`  ► Payout ${payout.id}`);
      console.log(`    montant : ${payout.amountCents / 100} € | créé : ${payout.createdAt.toISOString()}`);
      console.log(`    whitepayTransactionId : ${payout.whitepayTransactionId ?? '(null)'}`);
      console.log(`    whitepayStatus : ${payout.whitepayStatus ?? '(null)'}`);

      // Essai 1 : ancien endpoint si transactionId présent
      if (payout.whitepayTransactionId) {
        const convertTx = await fetchWpConvertWithdrawal(payout.whitepayTransactionId);
        if (convertTx) {
          console.log(`    convert-withdrawal : status=${convertTx.status} external_id=${convertTx.external_id ?? '-'}`);
        } else {
          console.log(`    convert-withdrawal : 404 (tx complétée ou expirée)`);
        }
      }

      // Essai 2 : /transactions filtré par date
      console.log(`    Recherche dans /transactions (date_from=${dateFrom}, date_to=${dateTo})`);
      const listResult = await fetchWpTransactions({ date_from: dateFrom, date_to: dateTo, per_page: 100 });

      const COMPLETE_TYPES = ['CONVERT_WITHDRAWAL', 'WITHDRAWAL'];
      const completedTxs = listResult.transactions.filter(
        (tx) => COMPLETE_TYPES.includes(tx.type) && tx.status === 'COMPLETE'
      );
      const amountEur = (payout.amountCents / 100).toFixed(2);

      console.log(`    → ${listResult.transactions.length} tx au total, ${completedTxs.length} CONVERT_WITHDRAWAL/WITHDRAWAL COMPLETE`);

      if (completedTxs.length === 0) {
        console.log(`    ✗  Aucune tx Whitepay complétée trouvée sur cette plage\n`);
        continue;
      }

      // Afficher les candidats
      for (const tx of completedTxs) {
        console.log(`    Candidat : id=${tx.id} | value=${tx.value} ${tx.currency} | completed=${tx.completed_at} | hash=${tx.hash?.slice(0, 20) ?? '-'}... | external_id=${tx.external_id ?? '-'}`);
      }

      // Récupérer l'orderId depuis l'audit log (toutes les actions Whitepay + approbation admin)
      const auditEntry = await prisma.auditLog.findFirst({
        where: {
          userId: user.id,
          action: {
            in: [
              'WHITEPAY_WITHDRAWAL_CREATED',
              'WHITEPAY_INSTANT_WITHDRAWAL_CREATED',
              'ADMIN_PAYOUT_APPROVED',
            ],
          },
          details: { path: ['payoutId'], equals: payout.id },
        },
        select: { details: true },
      });
      const knownOrderId = auditEntry
        ? (auditEntry.details as Record<string, string>)['orderId'] ?? null
        : null;

      // Matching 0 : par whitepayTransactionId stocké en base (le plus fiable)
      let bestMatch: WpTx | null = null;
      let matchReason = '';

      if (payout.whitepayTransactionId) {
        const directMatch = completedTxs.find((tx) => tx.id === payout.whitepayTransactionId);
        if (directMatch && !usedTxIds.has(directMatch.id)) {
          bestMatch = directMatch;
          matchReason = `whitepayTransactionId direct = ${directMatch.id}`;
        }
      }

      // Matching 1 : par external_id (orderId depuis audit log)
      if (!bestMatch && knownOrderId) {
        const externalMatch = completedTxs.find(
          (tx) => tx.external_id === knownOrderId && !usedTxIds.has(tx.id)
        );
        if (externalMatch) {
          bestMatch = externalMatch;
          matchReason = `external_id = ${knownOrderId}`;
        }
      }

      // Matching 2 : proximité temporelle
      // Uniquement si le payout a au moins un indice qu'il a été soumis à Whitepay
      // (whitepayTransactionId en DB OU orderId dans l'audit log OU whitepayStatus non null).
      // Sinon le retrait n'a jamais été créé chez Whitepay → ne pas chercher.
      const wasSubmittedToWhitepay =
        payout.whitepayTransactionId !== null ||
        knownOrderId !== null ||
        payout.whitepayStatus !== null;

      if (!bestMatch && wasSubmittedToWhitepay) {
        const WINDOW_AFTER_MS  = 60 * 60 * 1000;  // 60 min après création
        const TOLERANCE_BEFORE = 5  * 60 * 1000;  // 5 min avant (tolérance horloge)
        const payoutTime = payout.createdAt.getTime();

        const timeMatches = completedTxs
          .filter((tx) => {
            if (!tx.completed_at) return false;
            if (usedTxIds.has(tx.id)) return false;
            const txTime = new Date(tx.completed_at + ' UTC').getTime();
            return txTime >= payoutTime - TOLERANCE_BEFORE && txTime <= payoutTime + WINDOW_AFTER_MS;
          })
          .sort((a, b) => {
            const tA = new Date(a.completed_at! + ' UTC').getTime();
            const tB = new Date(b.completed_at! + ' UTC').getTime();
            return Math.abs(tA - payoutTime) - Math.abs(tB - payoutTime);
          });

        if (timeMatches.length === 1) {
          bestMatch = timeMatches[0];
          const delta = new Date(bestMatch.completed_at! + ' UTC').getTime() - payoutTime;
          matchReason = `proximité temporelle (~${Math.round(delta / 60000)} min après création)`;
        } else if (timeMatches.length > 1) {
          // Prendre le plus proche (premier de la liste triée)
          bestMatch = timeMatches[0];
          const delta = new Date(bestMatch.completed_at! + ' UTC').getTime() - payoutTime;
          matchReason = `proximité temporelle (~${Math.round(delta / 60000)} min, le plus proche parmi ${timeMatches.length})`;
          console.log(`\n    ℹ️  Plusieurs candidats temporels — sélection du plus proche :`);
          timeMatches.forEach((tx) => {
            const d = new Date(tx.completed_at! + ' UTC').getTime() - payoutTime;
            const marker = tx.id === bestMatch!.id ? '→ SÉLECTIONNÉ' : '';
            console.log(`       tx ${tx.id} — ~${Math.round(d / 60000)} min — ${tx.value} ${tx.currency} — external_id=${tx.external_id ?? '-'} ${marker}`);
          });
        }
      }

      if (bestMatch) {
        usedTxIds.add(bestMatch.id);
        console.log(`\n    ✅ MATCH (${matchReason}) : tx ${bestMatch.id}`);
        console.log(`       value : ${bestMatch.value} ${bestMatch.currency}`);
        console.log(`       hash : ${bestMatch.hash}`);
        console.log(`       completed_at : ${bestMatch.completed_at}`);
        console.log(`       external_id : ${bestMatch.external_id ?? '-'}`);

        if (DRY_RUN) {
          console.log(`    [DRY-RUN] → Correction NON appliquée (relancez avec --apply)`);
        } else {
          console.log(`    ⚡ Application de la correction...`);
          await applyCorrection(payout.id, user.id, payout.amountCents, bestMatch);
          console.log(`    ✅ Payout ${payout.id} → PAID, balance débitée de ${payout.amountCents} centimes`);
        }
      } else {
        if (!wasSubmittedToWhitepay) {
          console.log(`\n    ℹ️  Payout jamais soumis à Whitepay (pas de transactionId ni orderId) — FAILED légitime.`);
        } else {
          console.log(`\n    ✗  Aucun match (montant en €≠USDC, fenêtre 60 min, external_id inconnu) — vérification manuelle.`);
          console.log(`       Candidats : ${completedTxs.map(t => `${t.value} ${t.currency} (${t.completed_at})`).join(', ')}`);
        }
      }
      console.log('');
      } catch (err) {
        console.error(`\n    ❌ Erreur sur payout ${payout.id} :`, err instanceof Error ? err.message : err);
        console.log('');
      }
    }

    // Résumé balance actuelle
    const balanceRow = await prisma.user.findUnique({
      where: { id: user.id },
      select: { balanceCents: true, frozenBalanceCents: true },
    });
    console.log(`  Balance actuelle : ${(balanceRow!.balanceCents / 100).toFixed(2)} € (gelé : ${(balanceRow!.frozenBalanceCents / 100).toFixed(2)} €)`);
  }

  console.log('\n\nTerminé.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
