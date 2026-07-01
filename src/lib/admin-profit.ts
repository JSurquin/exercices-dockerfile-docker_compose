import { TradeStatus } from '@prisma/client';
import { startOfDay, startOfMonth } from 'date-fns';
import { prisma } from '~/prisma/prisma';
import { skinplaceService } from '@/lib/skinplace';

/** Profit compté dès l’entrée en hold (IPN #1), pas seulement après crédit balance. */
export const PROFIT_COUNTED_TRADE_STATUSES: TradeStatus[] = [
  TradeStatus.IN_TRADE_HOLD,
  TradeStatus.AVAILABLE,
  TradeStatus.PAYOUT_PENDING,
  TradeStatus.PAID,
];

export type AdminProfitTradeRow = {
  tradeId: string;
  ticketId: string;
  userName: string;
  paidToUserCentimes: number;
  skinplaceCentimes: number;
  bonusCentimes: number;
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

type ProfitTradeRow = {
  id: string;
  ticketId: string;
  grossCents: number;
  affiliatePromoBonusCents: number;
  vipBonusCents: number;
  createdAt: Date;
  pendingCreditedAt: Date | null;
  tradeAcceptedAt: Date | null;
  instantCreditedAt: Date | null;
  balanceCreditedAt: Date | null;
  user: { steamUsername: string | null; name: string | null } | null;
};

const SKINPLACE_BATCH_SIZE = 50;
const SKINPLACE_BATCH_CONCURRENCY = 4;

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

function priceToCents(value: unknown): number | null {
  if (typeof value === 'number' && value > 0) {
    return Math.round(value * 100);
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.round(parsed * 100);
    }
  }
  return null;
}

/** Prix marché Skinplace (sans multiplicateur user) — base de la marge plateforme (~5 % / ~1 %). */
export function extractSkinplacePriceCents(entry: Record<string, unknown>): number | null {
  const steamtrade = entry.steamtrade as Record<string, unknown> | undefined;
  const marketPrice = priceToCents(steamtrade?.price_market);
  if (marketPrice != null) return marketPrice;

  const payment = entry.payment as Record<string, unknown> | undefined;
  const paymentAmount = priceToCents(payment?.amount);
  const multiplierAmount = priceToCents(payment?.multiplier_amount);
  if (paymentAmount != null && multiplierAmount != null) {
    return paymentAmount + multiplierAmount;
  }

  const tradePrice = priceToCents(steamtrade?.price);
  if (tradePrice != null) return tradePrice;

  if (paymentAmount != null) return paymentAmount;

  return null;
}

/** Date de comptage : acceptation / hold (IPN #1), pas le crédit balance différé. */
export function profitAttributionDate(trade: {
  pendingCreditedAt: Date | null;
  tradeAcceptedAt: Date | null;
  instantCreditedAt: Date | null;
  balanceCreditedAt: Date | null;
  createdAt: Date;
}): Date {
  return (
    trade.pendingCreditedAt ??
    trade.tradeAcceptedAt ??
    trade.instantCreditedAt ??
    trade.balanceCreditedAt ??
    trade.createdAt
  );
}

function marginPercent(profitCentimes: number, skinplaceCentimes: number): number {
  if (skinplaceCentimes <= 0) return 0;
  return Math.round((profitCentimes / skinplaceCentimes) * 1000) / 10;
}

function ingestHistoryEntries(
  map: Map<string, number>,
  entries: unknown[] | undefined,
): void {
  if (!entries?.length) return;

  for (const raw of entries) {
    const entry = unwrapHistoryEntry(raw);
    if (!entry) continue;
    const orderId = extractOrderId(entry);
    const priceCents = extractSkinplacePriceCents(entry);
    if (orderId && priceCents != null) {
      map.set(orderId, priceCents);
    }
  }
}

async function fetchSkinplacePricesForOrderIds(orderIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (orderIds.length === 0) return map;

  const uniqueIds = [...new Set(orderIds)];
  const chunks: string[][] = [];
  for (let i = 0; i < uniqueIds.length; i += SKINPLACE_BATCH_SIZE) {
    chunks.push(uniqueIds.slice(i, i + SKINPLACE_BATCH_SIZE));
  }

  for (let i = 0; i < chunks.length; i += SKINPLACE_BATCH_CONCURRENCY) {
    const batch = chunks.slice(i, i + SKINPLACE_BATCH_CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((orderIdsChunk) => skinplaceService.getInstantHistoryByOrderIds(orderIdsChunk)),
    );

    for (const result of results) {
      if (result.status !== 'fulfilled') {
        console.error('[AdminProfit] Skinplace batch fetch failed:', result.reason);
        continue;
      }
      ingestHistoryEntries(map, result.value.data);
    }
  }

  return map;
}

export function buildAdminProfitTradeRow(
  trade: ProfitTradeRow,
  skinplaceByOrderId: Map<string, number>,
): AdminProfitTradeRow | null {
  const skinplaceCentimes = skinplaceByOrderId.get(trade.ticketId);
  if (skinplaceCentimes == null) return null;

  const paidToUserCentimes = trade.grossCents;
  const bonusCentimes = trade.affiliatePromoBonusCents + trade.vipBonusCents;
  const profitCentimes = skinplaceCentimes - paidToUserCentimes;
  const tradeDate = profitAttributionDate(trade);

  return {
    tradeId: trade.id,
    ticketId: trade.ticketId,
    userName: (trade.user?.steamUsername || trade.user?.name || 'Inconnu').trim() || 'Inconnu',
    paidToUserCentimes,
    skinplaceCentimes,
    bonusCentimes,
    profitCentimes,
    marginPercent: marginPercent(profitCentimes, skinplaceCentimes),
    createdAt: tradeDate.toISOString(),
  };
}

export async function getAdminProfitMetrics(): Promise<AdminProfitMetrics> {
  const trades = await prisma.trade.findMany({
    where: { status: { in: PROFIT_COUNTED_TRADE_STATUSES } },
    select: {
      id: true,
      ticketId: true,
      grossCents: true,
      affiliatePromoBonusCents: true,
      vipBonusCents: true,
      createdAt: true,
      pendingCreditedAt: true,
      tradeAcceptedAt: true,
      instantCreditedAt: true,
      balanceCreditedAt: true,
      user: { select: { steamUsername: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  let skinplaceByOrderId = new Map<string, number>();
  try {
    skinplaceByOrderId = await fetchSkinplacePricesForOrderIds(trades.map((trade) => trade.ticketId));
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
  const computedRows: AdminProfitTradeRow[] = [];

  for (const trade of trades) {
    const row = buildAdminProfitTradeRow(trade, skinplaceByOrderId);
    if (!row) continue;

    const tradeDate = new Date(row.createdAt);
    totalProfitCentimes += row.profitCentimes;
    totalSkinplaceCentimes += row.skinplaceCentimes;
    matchedTrades += 1;

    if (tradeDate >= todayStart) {
      todayProfitCentimes += row.profitCentimes;
    }
    if (tradeDate >= monthStart) {
      monthProfitCentimes += row.profitCentimes;
    }

    computedRows.push(row);
  }

  computedRows.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

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
    recentTrades: computedRows.slice(0, 10),
  };
}
