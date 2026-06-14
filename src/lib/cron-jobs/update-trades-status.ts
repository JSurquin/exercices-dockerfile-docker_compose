import { prisma } from '~/prisma/prisma';
import { TradeStatus } from '@prisma/client';
import { TradeHooks } from '@/lib/trade-hooks';

interface SkinplaceTradeStatusResponse {
  success: boolean;
  status?: string;
  steamtrade?: {
    tradeofferid: string;
    status: string;
    price: string;
    items_to_receive: number;
  };
  error?: string;
}

function mapSkinplaceStatusToTradeStatus(skinplaceStatus: string): TradeStatus {
  const statusMap: Record<string, TradeStatus> = {
    pending: 'CREATED',
    sent: 'CREATED',
    created: 'CREATED',
    accepted: 'ACCEPTED_BY_BOT',
    active: 'IN_TRADE_HOLD',
    trade_hold: 'IN_TRADE_HOLD',
    completed: 'AVAILABLE',
    done: 'AVAILABLE',
    declined: 'FAILED',
    rejected: 'FAILED',
    expired: 'FAILED',
    cancelled: 'FAILED',
    failed: 'FAILED',
  };

  return statusMap[skinplaceStatus.toLowerCase()] || 'CREATED';
}

async function updateTradeStatus(trade: {
  id: string;
  userId: string;
  steamId: string;
  ticketId: string;
  status: TradeStatus;
  availableAt: Date | null;
  tradeAcceptedAt: Date | null;
}) {
  const privateKey = process.env.SKINPLACE_API_KEY_PRIVATE;
  const publicKey = process.env.SKINPLACE_API_KEY_PUBLIC;

  if (!privateKey || !publicKey) {
    console.warn('⚠️  Clés API Skinplace manquantes, impossible de vérifier le trade', trade.id);
    return { updated: false, reason: 'missing_api_keys' };
  }

  try {
    const response = await fetch(`https://api.skin.place/api/v3/instant/status/${trade.ticketId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MoonSkin/1.0',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn(`⚠️  Erreur API Skinplace pour trade ${trade.id}: ${response.status}`);
      return { updated: false, reason: 'api_error', status: response.status };
    }

    const data: SkinplaceTradeStatusResponse = await response.json();
    const skinplaceStatus = data.status || data.steamtrade?.status;

    if (!skinplaceStatus) {
      console.warn(`⚠️  Pas de statut dans la réponse Skinplace pour trade ${trade.id}`);
      return { updated: false, reason: 'no_status' };
    }

    const newStatus = mapSkinplaceStatusToTradeStatus(skinplaceStatus);
    const oldStatus = trade.status;

    const statusOrder: TradeStatus[] = [
      'CREATED',
      'ACCEPTED_BY_BOT',
      'IN_TRADE_HOLD',
      'AVAILABLE',
      'PAYOUT_PENDING',
      'PAID',
    ];

    const oldStatusIndex = statusOrder.indexOf(oldStatus);
    const newStatusIndex = statusOrder.indexOf(newStatus);

    if (newStatus === oldStatus) {
      return { updated: false, reason: 'same_status' };
    }

    if (newStatus !== 'FAILED' && newStatusIndex <= oldStatusIndex) {
      return { updated: false, reason: 'no_progression' };
    }

    let availableAt = trade.availableAt;
    let tradeAcceptedAt = trade.tradeAcceptedAt;

    if (newStatus === 'ACCEPTED_BY_BOT' && !availableAt) {
      availableAt = new Date();
      availableAt.setDate(availableAt.getDate() + 7);
      tradeAcceptedAt = new Date();
    } else if (newStatus === 'AVAILABLE') {
      availableAt = new Date();
    }

    await prisma.trade.update({
      where: { id: trade.id },
      data: {
        status: newStatus,
        availableAt,
        tradeAcceptedAt,
        updatedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: trade.userId,
        action: 'TRADE_STATUS_UPDATED',
        details: {
          tradeId: trade.id,
          oldStatus,
          newStatus,
          skinplaceStatus,
          source: 'cron_job',
        },
        ipAddress: 'cron',
      },
    });

    console.log(`✅ Trade ${trade.id} mis à jour: ${oldStatus} -> ${newStatus} (Skinplace: ${skinplaceStatus})`);

    try {
      if (newStatus === 'ACCEPTED_BY_BOT') {
        await TradeHooks.onTradeAccepted(trade.userId, trade.id);
      } else if (newStatus === 'AVAILABLE') {
        await TradeHooks.onTradeAvailable(trade.id);
      } else if (newStatus === 'FAILED' || newStatus === 'CANCELLED') {
        await TradeHooks.onTradeStatusChanged(trade.id, oldStatus, newStatus);
      }
    } catch (hookError) {
      console.error(`[Cron] TradeHooks error for trade ${trade.id}:`, hookError);
    }

    return {
      updated: true,
      oldStatus,
      newStatus,
      skinplaceStatus,
    };
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour du trade ${trade.id}:`, error);
    return {
      updated: false,
      reason: 'error',
      error: error instanceof Error ? error.message : 'unknown',
    };
  }
}

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
      steamId: true,
      ticketId: true,
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

  const results = await Promise.allSettled(trades.map((trade) => updateTradeStatus(trade)));

  let updated = 0;
  let unchanged = 0;
  let errors = 0;

  const details = results.map((result, index) => {
    const trade = trades[index];
    if (result.status === 'fulfilled') {
      const value = result.value;
      if (value.updated) {
        updated++;
        return {
          tradeId: trade.id,
          status: 'updated',
          oldStatus: value.oldStatus,
          newStatus: value.newStatus,
          skinplaceStatus: value.skinplaceStatus,
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

  return {
    success: true as const,
    message: 'Mise à jour des trades terminée',
    stats: {
      total: trades.length,
      updated,
      unchanged,
      errors,
    },
    details: details.filter((d) => d.status === 'updated' || d.status === 'error'),
  };
}
