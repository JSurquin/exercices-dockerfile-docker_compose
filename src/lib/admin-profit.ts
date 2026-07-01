import { startOfDay, startOfMonth } from 'date-fns';
import { prisma } from '~/prisma/prisma';
import { skinplaceService } from '@/lib/skinplace';
import { COMPLETED_TRADE_STATUSES } from '@/lib/platform-stats';

export type AdminProfitTradeRow = {
  tradeId: string;
  ticketId: string;
  userName: string;
  paidToUserCentimes: number;
  skinplaceCentimes: number;
  profitCentimes: number;
  marginPercent: number;
  createdAt: string;
};

export type AdminProfitMetrics = {
  totalProfitCentimes: number;
  todayProfitCentimes: number;
  monthProfitCentimes: number;
  avgMarginPercent: number;
  matchedTrades: number;
  totalTrades: number;
  recentTrades: AdminProfitTradeRow[];
};

function unwrapHistoryEntry(entry: unknown): Record<string, unknown> | null {
  const root = entry as Record<string, unknown> | null;
  if (!root) return null;
  return (root.data != null ? root.data : root) as Record<string, unknown>;
}

function extractOrderId(entry: Record<string, unknown>): string | null {
  const payment = entry.payment as Record<string, unknown> | undefined;
  const orderId = payment?.order_id;
  return typeof orderId === 'string' ? orderId : null;
}

function extractSkinplacePriceCents(entry: Record<string, unknown>): number | null {
  const steamtrade = entry.steamtrade as Record<string, unknown> | undefined;
  const price = steamtrade?.price ?? steamtrade?.price_market;
  if (typeof price === 'number' && price > 0) {
    return Math.round(price * 100);
  }
  return null;
}

async function fetchSkinplacePriceByOrderId(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const limit = 100;
  const maxPages = 30;

  for (let page = 1; page <= maxPages; page += 1) {
    const history = await skinplaceService.getInstantHistory(page, limit);
    if (history.status !== 'success' || !history.data?.length) {
      break;
    }

    for (const raw of history.data) {
      const entry = unwrapHistoryEntry(raw);
      if (!entry) continue;
      const orderId = extractOrderId(entry);
      const priceCents = extractSkinplacePriceCents(entry);
      if (orderId && priceCents != null) {
        map.set(orderId, priceCents);
      }
    }

    if (history.data.length < limit) {
      break;
    }
  }

  return map;
}

function marginPercent(profitCentimes: number, skinplaceCentimes: number): number {
  if (skinplaceCentimes <= 0) return 0;
  return Math.round((profitCentimes / skinplaceCentimes) * 1000) / 10;
}

export async function getAdminProfitMetrics(): Promise<AdminProfitMetrics> {
  const trades = await prisma.trade.findMany({
    where: { status: { in: COMPLETED_TRADE_STATUSES } },
    select: {
      id: true,
      ticketId: true,
      netCents: true,
      createdAt: true,
      balanceCreditedAt: true,
      user: { select: { steamUsername: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  let skinplaceByOrderId = new Map<string, number>();
  try {
    skinplaceByOrderId = await fetchSkinplacePriceByOrderId();
  } catch (error) {
    console.error('[AdminProfit] Skinplace history fetch failed:', error);
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);

  let totalProfitCentimes = 0;
  let todayProfitCentimes = 0;
  let monthProfitCentimes = 0;
  let totalSkinplaceCentimes = 0;
  let matchedTrades = 0;
  const recentTrades: AdminProfitTradeRow[] = [];

  for (const trade of trades) {
    const skinplaceCentimes = skinplaceByOrderId.get(trade.ticketId);
    if (skinplaceCentimes == null) continue;

    const paidToUserCentimes = trade.netCents;
    const profitCentimes = skinplaceCentimes - paidToUserCentimes;
    const tradeMargin = marginPercent(profitCentimes, skinplaceCentimes);
    const tradeDate = trade.balanceCreditedAt ?? trade.createdAt;

    totalProfitCentimes += profitCentimes;
    totalSkinplaceCentimes += skinplaceCentimes;
    matchedTrades += 1;

    if (tradeDate >= todayStart) {
      todayProfitCentimes += profitCentimes;
    }
    if (tradeDate >= monthStart) {
      monthProfitCentimes += profitCentimes;
    }

    if (recentTrades.length < 10) {
      recentTrades.push({
        tradeId: trade.id,
        ticketId: trade.ticketId,
        userName: (trade.user?.steamUsername || trade.user?.name || 'Inconnu').trim() || 'Inconnu',
        paidToUserCentimes,
        skinplaceCentimes,
        profitCentimes,
        marginPercent: tradeMargin,
        createdAt: tradeDate.toISOString(),
      });
    }
  }

  const avgMarginPercent =
    totalSkinplaceCentimes > 0
      ? marginPercent(totalProfitCentimes, totalSkinplaceCentimes)
      : 0;

  return {
    totalProfitCentimes,
    todayProfitCentimes,
    monthProfitCentimes,
    avgMarginPercent,
    matchedTrades,
    totalTrades: trades.length,
    recentTrades,
  };
}
