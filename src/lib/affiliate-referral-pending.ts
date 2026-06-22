import type { Prisma, TradeStatus } from '@prisma/client';
import { prisma } from '../../prisma/prisma';
import { normalizeAffiliateCode } from '@/lib/affiliate-commission-logic';

/** Trades filleuls encore en cours (non commissionnés). */
export const AFFILIATE_PENDING_TRADE_STATUSES: TradeStatus[] = [
  'CREATED',
  'ACCEPTED_BY_BOT',
  'IN_TRADE_HOLD',
];

export interface ReferralPendingSale {
  grossCents: number;
  status: TradeStatus;
}

function pendingTradesWhereForAffiliate(
  affiliateId: string,
  affiliateCode: string
): Prisma.TradeWhereInput {
  const normalizedCode = normalizeAffiliateCode(affiliateCode);
  return {
    status: { in: AFFILIATE_PENDING_TRADE_STATUSES },
    OR: [
      {
        affiliateAttributionCode: {
          equals: normalizedCode,
          mode: 'insensitive',
        },
      },
      {
        affiliateAttributionCode: null,
        user: { referredByAffiliateId: affiliateId },
      },
    ],
  };
}

/** Volume brut en attente pour tous les filleuls d'un affilié (attribution figée par vente). */
export async function computeAffiliatePendingVolumeCents(
  affiliateId: string
): Promise<number> {
  const affiliate = await prisma.affiliateStats.findUnique({
    where: { id: affiliateId },
    select: { code: true },
  });
  if (!affiliate) return 0;

  const agg = await prisma.trade.aggregate({
    _sum: { grossCents: true },
    where: pendingTradesWhereForAffiliate(affiliateId, affiliate.code),
  });
  return agg._sum?.grossCents ?? 0;
}

/** Dernière vente en cours par filleul (pour badge UI), filtrée par affilié si fourni. */
export async function loadPendingSalesByUserIds(
  userIds: string[],
  options?: { affiliateId: string; affiliateCode: string }
): Promise<Map<string, ReferralPendingSale>> {
  const map = new Map<string, ReferralPendingSale>();
  if (userIds.length === 0) return map;

  const where: Prisma.TradeWhereInput = {
    userId: { in: userIds },
    status: { in: AFFILIATE_PENDING_TRADE_STATUSES },
  };

  if (options) {
    const normalizedCode = normalizeAffiliateCode(options.affiliateCode);
    where.OR = [
      {
        affiliateAttributionCode: {
          equals: normalizedCode,
          mode: 'insensitive',
        },
      },
      {
        affiliateAttributionCode: null,
        user: { referredByAffiliateId: options.affiliateId },
      },
    ];
  }

  const trades = await prisma.trade.findMany({
    where,
    select: { userId: true, grossCents: true, status: true },
    orderBy: { createdAt: 'desc' },
  });

  for (const trade of trades) {
    if (!map.has(trade.userId)) {
      map.set(trade.userId, {
        grossCents: trade.grossCents,
        status: trade.status,
      });
    }
  }

  return map;
}
