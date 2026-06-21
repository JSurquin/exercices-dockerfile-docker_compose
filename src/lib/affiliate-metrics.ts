import { prisma } from '../../prisma/prisma';
import { AFFILIATE_COMMISSION_ELIGIBLE_STATUSES } from '@/lib/affiliate-commission-logic';

export interface AffiliateExtendedMetrics {
  totalReferredUsers: number;
  churnedUsers: number;
  activeReferrals: number;
  activeSellingUsers: number;
  volumeThisMonthCents: number;
  volumePreviousMonthCents: number;
  retentionRate: number;
}

function monthBounds(offsetMonths: number): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offsetMonths + 1, 1);
  return { start, end };
}

/**
 * Métriques étendues pour le dashboard affilié et le classement admin.
 */
export async function computeAffiliateExtendedMetrics(
  affiliateId: string
): Promise<AffiliateExtendedMetrics> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const thisMonth = monthBounds(0);
  const prevMonth = monthBounds(-1);

  const [
    totalReferredUsers,
    churnedUsers,
    activeReferrals,
    activeSellingUsers,
    volumeThisMonthAgg,
    volumePreviousMonthAgg,
  ] = await Promise.all([
    prisma.affiliateReferral.count({ where: { affiliateId } }),
    prisma.affiliateReferral.count({
      where: { affiliateId, isActive: false, churnedAt: { not: null } },
    }),
    prisma.user.count({ where: { referredByAffiliateId: affiliateId } }),
    prisma.user.count({
      where: {
        referredByAffiliateId: affiliateId,
        trades: {
          some: {
            createdAt: { gte: thirtyDaysAgo },
            status: { in: AFFILIATE_COMMISSION_ELIGIBLE_STATUSES },
          },
        },
      },
    }),
    prisma.trade.aggregate({
      _sum: { grossCents: true },
      where: {
        user: { referredByAffiliateId: affiliateId },
        createdAt: { gte: thisMonth.start, lt: thisMonth.end },
        status: { in: AFFILIATE_COMMISSION_ELIGIBLE_STATUSES },
      },
    }),
    prisma.trade.aggregate({
      _sum: { grossCents: true },
      where: {
        user: { referredByAffiliateId: affiliateId },
        createdAt: { gte: prevMonth.start, lt: prevMonth.end },
        status: { in: AFFILIATE_COMMISSION_ELIGIBLE_STATUSES },
      },
    }),
  ]);

  const retentionRate =
    totalReferredUsers > 0 ? activeReferrals / totalReferredUsers : 0;

  return {
    totalReferredUsers,
    churnedUsers,
    activeReferrals,
    activeSellingUsers,
    volumeThisMonthCents: volumeThisMonthAgg._sum?.grossCents ?? 0,
    volumePreviousMonthCents: volumePreviousMonthAgg._sum?.grossCents ?? 0,
    retentionRate,
  };
}

export interface AffiliateRankingRow {
  affiliateId: string;
  code: string;
  steamUsername: string | null;
  steamAvatar: string | null;
  totalVolumeCents: number;
  activeReferrals: number;
  retentionRate: number;
  totalReferredUsers: number;
}

/**
 * Classement des affiliés par volume, referrals actifs et rétention.
 */
export async function getAffiliateRankings(limit = 20): Promise<AffiliateRankingRow[]> {
  const affiliates = await prisma.affiliateStats.findMany({
    where: { isActive: true },
    include: {
      user: { select: { steamUsername: true, steamAvatar: true } },
    },
    orderBy: { totalVolumeCents: 'desc' },
    take: limit,
  });

  const rows: AffiliateRankingRow[] = [];
  for (const aff of affiliates) {
    const metrics = await computeAffiliateExtendedMetrics(aff.id);
    rows.push({
      affiliateId: aff.id,
      code: aff.code,
      steamUsername: aff.user.steamUsername,
      steamAvatar: aff.user.steamAvatar,
      totalVolumeCents: aff.totalVolumeCents,
      activeReferrals: metrics.activeReferrals,
      retentionRate: metrics.retentionRate,
      totalReferredUsers: metrics.totalReferredUsers,
    });
  }

  return rows;
}
