import {
  isAffiliateRewardsBlocked,
  isMerchantAccount,
  isXpRewardsBlocked,
  type UserRewardFlags,
} from '@/lib/user-rewards-guard';

describe('user-rewards-guard', () => {
  const defaultFlags: UserRewardFlags = {
    affiliateRewardsBlocked: false,
    xpRewardsBlocked: false,
  };

  it('returns false when flags are not set', () => {
    expect(isAffiliateRewardsBlocked(defaultFlags)).toBe(false);
    expect(isXpRewardsBlocked(defaultFlags)).toBe(false);
  });

  it('returns true when affiliate rewards are blocked', () => {
    expect(
      isAffiliateRewardsBlocked({ ...defaultFlags, affiliateRewardsBlocked: true })
    ).toBe(true);
  });

  it('returns true when XP rewards are blocked', () => {
    expect(isXpRewardsBlocked({ ...defaultFlags, xpRewardsBlocked: true })).toBe(true);
  });

  it('detects merchant accounts by userTag', () => {
    expect(isMerchantAccount({ userTag: 'MERCHANT' })).toBe(true);
    expect(isMerchantAccount({ userTag: 'VIP' })).toBe(false);
    expect(isMerchantAccount({ userTag: null })).toBe(false);
    expect(isMerchantAccount(undefined)).toBe(false);
  });
});
