import { prisma } from '../../prisma/prisma';
import { AFFILIATE_COMMISSION_ELIGIBLE_STATUSES } from '@/lib/affiliate-commission-logic';

export interface AffiliateAttributedTotals {
  totalVolumeCents: number;
  totalCommissionCents: number;
}

/**
 * Volume et commissions attribués à un affilié — source unique pour admin et dashboard affilié.
 * Agrège les filleuls (ledger) et les trades éligibles (AVAILABLE+), puis retient le max avec le stocké.
 */
export async function computeAffiliateAttributedTotals(
  affiliateId: string
): Promise<AffiliateAttributedTotals> {
  const [referralAgg, tradeAgg, commissionAgg, stored] = await Promise.all([
    prisma.affiliateReferral.aggregate({
      _sum: { volumeCents: true, commissionCents: true },
      where: { affiliateId },
    }),
    prisma.trade.aggregate({
      _sum: { grossCents: true },
      where: {
        status: { in: AFFILIATE_COMMISSION_ELIGIBLE_STATUSES },
        affiliateCommissions: {
          some: { affiliateId, status: { not: 'CANCELLED' } },
        },
      },
    }),
    prisma.affiliateCommission.aggregate({
      _sum: { amountCents: true },
      where: { affiliateId, status: { not: 'CANCELLED' } },
    }),
    prisma.affiliateStats.findUnique({
      where: { id: affiliateId },
      select: { totalVolumeCents: true, totalCommissionCents: true },
    }),
  ]);

  const referralVolume = referralAgg._sum?.volumeCents ?? 0;
  const referralCommission = referralAgg._sum?.commissionCents ?? 0;
  const tradeVolume = tradeAgg._sum?.grossCents ?? 0;
  const commissionSum = commissionAgg._sum?.amountCents ?? 0;

  return {
    totalVolumeCents: Math.max(
      referralVolume,
      tradeVolume,
      stored?.totalVolumeCents ?? 0
    ),
    totalCommissionCents: Math.max(
      referralCommission,
      commissionSum,
      stored?.totalCommissionCents ?? 0
    ),
  };
}

/** Totaux agrégés pour plusieurs affiliés (liste admin). */
export async function computeAffiliateAttributedTotalsBatch(
  affiliateIds: string[]
): Promise<Map<string, AffiliateAttributedTotals>> {
  const map = new Map<string, AffiliateAttributedTotals>();
  if (affiliateIds.length === 0) return map;

  const [referralGroups, commissionGroups, storedStats] = await Promise.all([
    prisma.affiliateReferral.groupBy({
      by: ['affiliateId'],
      where: { affiliateId: { in: affiliateIds } },
      _sum: { volumeCents: true, commissionCents: true },
    }),
    prisma.affiliateCommission.groupBy({
      by: ['affiliateId'],
      where: { affiliateId: { in: affiliateIds }, status: { not: 'CANCELLED' } },
      _sum: { amountCents: true },
    }),
    prisma.affiliateStats.findMany({
      where: { id: { in: affiliateIds } },
      select: { id: true, totalVolumeCents: true, totalCommissionCents: true },
    }),
  ]);

  const referralByAffiliate = new Map(
    referralGroups.map((g) => [g.affiliateId, g._sum])
  );
  const commissionByAffiliate = new Map(
    commissionGroups.map((g) => [g.affiliateId, g._sum?.amountCents ?? 0])
  );
  const storedByAffiliate = new Map(storedStats.map((s) => [s.id, s]));

  for (const id of affiliateIds) {
    const referral = referralByAffiliate.get(id);
    const stored = storedByAffiliate.get(id);
    map.set(id, {
      totalVolumeCents: Math.max(
        referral?.volumeCents ?? 0,
        stored?.totalVolumeCents ?? 0
      ),
      totalCommissionCents: Math.max(
        referral?.commissionCents ?? 0,
        commissionByAffiliate.get(id) ?? 0,
        stored?.totalCommissionCents ?? 0
      ),
    });
  }

  return map;
}

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
  const affiliateIds = affiliates.map((a) => a.id);
  const attributedTotals = await computeAffiliateAttributedTotalsBatch(affiliateIds);

  for (const aff of affiliates) {
    const metrics = await computeAffiliateExtendedMetrics(aff.id);
    const totals = attributedTotals.get(aff.id);
    rows.push({
      affiliateId: aff.id,
      code: aff.code,
      steamUsername: aff.user.steamUsername,
      steamAvatar: aff.user.steamAvatar,
      totalVolumeCents: totals?.totalVolumeCents ?? aff.totalVolumeCents,
      activeReferrals: metrics.activeReferrals,
      retentionRate: metrics.retentionRate,
      totalReferredUsers: metrics.totalReferredUsers,
    });
  }

  return rows.sort((a, b) => b.totalVolumeCents - a.totalVolumeCents);
}
