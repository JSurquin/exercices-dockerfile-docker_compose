import { TradeStatus } from '@prisma/client';
import { prisma } from '../../prisma/prisma';

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

/** Volume brut en attente pour tous les filleuls d'un affilié. */
export async function computeAffiliatePendingVolumeCents(
  affiliateId: string
): Promise<number> {
  const agg = await prisma.trade.aggregate({
    _sum: { grossCents: true },
    where: {
      status: { in: AFFILIATE_PENDING_TRADE_STATUSES },
      user: { referredByAffiliateId: affiliateId },
    },
  });
  return agg._sum?.grossCents ?? 0;
}

/** Dernière vente en cours par filleul (pour badge UI). */
export async function loadPendingSalesByUserIds(
  userIds: string[]
): Promise<Map<string, ReferralPendingSale>> {
  const map = new Map<string, ReferralPendingSale>();
  if (userIds.length === 0) return map;

  const trades = await prisma.trade.findMany({
    where: {
      userId: { in: userIds },
      status: { in: AFFILIATE_PENDING_TRADE_STATUSES },
    },
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
