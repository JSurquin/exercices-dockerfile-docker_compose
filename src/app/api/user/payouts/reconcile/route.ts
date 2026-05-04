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

const FLEXIFY_STATUSES = ['PROCESSING', 'PENDING'] as const;
const WHITEPAY_STATUSES = [
  'WHITEPAY_PENDING_WITHDRAWAL',
  'WHITEPAY_PROCESSING_WITHDRAWAL',
  'WHITEPAY_WAITING_CONFIRMATION',
  'PROCESSING',
  'PENDING',
] as const;

async function reconcileFlexifyPayout(
  userId: string,
  payout: { id: string; flexifyPayoutId: string | null; amountCents: number; tradeId: string | null; balanceFrozenAt: Date | null },
): Promise<ReconcileResult> {
  const flexifyData = await getFlexifyTransactionStatus(payout.flexifyPayoutId!);
  const flexifyStatus = flexifyData.transaction?.status ?? flexifyData.status;

  if (!flexifyStatus) {
    return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider: 'flexify' };
  }

  if (isFlexifyCompleted(flexifyStatus)) {
    return applyDebit(userId, payout, flexifyStatus, 'flexify');
  }
  if (isFlexifyFailed(flexifyStatus)) {
    return applyFailed(userId, payout, flexifyStatus, 'flexify');
  }
  return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider: 'flexify' };
}

async function reconcileWhitepayPayout(
  userId: string,
  payout: { id: string; whitepayTransactionId: string | null; amountCents: number; tradeId: string | null; balanceFrozenAt: Date | null },
): Promise<ReconcileResult> {
  const wpData = await getWhitepayTransactionStatus(payout.whitepayTransactionId!);
  const wpStatus = wpData.transaction?.status;

  if (!wpStatus) {
    return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider: 'whitepay' };
  }

  if (isWhitepayComplete(wpStatus)) {
    return applyDebit(userId, payout, wpStatus, 'whitepay');
  }
  if (isWhitepayFailed(wpStatus)) {
    return applyFailed(userId, payout, wpStatus, 'whitepay');
  }
  return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider: 'whitepay' };
}

async function applyDebit(
  userId: string,
  payout: { id: string; amountCents: number; tradeId: string | null; balanceFrozenAt: Date | null },
  remoteStatus: string,
  provider: 'flexify' | 'whitepay',
): Promise<ReconcileResult> {
  const { debited } = await PayoutLifecycle.onCompleted(
    userId, payout.id, payout.amountCents,
    { tradeId: payout.tradeId, reason: `Payout ${provider} ${payout.id} complété (rattrapage polling)` },
  );
  if (!debited) {
    return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider };
  }
  await prisma.payout.update({
    where: { id: payout.id },
    data: { status: 'PAID', paidAt: new Date() },
  });
  return { payoutId: payout.id, action: 'debited', amountCents: payout.amountCents, provider };
}

async function applyFailed(
  userId: string,
  payout: { id: string; amountCents: number; tradeId: string | null; balanceFrozenAt: Date | null },
  remoteStatus: string,
  provider: 'flexify' | 'whitepay',
): Promise<ReconcileResult> {
  const { unfrozen } = await PayoutLifecycle.onFailed(userId, payout.id, payout.amountCents, { tradeId: payout.tradeId });
  if (!unfrozen) {
    return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider };
  }
  await prisma.payout.update({
    where: { id: payout.id },
    data: { status: 'FAILED' },
  });
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
      select: { id: true, flexifyPayoutId: true, amountCents: true, tradeId: true, balanceFrozenAt: true },
    });

    // WhitePay payouts bloqués
    const whitepayPayouts = await prisma.payout.findMany({
      where: {
        userId,
        status: { in: [...WHITEPAY_STATUSES] },
        whitepayTransactionId: { not: null },
        balanceDebitedAt: null,
      },
      select: { id: true, whitepayTransactionId: true, amountCents: true, tradeId: true, balanceFrozenAt: true },
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
