import { TradeStatus } from '@prisma/client';
import { prisma } from '~/prisma/prisma';

/** Même filtre que le panel admin pour le volume (hors annulés / échecs). */
const PLATFORM_VOLUME_TRADE_WHERE = {
  status: { notIn: [TradeStatus.CANCELLED, TradeStatus.FAILED] },
};

export type PlatformStatsRaw = {
  totalUsers: number;
  totalTrades: number;
  totalVolumeCents: number;
  totalSkinsSold: number;
};

/** Métriques plateforme — mêmes requêtes que /api/admin/stats (Total Users, Trades, Volume). */
export async function fetchPlatformStatsFromDb(): Promise<PlatformStatsRaw> {
  const [totalUsers, totalTrades, volumeResult, totalSkinsSold] = await Promise.all([
    prisma.user.count(),
    prisma.trade.count(),
    prisma.trade.aggregate({
      _sum: { grossCents: true },
      where: PLATFORM_VOLUME_TRADE_WHERE,
    }),
    prisma.tradeItem.count({
      where: { trade: PLATFORM_VOLUME_TRADE_WHERE },
    }),
  ]);

  return {
    totalUsers,
    totalTrades,
    totalVolumeCents: volumeResult._sum?.grossCents ?? 0,
    totalSkinsSold,
  };
}
