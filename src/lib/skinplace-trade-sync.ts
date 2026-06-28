import type { TradeStatus } from '@prisma/client';
import { prisma } from '~/prisma/prisma';
import { skinplaceService } from '@/lib/skinplace';
import { resolveMoonSkinTradeStatusFromSkinplaceApi } from '@/lib/skinplace-trade-status-resolve';
import { TradeHooks } from '@/lib/trade-hooks';
import { logger } from '@/lib/logger';

type TradeSyncRow = {
  id: string;
  userId: string;
  ticketId: string;
  skinplaceToken: string | null;
  status: TradeStatus;
  availableAt: Date | null;
  tradeAcceptedAt: Date | null;
};

export type SkinplaceTradeSyncResult =
  | { updated: false; reason: string }
  | {
      updated: true;
      oldStatus: TradeStatus;
      newStatus: TradeStatus;
      effectiveSource: string;
    };

async function fetchSkinplacePayload(trade: TradeSyncRow): Promise<unknown | null> {
  if (trade.skinplaceToken) {
    try {
      return await skinplaceService.getTradeStatus(trade.skinplaceToken);
    } catch (error) {
      logger.warn(`[SkinplaceSync] token lookup failed for trade ${trade.id}`, error);
    }
  }

  if (!trade.ticketId) {
    return null;
  }

  try {
    const historyData = await skinplaceService.getInstantHistoryByOrderIds([trade.ticketId]);
    const entry = (historyData as { data?: unknown[] })?.data?.[0];
    if (!entry) {
      return null;
    }

    const foundToken = (entry as { token?: string }).token;
    if (foundToken && !trade.skinplaceToken) {
      await prisma.trade.update({
        where: { id: trade.id },
        data: { skinplaceToken: foundToken },
      });
    }

    return entry;
  } catch (error) {
    logger.warn(`[SkinplaceSync] history lookup failed for trade ${trade.id}`, error);
    return null;
  }
}

/**
 * Interroge Skinplace et progresse le statut local si la source externe l'exige.
 * Utilisé par le cron et les syncs admin (source de vérité = Skinplace, pas l'utilisateur).
 */
export async function syncTradeStatusFromSkinplace(
  trade: TradeSyncRow,
  source: string,
): Promise<SkinplaceTradeSyncResult> {
  const payload = await fetchSkinplacePayload(trade);
  if (!payload) {
    return { updated: false, reason: 'no_skinplace_payload' };
  }

  const resolved = resolveMoonSkinTradeStatusFromSkinplaceApi(payload);
  const newStatus = resolved.status;
  const oldStatus = trade.status;

  if (newStatus === oldStatus) {
    return { updated: false, reason: 'same_status' };
  }

  const statusOrder: TradeStatus[] = [
    'CREATED',
    'ACCEPTED_BY_BOT',
    'IN_TRADE_HOLD',
    'AVAILABLE',
    'PAYOUT_PENDING',
    'PAID',
  ];

  const oldIdx = statusOrder.indexOf(oldStatus);
  const newIdx = statusOrder.indexOf(newStatus);

  if (newStatus !== 'FAILED' && newStatus !== 'CANCELLED' && newIdx <= oldIdx) {
    return { updated: false, reason: 'no_progression' };
  }

  let availableAt = trade.availableAt;
  let tradeAcceptedAt = trade.tradeAcceptedAt;

  if (newStatus === 'ACCEPTED_BY_BOT' && !availableAt) {
    availableAt = new Date();
    availableAt.setDate(availableAt.getDate() + 7);
    tradeAcceptedAt = new Date();
  } else if (newStatus === 'IN_TRADE_HOLD' && !availableAt) {
    availableAt = new Date();
    availableAt.setDate(availableAt.getDate() + 7);
    tradeAcceptedAt = tradeAcceptedAt ?? new Date();
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
        skinplaceDebug: resolved.debug,
        source,
      },
      ipAddress: source,
    },
  });

  try {
    await TradeHooks.applyStatusProgressionHooks(trade.userId, trade.id, oldStatus, newStatus);
  } catch (hookError) {
    logger.error(`[SkinplaceSync] TradeHooks error for trade ${trade.id}`, hookError);
  }

  return {
    updated: true,
    oldStatus,
    newStatus,
    effectiveSource: resolved.debug.effectiveSource,
  };
}
