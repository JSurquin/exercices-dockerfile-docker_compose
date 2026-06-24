jest.mock('../../../prisma/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    trade: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    pointTransaction: {
      findFirst: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/balance-service', () => ({
  creditBalance: jest.fn(),
  creditPendingBalance: jest.fn(),
  releasePendingToBalance: jest.fn(),
  debitPendingBalance: jest.fn(),
  forceDebitBalance: jest.fn(),
}));

jest.mock('@/lib/currency-converter', () => ({
  currencyConverter: {
    convertUsdCentsToEurCents: jest.fn().mockResolvedValue(9200),
    getUsdToEurRate: jest.fn().mockResolvedValue(0.92),
  },
}));

jest.mock('@/lib/affiliate-service', () => ({
  AffiliateService: {
    associateUserToAffiliate: jest.fn(),
    calculateCommissionForTrade: jest.fn(),
    cancelCommissionsForTrade: jest.fn(),
  },
  AFFILIATE_SELL_PROMO_FRAGMENTS: 1,
}));

jest.mock('@/lib/points-service', () => ({
  awardTradePoints: jest.fn(),
}));

jest.mock('@/lib/fragment-service', () => ({
  grantFragments: jest.fn(),
}));

jest.mock('@/lib/user-rewards-guard', () => ({
  getUserRewardFlags: jest.fn().mockResolvedValue({}),
  isAffiliateRewardsBlocked: jest.fn().mockReturnValue(false),
}));

import { prisma } from '../../../prisma/prisma';
import { creditBalance, creditPendingBalance } from '@/lib/balance-service';
import { TradeHooks } from '@/lib/trade-hooks';

const prismaTransaction = prisma.$transaction as jest.Mock;
const tradeFindUnique = prisma.trade.findUnique as jest.Mock;
const tradeUpdate = prisma.trade.update as jest.Mock;
const tradeUpdateMany = prisma.trade.updateMany as jest.Mock;
const tradeFindMany = prisma.trade.findMany as jest.Mock;
const auditLogCreate = prisma.auditLog.create as jest.Mock;

describe('TradeHooks instant credit on IN_TRADE_HOLD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tradeUpdateMany.mockResolvedValue({ count: 1 });
    tradeUpdate.mockResolvedValue({});
    auditLogCreate.mockResolvedValue({});
    prismaTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        trade: {
          findUnique: tradeFindUnique,
          updateMany: tradeUpdateMany,
        },
      };
      return fn(tx);
    });
  });

  it('credits balance immediately when instant credit is enabled (IN_TRADE_HOLD path)', async () => {
    tradeFindUnique.mockResolvedValue({
      id: 'trade-1',
      netCents: 10_000,
      user: { instantCreditEnabled: true },
    });

    await TradeHooks.applyStatusProgressionHooks('user-1', 'trade-1', 'CREATED', 'IN_TRADE_HOLD');

    expect(creditBalance).toHaveBeenCalledWith(
      'user-1',
      9200,
      'Trade trade-1 accepted — instant credit',
      { type: 'TRADE_CREDIT', tradeId: 'trade-1' }
    );
    expect(creditPendingBalance).not.toHaveBeenCalled();
    expect(tradeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'trade-1' },
        data: expect.objectContaining({
          status: 'AVAILABLE',
          instantCreditedAt: expect.any(Date),
          balanceCreditedAt: expect.any(Date),
        }),
      })
    );
  });

  it('credits pending balance when instant credit is disabled (IN_TRADE_HOLD path)', async () => {
    tradeFindUnique.mockResolvedValue({
      id: 'trade-2',
      netCents: 10_000,
      user: { instantCreditEnabled: false },
    });

    await TradeHooks.applyStatusProgressionHooks('user-2', 'trade-2', 'CREATED', 'IN_TRADE_HOLD');

    expect(creditPendingBalance).toHaveBeenCalled();
    expect(creditBalance).not.toHaveBeenCalled();
  });

  it('catchupMissingAcceptanceCredit processes trades without pendingCreditedAt', async () => {
    tradeFindMany.mockResolvedValue([{ id: 'trade-3', userId: 'user-3' }]);
    tradeFindUnique.mockResolvedValue({
      id: 'trade-3',
      netCents: 5000,
      user: { instantCreditEnabled: true },
    });

    const count = await TradeHooks.catchupMissingAcceptanceCredit();

    expect(count).toBe(1);
    expect(creditBalance).toHaveBeenCalled();
  });

  it('reverts pending balance when trade moves to FAILED', async () => {
    const { debitPendingBalance } = jest.requireMock('@/lib/balance-service') as {
      debitPendingBalance: jest.Mock;
    };

    tradeFindUnique
      .mockResolvedValueOnce({ userId: 'user-4' })
      .mockResolvedValueOnce({
        id: 'trade-4',
        netCents: 10_000,
        eurCentsAtCredit: 9200,
        pendingCreditedAt: new Date(),
        instantCreditedAt: null,
        pendingRevertedAt: null,
      });

    await TradeHooks.onTradeStatusChanged('trade-4', 'IN_TRADE_HOLD', 'FAILED');

    expect(debitPendingBalance).toHaveBeenCalledWith(
      'user-4',
      9200,
      expect.stringContaining('trade-4'),
      { tradeId: 'trade-4' }
    );
  });
});
