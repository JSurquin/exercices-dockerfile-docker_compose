jest.mock('../../../prisma/prisma', () => ({
  prisma: {
    trade: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '../../../prisma/prisma';
import {
  computeAffiliatePendingVolumeCents,
  loadPendingSalesByUserIds,
} from '@/lib/affiliate-referral-pending';

const tradeAggregate = prisma.trade.aggregate as jest.Mock;
const tradeFindMany = prisma.trade.findMany as jest.Mock;

describe('computeAffiliatePendingVolumeCents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sums gross cents for in-progress referral trades', async () => {
    tradeAggregate.mockResolvedValue({ _sum: { grossCents: 25_800 } });

    const result = await computeAffiliatePendingVolumeCents('aff-1');

    expect(result).toBe(25_800);
    expect(tradeAggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          user: { referredByAffiliateId: 'aff-1' },
        }),
      })
    );
  });
});

describe('loadPendingSalesByUserIds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the latest pending sale per user', async () => {
    tradeFindMany.mockResolvedValue([
      { userId: 'u-1', grossCents: 5000, status: 'IN_TRADE_HOLD' },
      { userId: 'u-1', grossCents: 1000, status: 'CREATED' },
      { userId: 'u-2', grossCents: 3000, status: 'ACCEPTED_BY_BOT' },
    ]);

    const map = await loadPendingSalesByUserIds(['u-1', 'u-2']);

    expect(map.get('u-1')).toEqual({ grossCents: 5000, status: 'IN_TRADE_HOLD' });
    expect(map.get('u-2')).toEqual({ grossCents: 3000, status: 'ACCEPTED_BY_BOT' });
  });
});
