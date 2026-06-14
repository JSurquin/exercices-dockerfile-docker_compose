import { prisma } from '~/prisma/prisma';
import { TradeHooks } from '@/lib/trade-hooks';

export type ProcessTradesJobResult = {
  success: true;
  message: string;
  stats: {
    tradesFound: number;
    processed: number;
    errors: number;
    affiliateCommissionsCatchup: number;
  };
  timestamp: string;
};

/**
 * Traite les trades dont la période de hold est terminée et rattrape les commissions affilié.
 */
export async function runProcessTradesJob(): Promise<ProcessTradesJobResult> {
  console.log('[Cron] Starting trade processing...');

  const tradesReadyForPayout = await prisma.trade.findMany({
    where: {
      status: 'IN_TRADE_HOLD',
      availableAt: {
        lte: new Date(),
      },
    },
    include: {
      user: true,
      items: true,
    },
  });

  console.log(`[Cron] Found ${tradesReadyForPayout.length} trades ready for payout`);

  let processedCount = 0;
  let errorCount = 0;

  for (const trade of tradesReadyForPayout) {
    try {
      console.log(`[Cron] Processing trade ${trade.id}...`);

      await prisma.trade.update({
        where: { id: trade.id },
        data: { status: 'AVAILABLE' },
      });

      await TradeHooks.onTradeStatusChanged(trade.id, 'IN_TRADE_HOLD', 'AVAILABLE');

      processedCount++;
      console.log(`[Cron] Successfully processed trade ${trade.id}`);
    } catch (error) {
      errorCount++;
      console.error(`[Cron] Error processing trade ${trade.id}:`, error);

      await prisma.auditLog
        .create({
          data: {
            userId: 'system',
            action: 'CRON_ERROR',
            details: {
              tradeId: trade.id,
              error: error instanceof Error ? error.message : 'Unknown error',
              step: 'process_trade',
            },
          },
        })
        .catch((err) => console.error('Failed to log error:', err));
    }
  }

  const response = {
    success: true as const,
    message: 'Trade processing completed',
    stats: {
      tradesFound: tradesReadyForPayout.length,
      processed: processedCount,
      errors: errorCount,
      affiliateCommissionsCatchup: 0,
    },
    timestamp: new Date().toISOString(),
  };

  console.log('[Cron] Trade processing completed:', response);

  const tradesMissingCommission = await prisma.trade.findMany({
    where: {
      status: { in: ['AVAILABLE', 'PAYOUT_PENDING', 'PAID'] },
      affiliateCommissionProcessedAt: null,
      balanceCreditedAt: { not: null },
      OR: [{ affiliatePromoCode: { not: null } }, { user: { referredByAffiliateId: { not: null } } }],
    },
    select: { id: true },
    take: 50,
  });

  let commissionsProcessed = 0;
  for (const { id } of tradesMissingCommission) {
    try {
      await TradeHooks.onTradeAvailable(id);
      commissionsProcessed++;
    } catch (err) {
      console.error(`[Cron] Affiliate commission catchup failed for trade ${id}:`, err);
    }
  }

  return {
    ...response,
    stats: {
      ...response.stats,
      affiliateCommissionsCatchup: commissionsProcessed,
    },
  };
}
