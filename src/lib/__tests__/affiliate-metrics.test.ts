jest.mock('../../../prisma/prisma', () => ({
  prisma: {
    affiliateReferral: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    trade: {
      aggregate: jest.fn(),
    },
    affiliateCommission: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    affiliateStats: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    user: { count: jest.fn() },
  },
}));

import { prisma } from '../../../prisma/prisma';
import {
  computeAffiliateAttributedTotals,
  computeAffiliateAttributedTotalsBatch,
} from '@/lib/affiliate-metrics';

const referralAggregate = prisma.affiliateReferral.aggregate as jest.Mock;
const tradeAggregate = prisma.trade.aggregate as jest.Mock;
const commissionAggregate = prisma.affiliateCommission.aggregate as jest.Mock;
const statsFindUnique = prisma.affiliateStats.findUnique as jest.Mock;
const referralGroupBy = prisma.affiliateReferral.groupBy as jest.Mock;
const commissionGroupBy = prisma.affiliateCommission.groupBy as jest.Mock;
const statsFindMany = prisma.affiliateStats.findMany as jest.Mock;

describe('computeAffiliateAttributedTotals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the highest volume and commission across sources', async () => {
    referralAggregate.mockResolvedValue({
      _sum: { volumeCents: 50_000, commissionCents: 500 },
    });
    tradeAggregate.mockResolvedValue({ _sum: { grossCents: 75_000 } });
    commissionAggregate.mockResolvedValue({ _sum: { amountCents: 750 } });
    statsFindUnique.mockResolvedValue({
      totalVolumeCents: 0,
      totalCommissionCents: 0,
    });

    const result = await computeAffiliateAttributedTotals('aff-1');

    expect(result.totalVolumeCents).toBe(75_000);
    expect(result.totalCommissionCents).toBe(750);
  });

  it('falls back to stored stats when referrals are empty', async () => {
    referralAggregate.mockResolvedValue({ _sum: { volumeCents: 0, commissionCents: 0 } });
    tradeAggregate.mockResolvedValue({ _sum: { grossCents: 0 } });
    commissionAggregate.mockResolvedValue({ _sum: { amountCents: 0 } });
    statsFindUnique.mockResolvedValue({
      totalVolumeCents: 12_000,
      totalCommissionCents: 240,
    });

    const result = await computeAffiliateAttributedTotals('aff-2');

    expect(result.totalVolumeCents).toBe(12_000);
    expect(result.totalCommissionCents).toBe(240);
  });
});

describe('computeAffiliateAttributedTotalsBatch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps totals per affiliate id', async () => {
    referralGroupBy.mockResolvedValue([
      { affiliateId: 'aff-1', _sum: { volumeCents: 10_000, commissionCents: 100 } },
    ]);
    commissionGroupBy.mockResolvedValue([
      { affiliateId: 'aff-1', _sum: { amountCents: 100 } },
    ]);
    statsFindMany.mockResolvedValue([
      { id: 'aff-1', totalVolumeCents: 0, totalCommissionCents: 0 },
    ]);

    const result = await computeAffiliateAttributedTotalsBatch(['aff-1']);

    expect(result.get('aff-1')).toEqual({
      totalVolumeCents: 10_000,
      totalCommissionCents: 100,
    });
  });
});
