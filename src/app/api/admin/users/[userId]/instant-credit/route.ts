import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { releasePendingToBalance, creditBalance } from '@/lib/balance-service';
import { currencyConverter } from '@/lib/currency-converter';
import { logger } from '@/lib/logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { userId } = await params;
    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled (boolean) requis' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, instantCreditEnabled: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (user.instantCreditEnabled === enabled) {
      return NextResponse.json({ instantCreditEnabled: enabled });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { instantCreditEnabled: enabled },
    });

    const ipAddress =
      request.headers.get('x-forwarded-for') ??
      request.headers.get('x-real-ip') ??
      'unknown';

    let releasedTrades = 0;
    let releasedAmountCents = 0;

    if (enabled) {
      const pendingTrades = await prisma.trade.findMany({
        where: {
          userId,
          status: { in: ['ACCEPTED_BY_BOT', 'IN_TRADE_HOLD'] },
          balanceCreditedAt: null,
          instantCreditedAt: null,
        },
        select: {
          id: true,
          netCents: true,
          pendingCreditedAt: true,
          eurCentsAtCredit: true,
        },
      });

      for (const trade of pendingTrades) {
        try {
          const lock = await prisma.trade.updateMany({
            where: { id: trade.id, balanceCreditedAt: null, instantCreditedAt: null },
            data: { instantCreditedAt: new Date(), balanceCreditedAt: new Date() },
          });
          if (lock.count === 0) continue;

          const eurCents = trade.eurCentsAtCredit ?? await currencyConverter.convertUsdCentsToEurCents(trade.netCents);
          const rate = await currencyConverter.getUsdToEurRate();

          if (trade.pendingCreditedAt) {
            await releasePendingToBalance(
              userId,
              eurCents,
              `Trade ${trade.id} — instant credit activated by admin, releasing pending`,
              { tradeId: trade.id }
            );
          } else {
            await creditBalance(
              userId,
              eurCents,
              `Trade ${trade.id} — instant credit activated by admin, direct credit`,
              { type: 'TRADE_CREDIT', tradeId: trade.id }
            );
          }

          await prisma.trade.update({
            where: { id: trade.id },
            data: {
              status: 'AVAILABLE',
              availableAt: new Date(),
              eurCentsAtCredit: trade.eurCentsAtCredit ?? eurCents,
              usdToEurRate: rate,
            },
          });

          await prisma.auditLog.create({
            data: {
              userId,
              action: 'TRADE_INSTANT_CREDIT_RETRO',
              details: {
                tradeId: trade.id,
                netCentsUsd: trade.netCents,
                eurCents,
                usdToEurRate: rate,
                hadPendingCredit: !!trade.pendingCreditedAt,
                triggeredBy: session.user.id,
                source: 'admin_toggle_retro',
              },
            },
          });

          releasedTrades += 1;
          releasedAmountCents += eurCents;
          logger.info(`[InstantCredit] Retroactive instant credit applied to trade ${trade.id} (user ${userId})`);
        } catch (tradeErr) {
          logger.error(`[InstantCredit] Failed to apply retro instant credit on trade ${trade.id}`, tradeErr);
        }
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: enabled ? 'INSTANT_CREDIT_ENABLED' : 'INSTANT_CREDIT_DISABLED',
        details: {
          targetUserId: userId,
          enabled,
          changedBy: session.user.id,
          retroactiveReleasedTrades: releasedTrades,
          retroactiveReleasedAmountCents: releasedAmountCents,
        },
        ipAddress,
      },
    });

    return NextResponse.json({
      instantCreditEnabled: enabled,
      retroactive: { releasedTrades, releasedAmountCents },
    });
  } catch (err) {
    console.error('[admin/users/[userId]/instant-credit]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
