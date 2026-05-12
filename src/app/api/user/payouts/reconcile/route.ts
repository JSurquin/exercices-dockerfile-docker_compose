import { NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '~/prisma/prisma';
import {
  getTransactionStatus as getFlexifyTransactionStatus,
  isTransactionCompleted as isFlexifyCompleted,
  isTransactionFailed as isFlexifyFailed,
  flexifyLog,
} from '@/lib/flexify';
import {
  getTransactionStatus as getWhitepayTransactionStatus,
  isTransactionComplete as isWhitepayComplete,
  isTransactionFailed as isWhitepayFailed,
} from '@/lib/whitepay';
import { PayoutLifecycle } from '@/lib/payout-lifecycle';

interface ReconcileResult {
  payoutId: string;
  action: 'debited' | 'failed' | 'unchanged' | 'error';
  amountCents: number;
  provider: 'flexify' | 'whitepay';
}

const FLEXIFY_STATUSES = [
  'PROCESSING',
  'PENDING',
  'FLEXIFY_PENDING',
  'FLEXIFY_PROCESSING',
  // Payouts dont le webhook a marqué le statut final mais où le débit/dégel a échoué
  'FLEXIFY_PAID',
  'PAID',
] as const;
const WHITEPAY_STATUSES = [
  'WHITEPAY_PENDING_WITHDRAWAL',
  'WHITEPAY_PROCESSING_WITHDRAWAL',
  'WHITEPAY_WAITING_CONFIRMATION',
  'PROCESSING',
  'PENDING',
  // Payouts dont le webhook a marqué COMPLETE mais où onCompleted a échoué silencieusement
  'WHITEPAY_COMPLETE',
  'PAID',
] as const;

async function reconcileFlexifyPayout(
  userId: string,
  payout: { id: string; flexifyPayoutId: string | null; status: string; amountCents: number; tradeId: string | null },
): Promise<ReconcileResult> {
  // Fast-path : statut interne déjà final → on ne réinterroge pas Flexify, on rejoue juste onCompleted
  // (la balance n'a pas été débitée car balanceDebitedAt:null dans le filtre amont)
  if (payout.status === 'FLEXIFY_PAID' || payout.status === 'PAID') {
    return applyDebit(userId, payout, 'flexify', { preserveExistingStatus: true });
  }

  const flexifyData = await getFlexifyTransactionStatus(payout.flexifyPayoutId!);
  const flexifyStatus = flexifyData.transaction?.status ?? flexifyData.status;

  if (!flexifyStatus) {
    return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider: 'flexify' };
  }

  if (isFlexifyCompleted(flexifyStatus)) {
    return applyDebit(userId, payout, 'flexify');
  }
  if (isFlexifyFailed(flexifyStatus)) {
    return applyFailed(userId, payout, 'flexify');
  }
  return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider: 'flexify' };
}

async function reconcileWhitepayPayout(
  userId: string,
  payout: { id: string; whitepayTransactionId: string | null; status: string; amountCents: number; tradeId: string | null },
): Promise<ReconcileResult> {
  // Fast-path : statut interne déjà final → on ne réinterroge pas Whitepay, on rejoue juste onCompleted
  // (la balance n'a pas été débitée car balanceDebitedAt:null dans le filtre amont)
  if (payout.status === 'WHITEPAY_COMPLETE' || payout.status === 'PAID') {
    return applyDebit(userId, payout, 'whitepay', { preserveExistingStatus: true });
  }

  const wpData = await getWhitepayTransactionStatus(payout.whitepayTransactionId!);
  const wpStatus = wpData.transaction?.status;

  if (!wpStatus) {
    return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider: 'whitepay' };
  }

  if (isWhitepayComplete(wpStatus)) {
    return applyDebit(userId, payout, 'whitepay');
  }
  if (isWhitepayFailed(wpStatus)) {
    return applyFailed(userId, payout, 'whitepay');
  }
  return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider: 'whitepay' };
}

async function applyDebit(
  userId: string,
  payout: { id: string; amountCents: number; tradeId: string | null },
  provider: 'flexify' | 'whitepay',
  options: { preserveExistingStatus?: boolean } = {},
): Promise<ReconcileResult> {
  const { debited } = await PayoutLifecycle.onCompleted(
    userId, payout.id, payout.amountCents,
    {
      tradeId: payout.tradeId,
      reason: `Payout ${provider} ${payout.id} complété (rattrapage polling)`,
      // Fast-path : on garde le statut et la date d'origine posés par le webhook provider
      ...(options.preserveExistingStatus ? {} : { finalStatus: 'PAID', paidAt: new Date() }),
    },
  );
  if (!debited) {
    return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider };
  }
  return { payoutId: payout.id, action: 'debited', amountCents: payout.amountCents, provider };
}

async function applyFailed(
  userId: string,
  payout: { id: string; amountCents: number; tradeId: string | null },
  provider: 'flexify' | 'whitepay',
): Promise<ReconcileResult> {
  const { unfrozen } = await PayoutLifecycle.onFailed(
    userId, payout.id, payout.amountCents,
    { tradeId: payout.tradeId, finalStatus: 'FAILED' },
  );
  if (!unfrozen) {
    return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider };
  }
  return { payoutId: payout.id, action: 'failed', amountCents: payout.amountCents, provider };
}

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = session.user.id;

    // Flexify payouts bloqués
    const flexifyPayouts = await prisma.payout.findMany({
      where: {
        userId,
        status: { in: [...FLEXIFY_STATUSES] },
        flexifyPayoutId: { not: null },
        balanceDebitedAt: null,
      },
      select: { id: true, flexifyPayoutId: true, status: true, amountCents: true, tradeId: true },
    });

    // WhitePay payouts bloqués
    const whitepayPayouts = await prisma.payout.findMany({
      where: {
        userId,
        status: { in: [...WHITEPAY_STATUSES] },
        whitepayTransactionId: { not: null },
        balanceDebitedAt: null,
      },
      select: { id: true, whitepayTransactionId: true, status: true, amountCents: true, tradeId: true },
    });

    if (flexifyPayouts.length === 0 && whitepayPayouts.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const results: ReconcileResult[] = [];

    for (const p of flexifyPayouts) {
      try {
        results.push(await reconcileFlexifyPayout(userId, p));
      } catch (err) {
        flexifyLog('RECONCILE_PAYOUT_ERROR', { payoutId: p.id, provider: 'flexify', error: String(err) }, 'error');
        results.push({ payoutId: p.id, action: 'error', amountCents: p.amountCents, provider: 'flexify' });
      }
    }

    for (const p of whitepayPayouts) {
      try {
        results.push(await reconcileWhitepayPayout(userId, p));
      } catch (err) {
        console.error('[RECONCILE] Whitepay error:', p.id, err);
        results.push({ payoutId: p.id, action: 'error', amountCents: p.amountCents, provider: 'whitepay' });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('[RECONCILE_PAYOUTS] Error:', error);
    return NextResponse.json({ error: 'Erreur lors de la réconciliation' }, { status: 500 });
  }
}
