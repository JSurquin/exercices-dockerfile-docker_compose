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

describe('AffiliateService.attachUserToAffiliateOnce', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates permanent referral when user has no parrain yet', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ referredByAffiliateId: null });
    prismaMock.affiliateReferral.findFirst.mockResolvedValue(null);
    prismaMock.affiliateReferral.create.mockResolvedValue({ id: 'ref-new' });
    prismaMock.affiliateStats.update.mockResolvedValue({});
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.userAffiliateHistory.create.mockResolvedValue({ id: 'hist-1' });

    const result = await AffiliateService.attachUserToAffiliateOnce('user-1', {
      id: 'aff-new',
      code: 'STREAMER',
      user: { steamUsername: 'StreamerPro' },
    });

    expect(result.attached).toBe(true);
    expect(result.alreadyLinked).toBe(false);
    expect(result.affiliateName).toBe('StreamerPro');
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { referredByAffiliateId: 'aff-new' },
      })
    );
    expect(prismaMock.affiliateReferral.updateMany).not.toHaveBeenCalled();
  });

  it('does not overwrite an existing parrain (first wins)', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ referredByAffiliateId: 'aff-old' });

    const result = await AffiliateService.attachUserToAffiliateOnce('user-1', {
      id: 'aff-new',
      code: 'NEWCODE',
      user: { steamUsername: 'NewPartner' },
    });

    expect(result.attached).toBe(false);
    expect(result.alreadyLinked).toBe(true);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('is idempotent when user already has the same affiliate', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ referredByAffiliateId: 'aff-1' });
    prismaMock.affiliateReferral.findFirst.mockResolvedValue({
      id: 'ref-1',
      isActive: true,
    });
    prismaMock.userAffiliateHistory.findFirst.mockResolvedValue({ id: 'hist-1' });

    const result = await AffiliateService.attachUserToAffiliateOnce('user-1', {
      id: 'aff-1',
      code: 'CODE1',
      user: { steamUsername: 'Partner' },
    });

    expect(result.attached).toBe(false);
    expect(result.alreadyLinked).toBe(true);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});

describe('AffiliateService.validateAffiliateSellPromoCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('flags alreadyLinkedToOther when another affiliate is already linked', async () => {
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
      expect(result.alreadyLinkedToOther).toBe(true);
      expect(result.alreadyLinked).toBe(false);
      expect(result.affiliateName).toBe('NewPartner');
    }
  });
});
