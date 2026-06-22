jest.mock('../../../prisma/prisma', () => ({
  prisma: {
    trade: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    affiliateCommission: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    affiliateReferral: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    affiliateStats: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/balance-service', () => ({
  creditBalance: jest.fn(),
  forceDebitBalance: jest.fn(),
}));

jest.mock('@/lib/currency-converter', () => ({
  currencyConverter: {
    getUsdToEurRate: jest.fn().mockResolvedValue(0.92),
  },
}));

jest.mock('@/lib/user-rewards-guard', () => ({
  getUserRewardFlags: jest.fn().mockResolvedValue({}),
  isAffiliateRewardsBlocked: jest.fn().mockReturnValue(false),
}));

import { prisma } from '../../../prisma/prisma';
import { creditBalance, forceDebitBalance } from '@/lib/balance-service';
import { AffiliateService } from '@/lib/affiliate-service';

const tradeFindUnique = prisma.trade.findUnique as jest.Mock;
const tradeUpdateMany = prisma.trade.updateMany as jest.Mock;
const commissionFindUnique = prisma.affiliateCommission.findUnique as jest.Mock;
const commissionCreate = prisma.affiliateCommission.create as jest.Mock;
const commissionUpdateMany = prisma.affiliateCommission.updateMany as jest.Mock;
const commissionUpdate = prisma.affiliateCommission.update as jest.Mock;
const referralFindFirst = prisma.affiliateReferral.findFirst as jest.Mock;
const referralUpdate = prisma.affiliateReferral.update as jest.Mock;
const statsFindFirst = prisma.affiliateStats.findFirst as jest.Mock;
const statsUpdate = prisma.affiliateStats.update as jest.Mock;

describe('AffiliateService commission balance credit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tradeUpdateMany.mockResolvedValue({ count: 1 });
    commissionUpdateMany.mockResolvedValue({ count: 1 });
    referralFindFirst.mockResolvedValue({
      id: 'ref-1',
      affiliateId: 'aff-1',
      referredUserId: 'seller-1',
    });
    referralUpdate.mockResolvedValue({});
    statsUpdate.mockResolvedValue({});
    commissionCreate.mockResolvedValue({ id: 'comm-1' });
    commissionUpdate.mockResolvedValue({});
    statsFindFirst.mockResolvedValue({
      id: 'aff-1',
      userId: 'bob-1',
      code: 'bob',
      commissionRate: 0.02,
      isActive: true,
    });
    (prisma.affiliateStats.findUnique as jest.Mock).mockResolvedValue({
      id: 'aff-1',
      userId: 'bob-1',
      code: 'bob',
      commissionRate: 0.02,
      isActive: true,
    });
  });

  it('credits affiliate balance when trade commission is calculated from attribution snapshot', async () => {
    statsFindFirst.mockResolvedValue({
      id: 'aff-nyouz',
      userId: 'nyouz-user',
      code: 'nyouz',
      commissionRate: 0.02,
      isActive: true,
    });
    (prisma.affiliateStats.findUnique as jest.Mock).mockResolvedValue({
      id: 'aff-nyouz',
      userId: 'nyouz-user',
      commissionRate: 0.02,
    });
    tradeFindUnique.mockResolvedValue({
      id: 'trade-1',
      status: 'AVAILABLE',
      grossCents: 10_000,
      usdToEurRate: 0.92,
      instantCreditedAt: null,
      availableAt: new Date(0),
      affiliateCommissionProcessedAt: null,
      affiliatePromoCode: null,
      affiliateAttributionCode: 'nyouz',
      userId: 'seller-1',
      user: { id: 'seller-1', referredByAffiliateId: 'aff-other' },
    });
    commissionFindUnique.mockResolvedValue(null);

    await AffiliateService.calculateCommissionForTrade('trade-1', { skipHoldCheck: true });

    expect(creditBalance).toHaveBeenCalledWith(
      'nyouz-user',
      184,
      'Affiliate commission — trade trade-1',
      expect.objectContaining({
        type: 'AFFILIATE_COMMISSION',
        tradeId: 'trade-1',
        commissionId: 'comm-1',
      })
    );
  });

  it('credits affiliate balance when trade commission is calculated via current referral fallback', async () => {
    tradeFindUnique.mockResolvedValue({
      id: 'trade-1',
      status: 'AVAILABLE',
      grossCents: 10_000,
      usdToEurRate: 0.92,
      instantCreditedAt: null,
      availableAt: new Date(0),
      affiliateCommissionProcessedAt: null,
      affiliatePromoCode: null,
      affiliateAttributionCode: null,
      userId: 'seller-1',
      user: { id: 'seller-1', referredByAffiliateId: 'aff-1' },
    });
    commissionFindUnique.mockResolvedValue(null);

    await AffiliateService.calculateCommissionForTrade('trade-1', { skipHoldCheck: true });

    expect(creditBalance).toHaveBeenCalledWith(
      'bob-1',
      184,
      'Affiliate commission — trade trade-1',
      expect.objectContaining({
        type: 'AFFILIATE_COMMISSION',
        tradeId: 'trade-1',
        commissionId: 'comm-1',
      })
    );
    expect(commissionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'comm-1' },
        data: expect.objectContaining({ status: 'CREDITED', amountCents: 184 }),
      })
    );
  });

  it('does not double-credit when balanceCreditedAt is already set', async () => {
    tradeFindUnique.mockResolvedValue({
      id: 'trade-1',
      status: 'AVAILABLE',
      grossCents: 10_000,
      usdToEurRate: 0.92,
      instantCreditedAt: null,
      availableAt: new Date(0),
      affiliateCommissionProcessedAt: null,
      affiliatePromoCode: null,
      affiliateAttributionCode: null,
      user: { id: 'seller-1', referredByAffiliateId: 'aff-1' },
    });
    commissionFindUnique.mockResolvedValue({
      id: 'comm-1',
      balanceCreditedAt: new Date(),
      affiliate: { userId: 'bob-1' },
    });

    await AffiliateService.calculateCommissionForTrade('trade-1', { skipHoldCheck: true });

    expect(creditBalance).not.toHaveBeenCalled();
    expect(commissionCreate).not.toHaveBeenCalled();
  });

  it('credits legacy commission without balanceCreditedAt', async () => {
    tradeFindUnique.mockResolvedValue({
      id: 'trade-1',
      status: 'AVAILABLE',
      grossCents: 10_000,
      usdToEurRate: 0.92,
      instantCreditedAt: null,
      availableAt: new Date(0),
      affiliateCommissionProcessedAt: new Date(),
      affiliatePromoCode: null,
      affiliateAttributionCode: null,
      user: { id: 'seller-1', referredByAffiliateId: 'aff-1' },
    });
    commissionFindUnique.mockResolvedValue({
      id: 'comm-legacy',
      affiliateId: 'aff-1',
      amountCents: 200,
      balanceCreditedAt: null,
      affiliate: { userId: 'bob-1' },
    });
    (prisma.affiliateStats.findUnique as jest.Mock).mockResolvedValue({
      id: 'aff-1',
      userId: 'bob-1',
      commissionRate: 0.02,
    });

    await AffiliateService.calculateCommissionForTrade('trade-1', { skipHoldCheck: true });

    expect(creditBalance).toHaveBeenCalledWith(
      'bob-1',
      184,
      'Affiliate commission — trade trade-1',
      expect.objectContaining({ commissionId: 'comm-legacy' })
    );
  });

  it('skips commission when affiliate rewards are blocked', async () => {
    const { isAffiliateRewardsBlocked } = jest.requireMock('@/lib/user-rewards-guard');
    isAffiliateRewardsBlocked.mockReturnValueOnce(true);

    tradeFindUnique.mockResolvedValue({
      id: 'trade-1',
      status: 'AVAILABLE',
      grossCents: 10_000,
      usdToEurRate: 0.92,
      instantCreditedAt: null,
      availableAt: new Date(0),
      affiliateCommissionProcessedAt: null,
      affiliatePromoCode: null,
      affiliateAttributionCode: null,
      userId: 'seller-1',
      user: { id: 'seller-1', referredByAffiliateId: 'aff-1' },
    });
    commissionFindUnique.mockResolvedValue(null);

    await AffiliateService.calculateCommissionForTrade('trade-1', { skipHoldCheck: true });

    expect(creditBalance).not.toHaveBeenCalled();
    expect(commissionCreate).not.toHaveBeenCalled();
  });

  it('debits balance when cancelling a credited commission', async () => {
    commissionFindUnique.mockResolvedValue({
      id: 'comm-1',
      affiliateId: 'aff-1',
      tradeId: 'trade-1',
      referralId: 'ref-1',
      amountCents: 183,
      balanceCreditedAt: new Date(),
      status: 'CREDITED',
      affiliate: { userId: 'bob-1' },
    });
    tradeFindUnique.mockResolvedValue({ id: 'trade-1', grossCents: 10_000 });

    await AffiliateService.cancelCommissionById('comm-1');

    expect(forceDebitBalance).toHaveBeenCalledWith(
      'bob-1',
      183,
      expect.stringContaining('cancelled'),
      expect.objectContaining({ type: 'AFFILIATE_COMMISSION', reversal: true })
    );
  });
});
