import { Prisma, TradeStatus } from '@prisma/client';
import { prisma } from '~/prisma/prisma';

/** Même filtre que le panel admin pour le volume (hors annulés / échecs). */
const PLATFORM_VOLUME_TRADE_WHERE = {
  status: { notIn: [TradeStatus.CANCELLED, TradeStatus.FAILED] },
};

/** Trades complétés (AVAILABLE / PAYOUT_PENDING / PAID). */
export const COMPLETED_TRADE_STATUSES: TradeStatus[] = [
  TradeStatus.AVAILABLE,
  TradeStatus.PAYOUT_PENDING,
  TradeStatus.PAID,
];

/**
 * Compteur cumulatif « skins échangés » : trades complétés + trades déjà crédités
 * (balanceCreditedAt) même si annulés ensuite — le total ne diminue jamais.
 */
export const EXCHANGED_SKINS_TRADE_WHERE: Prisma.TradeWhereInput = {
  OR: [
    { status: { in: COMPLETED_TRADE_STATUSES } },
    { balanceCreditedAt: { not: null } },
  ],
};

/** Date de début du comptage public « skins échangés » (affichée admin + homepage). */
export const EXCHANGED_SKINS_COUNT_SINCE = new Date(
  process.env.PLATFORM_EXCHANGED_SKINS_COUNT_SINCE ?? '2025-01-01T00:00:00.000Z',
);

export function exchangedSkinsTradeWhereSince(
  since: Date = EXCHANGED_SKINS_COUNT_SINCE,
): Prisma.TradeWhereInput {
  return {
    AND: [EXCHANGED_SKINS_TRADE_WHERE, { createdAt: { gte: since } }],
  };
}

export type PlatformStatsRaw = {
  totalUsers: number;
  totalTrades: number;
  totalVolumeCents: number;
  totalSkinsSold: number;
  skinsCountSince: string;
};

/** Métriques plateforme — mêmes requêtes que /api/admin/stats (Total Users, Trades, Volume). */
export async function fetchPlatformStatsFromDb(): Promise<PlatformStatsRaw> {
  const skinsWhere = exchangedSkinsTradeWhereSince();

  const [totalUsers, totalTrades, volumeResult, totalSkinsSold] = await Promise.all([
    prisma.user.count(),
    prisma.trade.count(),
    prisma.trade.aggregate({
      _sum: { grossCents: true },
      where: PLATFORM_VOLUME_TRADE_WHERE,
    }),
    prisma.tradeItem.count({
      where: { trade: skinsWhere },
    }),
  ]);

  return {
    totalUsers,
    totalTrades,
    totalVolumeCents: volumeResult._sum?.grossCents ?? 0,
    totalSkinsSold,
    skinsCountSince: EXCHANGED_SKINS_COUNT_SINCE.toISOString(),
  };
}
