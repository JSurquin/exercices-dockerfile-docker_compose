// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prismaMock: any = {
  user: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), count: jest.fn() },
  affiliateReferral: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  affiliateStats: {
    update: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  trade: { findMany: jest.fn() },
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

  it('creates referral when user has no parrain yet', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ referredByAffiliateId: null });
    prismaMock.affiliateReferral.findFirst.mockResolvedValue(null);
    prismaMock.affiliateReferral.create.mockResolvedValue({ id: 'ref-new' });
    prismaMock.affiliateStats.update.mockResolvedValue({});
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.userAffiliateHistory.create.mockResolvedValue({ id: 'hist-1' });

    const result = await AffiliateService.switchUserToAffiliate('user-1', {
      id: 'aff-new',
      code: 'STREAMER',
      user: { steamUsername: 'StreamerPro' },
    });

    expect(result.attached).toBe(true);
    expect(result.replaced).toBe(false);
    expect(result.alreadyLinked).toBe(false);
    expect(result.affiliateName).toBe('StreamerPro');
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { referredByAffiliateId: 'aff-new' },
      })
    );
  });

  it('switches parrain when another affiliate is already linked (last wins)', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ referredByAffiliateId: 'aff-old' });
    prismaMock.affiliateReferral.findFirst.mockResolvedValue(null);
    prismaMock.affiliateReferral.create.mockResolvedValue({ id: 'ref-new' });
    prismaMock.affiliateReferral.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.userAffiliateHistory.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.affiliateStats.update.mockResolvedValue({});
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.userAffiliateHistory.create.mockResolvedValue({ id: 'hist-2' });

    const result = await AffiliateService.switchUserToAffiliate('user-1', {
      id: 'aff-new',
      code: 'NEWCODE',
      user: { steamUsername: 'NewPartner' },
    });

    expect(result.replaced).toBe(true);
    expect(result.attached).toBe(false);
    expect(result.alreadyLinked).toBe(false);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { referredByAffiliateId: 'aff-new' },
      })
    );
    expect(prismaMock.affiliateReferral.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ affiliateId: 'aff-old', referredUserId: 'user-1' }),
        data: expect.objectContaining({ isActive: false }),
      })
    );
    expect(prismaMock.userAffiliateHistory.updateMany).toHaveBeenCalled();
    expect(prismaMock.userAffiliateHistory.create).toHaveBeenCalled();
  });

  it('is idempotent when user already has the same affiliate', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ referredByAffiliateId: 'aff-1' });
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

    expect(result.alreadyLinked).toBe(true);
    expect(result.replaced).toBe(false);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});

describe('AffiliateService.associateUserToAffiliate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses explicit affiliate code when cookies are unavailable', async () => {
    prismaMock.affiliateStats.findFirst.mockResolvedValue({
      id: 'aff-new',
      code: 'STREAMER',
      userId: 'affiliate-user',
      user: { steamUsername: 'StreamerPro' },
    });
    prismaMock.user.findUnique.mockResolvedValue({ referredByAffiliateId: null });
    prismaMock.affiliateReferral.findFirst.mockResolvedValue(null);
    prismaMock.affiliateReferral.create.mockResolvedValue({ id: 'ref-new' });
    prismaMock.affiliateStats.update.mockResolvedValue({});
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.userAffiliateHistory.create.mockResolvedValue({ id: 'hist-1' });

    await AffiliateService.associateUserToAffiliate('user-1', 'STREAMER');

    expect(prismaMock.affiliateStats.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isActive: true,
          code: { equals: 'streamer', mode: 'insensitive' },
        }),
      })
    );
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { referredByAffiliateId: 'aff-new' },
      })
    );
  });
});

describe('AffiliateService.repairMissingReferralRecords', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reports users missing referral rows without writing in dry-run', async () => {
    prismaMock.user.findMany.mockResolvedValue([
      { id: 'user-1', referredByAffiliateId: 'aff-1' },
    ]);
    prismaMock.affiliateReferral.findFirst.mockResolvedValue(null);
    prismaMock.trade.findMany.mockResolvedValue([]);
    prismaMock.affiliateStats.findMany.mockResolvedValue([{ id: 'aff-1' }]);
    prismaMock.affiliateReferral.count.mockResolvedValue(1);

    const result = await AffiliateService.repairMissingReferralRecords({ dryRun: true });

    expect(result.linkedFromParrain).toBe(1);
    expect(prismaMock.affiliateReferral.create).not.toHaveBeenCalled();
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
      userTag: null,
    });

    const result = await AffiliateService.validateAffiliateSellPromoCode('user-1', 'NEWCODE');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.alreadyLinkedToOther).toBe(true);
      expect(result.alreadyLinked).toBe(false);
      expect(result.affiliateName).toBe('NewPartner');
    }
  });

  it('rejects promo validation for merchant accounts', async () => {
    prismaMock.affiliateStats.findFirst.mockResolvedValue({
      id: 'aff-new',
      code: 'NEWCODE',
      userId: 'affiliate-user',
      user: { steamUsername: 'NewPartner' },
    });
    prismaMock.user.findUnique.mockResolvedValue({
      referredByAffiliateId: null,
      userTag: 'MERCHANT',
    });

    const result = await AffiliateService.validateAffiliateSellPromoCode('user-1', 'NEWCODE');

    expect(result).toEqual({ ok: false, error: 'merchant' });
  });
});

describe('AffiliateService.switchUserToAffiliate — merchant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not attach merchant users as filleuls', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      referredByAffiliateId: null,
      userTag: 'MERCHANT',
    });

    const result = await AffiliateService.switchUserToAffiliate('user-1', {
      id: 'aff-new',
      code: 'STREAMER',
      user: { steamUsername: 'StreamerPro' },
    });

    expect(result).toEqual({
      replaced: false,
      attached: false,
      alreadyLinked: false,
      affiliateName: '',
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
