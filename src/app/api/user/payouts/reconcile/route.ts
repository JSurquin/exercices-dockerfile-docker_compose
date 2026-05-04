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
import { debitBalance, unfreezeBalance } from '@/lib/balance-service';

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
  const debitLock = await prisma.payout.updateMany({
    where: { id: payout.id, balanceDebitedAt: null },
    data: { balanceDebitedAt: new Date(), status: 'PAID', paidAt: new Date() },
  });

  if (debitLock.count === 0) {
    return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider };
  }

  await debitBalance(userId, payout.amountCents, `Payout ${provider} ${payout.id} complété (rattrapage polling)`, {
    type: 'WITHDRAWAL',
    payoutId: payout.id,
  });
  if (payout.balanceFrozenAt) {
    await unfreezeBalance(userId, payout.amountCents);
  }
  if (payout.tradeId) {
    await prisma.trade.update({ where: { id: payout.tradeId }, data: { status: 'PAID' } });
  }
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'PAYOUT_RECONCILE_DEBITED',
      details: { payoutId: payout.id, remoteStatus, amountCents: payout.amountCents, provider, source: 'user_polling' },
    },
  });
  return { payoutId: payout.id, action: 'debited', amountCents: payout.amountCents, provider };
}

async function applyFailed(
  userId: string,
  payout: { id: string; amountCents: number; tradeId: string | null; balanceFrozenAt: Date | null },
  remoteStatus: string,
  provider: 'flexify' | 'whitepay',
): Promise<ReconcileResult> {
  const unfreezeLock = await prisma.payout.updateMany({
    where: { id: payout.id, balanceDebitedAt: null },
    data: { balanceDebitedAt: new Date(), status: 'FAILED' },
  });
  if (unfreezeLock.count > 0 && payout.balanceFrozenAt) {
    await unfreezeBalance(userId, payout.amountCents);
  }
  if (payout.tradeId) {
    await prisma.trade.update({ where: { id: payout.tradeId }, data: { status: 'FAILED' } });
  }
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'PAYOUT_RECONCILE_FAILED',
      details: { payoutId: payout.id, remoteStatus, amountCents: payout.amountCents, provider, source: 'user_polling' },
    },
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
