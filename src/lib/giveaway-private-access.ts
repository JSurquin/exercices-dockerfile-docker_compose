import type { NextRequest } from 'next/server';
import type { Prisma, TradeStatus } from '@prisma/client';
import { prisma } from '~/prisma/prisma';
import { normalizeAffiliateCode } from '@/lib/affiliate-commission-logic';

export const AFFILIATE_GIVEAWAY_RECENT_SALE_DAYS = 30;

const NON_COUNTING_TRADE_STATUSES: TradeStatus[] = ['FAILED', 'CANCELLED'];

export function parseAffiliateRefFromRequest(request: NextRequest): string | null {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const affiliateCookie = cookieHeader
    .split(';')
    .find((c) => c.trim().startsWith('ctf_affiliate_ref='))
    ?.split('=')[1]
    ?.trim();
  const refParam = new URL(request.url).searchParams.get('ref');
  return refParam ?? affiliateCookie ?? null;
}

export function affiliateCodesMatch(
  ref: string | null | undefined,
  requiredCode: string | null | undefined
): boolean {
  if (!ref || !requiredCode) return false;
  return normalizeAffiliateCode(ref) === normalizeAffiliateCode(requiredCode);
}

/** Tous les giveaways sont visibles (privés affiliés grisés côté UI si non éligible). */
export function buildGiveawayVisibilityOr(
  _affiliateRef: string | null,
  _viewerUserId: string | null,
  viewerIsAdmin = false
): Prisma.GiveawayWhereInput[] {
  if (viewerIsAdmin) {
    return [{}];
  }
  return [{}];
}

export type GiveawayParticipationEligibility = {
  referredAffiliateCode: string | null;
  ownerAffiliateCode: string | null;
  recentSaleAffiliateCodes: Set<string>;
  ownedGiveawayRequestIds: Set<string>;
};

export async function loadGiveawayParticipationEligibility(
  viewerUserId: string
): Promise<GiveawayParticipationEligibility> {
  const since = new Date();
  since.setDate(since.getDate() - AFFILIATE_GIVEAWAY_RECENT_SALE_DAYS);

  const [user, affiliateStats, recentTrades, ownedRequests] = await Promise.all([
    prisma.user.findUnique({
      where: { id: viewerUserId },
      select: { referredByAffiliateId: true },
    }),
    prisma.affiliateStats.findFirst({
      where: { userId: viewerUserId, isActive: true },
      select: { code: true },
    }),
    prisma.trade.findMany({
      where: {
        userId: viewerUserId,
        createdAt: { gte: since },
        status: { notIn: NON_COUNTING_TRADE_STATUSES },
        affiliatePromoCode: { not: null },
      },
      select: { affiliatePromoCode: true },
    }),
    prisma.affiliateGiveawayRequest.findMany({
      where: { userId: viewerUserId },
      select: { giveawayId: true },
    }),
  ]);

  let referredAffiliateCode: string | null = null;
  if (user?.referredByAffiliateId) {
    const refAffiliate = await prisma.affiliateStats.findUnique({
      where: { id: user.referredByAffiliateId },
      select: { code: true, isActive: true },
    });
    if (refAffiliate?.isActive) {
      referredAffiliateCode = refAffiliate.code;
    }
  }

  return {
    referredAffiliateCode,
    ownerAffiliateCode: affiliateStats?.code ?? null,
    recentSaleAffiliateCodes: new Set(
      recentTrades
        .map((t) => t.affiliatePromoCode)
        .filter((c): c is string => !!c)
        .map(normalizeAffiliateCode)
    ),
    ownedGiveawayRequestIds: new Set(
      ownedRequests.map((r) => r.giveawayId).filter((id): id is string => !!id)
    ),
  };
}

export function checkPrivateGiveawayParticipation(
  giveaway: {
    id: string;
    isPrivate: boolean;
    requiredAffiliateCode: string | null;
  },
  opts: {
    viewerUserId: string | null;
    viewerIsAdmin?: boolean;
    eligibility?: GiveawayParticipationEligibility | null;
  }
): boolean {
  const { viewerUserId, viewerIsAdmin = false, eligibility } = opts;

  if (viewerIsAdmin) return true;
  if (!giveaway.isPrivate || !giveaway.requiredAffiliateCode) return true;
  if (!viewerUserId) return false;

  const requiredCode = giveaway.requiredAffiliateCode;

  if (eligibility) {
    if (affiliateCodesMatch(eligibility.ownerAffiliateCode, requiredCode)) return true;
    if (eligibility.ownedGiveawayRequestIds.has(giveaway.id)) return true;
    if (affiliateCodesMatch(eligibility.referredAffiliateCode, requiredCode)) return true;
    if (eligibility.recentSaleAffiliateCodes.has(normalizeAffiliateCode(requiredCode))) {
      return true;
    }
    return false;
  }

  return false;
}

export async function canAccessPrivateGiveaway(input: {
  giveaway: {
    id: string;
    isPrivate: boolean;
    requiredAffiliateCode: string | null;
  };
  affiliateRef: string | null;
  viewerUserId: string | null;
  viewerIsAdmin?: boolean;
  eligibility?: GiveawayParticipationEligibility | null;
}): Promise<boolean> {
  const { giveaway, viewerUserId, viewerIsAdmin = false, eligibility } = input;

  if (viewerIsAdmin) return true;
  if (!giveaway.isPrivate || !giveaway.requiredAffiliateCode) return true;
  if (!viewerUserId) return false;

  const resolvedEligibility =
    eligibility ?? (await loadGiveawayParticipationEligibility(viewerUserId));

  return checkPrivateGiveawayParticipation(giveaway, {
    viewerUserId,
    viewerIsAdmin,
    eligibility: resolvedEligibility,
  });
}
