import { NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '~/prisma/prisma';
import {
  getTransactionStatus,
  isTransactionCompleted,
  isTransactionFailed,
  flexifyLog,
} from '@/lib/flexify';
import { debitBalance, unfreezeBalance } from '@/lib/balance-service';

interface ReconcileResult {
  payoutId: string;
  action: 'debited' | 'failed' | 'unchanged' | 'error';
  amountCents: number;
}

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = session.user.id;

    const stalePayouts = await prisma.payout.findMany({
      where: {
        userId,
        status: { in: ['PROCESSING', 'PENDING'] },
        flexifyPayoutId: { not: null },
        balanceDebitedAt: null,
      },
      select: {
        id: true,
        flexifyPayoutId: true,
        amountCents: true,
        tradeId: true,
        balanceFrozenAt: true,
        balanceDebitedAt: true,
      },
    });

    if (stalePayouts.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const results: ReconcileResult[] = [];

    for (const payout of stalePayouts) {
      try {
        const flexifyData = await getTransactionStatus(payout.flexifyPayoutId!);
        const flexifyStatus = flexifyData.transaction?.status ?? flexifyData.status;

        if (!flexifyStatus) {
          results.push({ payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents });
          continue;
        }

        if (isTransactionCompleted(flexifyStatus)) {
          const debitLock = await prisma.payout.updateMany({
            where: { id: payout.id, balanceDebitedAt: null },
            data: { balanceDebitedAt: new Date(), status: 'PAID', paidAt: new Date() },
          });

          if (debitLock.count > 0) {
            await debitBalance(
              userId,
              payout.amountCents,
              `Payout Flexify ${payout.id} complété (rattrapage polling)`,
              { type: 'WITHDRAWAL', payoutId: payout.id }
            );
            if (payout.balanceFrozenAt) {
              await unfreezeBalance(userId, payout.amountCents);
            }

            if (payout.tradeId) {
              await prisma.trade.update({
                where: { id: payout.tradeId },
                data: { status: 'PAID' },
              });
            }

            await prisma.auditLog.create({
              data: {
                userId,
                action: 'PAYOUT_RECONCILE_DEBITED',
                details: {
                  payoutId: payout.id,
                  flexifyPayoutId: payout.flexifyPayoutId,
                  flexifyStatus,
                  amountCents: payout.amountCents,
                  source: 'user_polling',
                },
              },
            });

            results.push({ payoutId: payout.id, action: 'debited', amountCents: payout.amountCents });
          } else {
            results.push({ payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents });
          }
        } else if (isTransactionFailed(flexifyStatus)) {
          const unfreezeLock = await prisma.payout.updateMany({
            where: { id: payout.id, balanceDebitedAt: null },
            data: { balanceDebitedAt: new Date(), status: 'FAILED' },
          });

          if (unfreezeLock.count > 0 && payout.balanceFrozenAt) {
            await unfreezeBalance(userId, payout.amountCents);
          }

          if (payout.tradeId) {
            await prisma.trade.update({
              where: { id: payout.tradeId },
              data: { status: 'FAILED' },
            });
          }

          await prisma.auditLog.create({
            data: {
              userId,
              action: 'PAYOUT_RECONCILE_FAILED',
              details: {
                payoutId: payout.id,
                flexifyPayoutId: payout.flexifyPayoutId,
                flexifyStatus,
                amountCents: payout.amountCents,
                source: 'user_polling',
              },
            },
          });

          results.push({ payoutId: payout.id, action: 'failed', amountCents: payout.amountCents });
        } else {
          results.push({ payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents });
        }
      } catch (err) {
        flexifyLog('RECONCILE_PAYOUT_ERROR', { payoutId: payout.id, error: String(err) }, 'error');
        results.push({ payoutId: payout.id, action: 'error', amountCents: payout.amountCents });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('[RECONCILE_PAYOUTS] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la réconciliation' },
      { status: 500 }
    );
  }
}
