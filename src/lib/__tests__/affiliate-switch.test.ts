// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prismaMock: any = {
  user: { findUnique: jest.fn(), update: jest.fn(), count: jest.fn() },
  affiliateReferral: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  affiliateStats: { update: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn() },
  userAffiliateHistory: {
    findFirst: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(async (fn: (tx: unknown) => Promise<void>) => fn(prismaMock)),
};

jest.mock('../../../prisma/prisma', () => ({ prisma: prismaMock }));

jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({ get: () => undefined })),
}));

import { AffiliateService } from '@/lib/affiliate-service';

describe('AffiliateService.switchUserToAffiliate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('replaces previous affiliate and marks old referral as churned', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      referredByAffiliateId: 'aff-old',
    });
    prismaMock.affiliateReferral.findFirst.mockResolvedValue(null);
    prismaMock.affiliateReferral.create.mockResolvedValue({ id: 'ref-new' });
    prismaMock.affiliateStats.update.mockResolvedValue({});
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.affiliateReferral.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.userAffiliateHistory.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.userAffiliateHistory.create.mockResolvedValue({ id: 'hist-1' });

    const result = await AffiliateService.switchUserToAffiliate('user-1', {
      id: 'aff-new',
      code: 'STREAMER',
      user: { steamUsername: 'StreamerPro' },
    });

    expect(result.replaced).toBe(true);
    expect(result.affiliateName).toBe('StreamerPro');
    expect(prismaMock.affiliateReferral.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ affiliateId: 'aff-old', isActive: true }),
        data: expect.objectContaining({ isActive: false }),
      })
    );
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { referredByAffiliateId: 'aff-new' },
      })
    );
  });

  it('is idempotent when user already has the same affiliate', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      referredByAffiliateId: 'aff-1',
    });
    prismaMock.affiliateReferral.findFirst.mockResolvedValue({
      id: 'ref-1',
      isActive: true,
    });
    prismaMock.userAffiliateHistory.findFirst.mockResolvedValue({ id: 'hist-1' });

    const result = await AffiliateService.switchUserToAffiliate('user-1', {
      id: 'aff-1',
      code: 'CODE1',
      user: { steamUsername: 'Partner' },
    });

    expect(result.replaced).toBe(false);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});

describe('AffiliateService.validateAffiliateSellPromoCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('accepts a new code even when another affiliate is already linked', async () => {
    prismaMock.affiliateStats.findFirst.mockResolvedValue({
      id: 'aff-new',
      code: 'NEWCODE',
      userId: 'affiliate-user',
      user: { steamUsername: 'NewPartner' },
    });
    prismaMock.user.findUnique.mockResolvedValue({
      referredByAffiliateId: 'aff-old',
    });

    const result = await AffiliateService.validateAffiliateSellPromoCode('user-1', 'NEWCODE');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.willReplace).toBe(true);
      expect(result.affiliateName).toBe('NewPartner');
    }
  });
});
