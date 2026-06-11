jest.mock('~/prisma/prisma', () => ({
  prisma: {
    affiliateStats: {
      findUnique: jest.fn(),
    },
    affiliateGiveawayRequest: {
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/balance-service', () => ({
  getBalance: jest.fn(),
  getAvailableBalanceCents: jest.fn((b: number, f: number) => Math.max(0, b - f)),
}));

jest.mock('@/lib/notification-service', () => ({
  NotificationService: {
    notifyAdmins: jest.fn(),
    createNotification: jest.fn(),
  },
}));

jest.mock('@/lib/points-service', () => ({
  getPointsConfig: jest.fn().mockResolvedValue({
    giveawayCosts: { CUSTOM: 100 },
  }),
}));

import { prisma } from '~/prisma/prisma';
import { getBalance } from '@/lib/balance-service';
import { AffiliateGiveawayRequestService } from '@/lib/affiliate-giveaway-request-service';

describe('AffiliateGiveawayRequestService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.auditLog.create as jest.Mock).mockResolvedValue({});
  });

  describe('submitRequest', () => {
    it('rejects when available balance is zero', async () => {
      (prisma.affiliateStats.findUnique as jest.Mock).mockResolvedValue({
        id: 'aff-1',
        code: 'bob',
        isActive: true,
        userId: 'user-1',
      });
      (prisma.affiliateGiveawayRequest.count as jest.Mock).mockResolvedValue(0);
      (getBalance as jest.Mock).mockResolvedValue({
        availableCents: 0,
        accountFrozen: false,
      });

      await expect(
        AffiliateGiveawayRequestService.submitRequest('user-1', {
          startDate: new Date(Date.now() + 86_400_000),
          endDate: new Date(Date.now() + 172_800_000),
          winnerCount: 1,
          costCents: 1000,
        })
      ).rejects.toMatchObject({ code: 'INSUFFICIENT_BALANCE' });

      expect(prisma.affiliateGiveawayRequest.create).not.toHaveBeenCalled();
    });

    it('creates request when balance is sufficient', async () => {
      (prisma.affiliateStats.findUnique as jest.Mock).mockResolvedValue({
        id: 'aff-1',
        code: 'bob',
        isActive: true,
        userId: 'user-1',
      });
      (prisma.affiliateGiveawayRequest.count as jest.Mock).mockResolvedValue(0);
      (getBalance as jest.Mock).mockResolvedValue({
        availableCents: 5000,
        accountFrozen: false,
      });
      (prisma.affiliateGiveawayRequest.create as jest.Mock).mockResolvedValue({
        id: 'req-1',
        status: 'PENDING',
      });

      const result = await AffiliateGiveawayRequestService.submitRequest('user-1', {
        startDate: new Date(Date.now() + 86_400_000),
        endDate: new Date(Date.now() + 172_800_000),
        winnerCount: 2,
        costCents: 3000,
      });

      expect(result.id).toBe('req-1');
      expect(prisma.affiliateGiveawayRequest.create).toHaveBeenCalled();
    });
  });
});
