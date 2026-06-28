import { prisma } from '~/prisma/prisma';
import { TradeHooks } from '@/lib/trade-hooks';
import { syncTradeStatusFromSkinplace } from '@/lib/skinplace-trade-sync';

export async function runUpdateTradesStatusJob() {
  console.log('🔄 Démarrage du cron job de mise à jour des trades...');

  const trades = await prisma.trade.findMany({
    where: {
      status: {
        in: ['CREATED', 'ACCEPTED_BY_BOT', 'IN_TRADE_HOLD'],
      },
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
    select: {
      id: true,
      userId: true,
      ticketId: true,
      skinplaceToken: true,
      status: true,
      availableAt: true,
      tradeAcceptedAt: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  console.log(`📊 ${trades.length} trades à vérifier`);

  if (trades.length === 0) {
    return {
      success: true as const,
      message: 'Aucun trade à mettre à jour',
      stats: {
        total: 0,
        updated: 0,
        unchanged: 0,
        errors: 0,
      },
      details: [] as unknown[],
    };
  }

  const results = await Promise.allSettled(
    trades.map((trade) => syncTradeStatusFromSkinplace(trade, 'cron_job')),
  );

  let updated = 0;
  let unchanged = 0;
  let errors = 0;

  const details = results.map((result, index) => {
    const trade = trades[index];
    if (result.status === 'fulfilled') {
      const value = result.value;
      if (value.updated) {
        updated++;
        console.log(
          `✅ Trade ${trade.id} mis à jour: ${value.oldStatus} -> ${value.newStatus} (${value.effectiveSource})`,
        );
        return {
          tradeId: trade.id,
          status: 'updated',
          oldStatus: value.oldStatus,
          newStatus: value.newStatus,
          effectiveSource: value.effectiveSource,
        };
      }
      unchanged++;
      return {
        tradeId: trade.id,
        status: 'unchanged',
        reason: value.reason,
      };
    }
    errors++;
    return {
      tradeId: trade.id,
      status: 'error',
      error: result.reason,
    };
  });

  console.log(`✅ Cron job terminé: ${updated} mis à jour, ${unchanged} inchangés, ${errors} erreurs`);

  const catchupCount = await TradeHooks.catchupMissingAcceptanceCredit(50);
  if (catchupCount > 0) {
    console.log(`[Cron] Catchup: ${catchupCount} trade(s) crédité(s) (acceptation manquée)`);
  }

  const pendingRevertCatchup = await TradeHooks.catchupMissingPendingRevert(50);
  if (pendingRevertCatchup > 0) {
    console.log(`[Cron] Catchup: ${pendingRevertCatchup} trade(s) pending reverté(s) (annulation/échec)`);
  }

  return {
    success: true as const,
    message: 'Mise à jour des trades terminée',
    stats: {
      total: trades.length,
      updated,
      unchanged,
      errors,
      acceptanceCreditCatchup: catchupCount,
      pendingRevertCatchup,
    },
    details: details.filter((d) => d.status === 'updated' || d.status === 'error'),
  };
}
