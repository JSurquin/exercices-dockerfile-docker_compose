import {
  affiliateCodesMatch,
  buildGiveawayVisibilityOr,
} from '@/lib/giveaway-private-access';

describe('giveaway-private-access', () => {
  describe('affiliateCodesMatch', () => {
    it('matches case-insensitively', () => {
      expect(affiliateCodesMatch('nyouz', 'NYOUZ')).toBe(true);
      expect(affiliateCodesMatch('NYOUZ', 'nyouz')).toBe(true);
    });

    it('rejects missing ref or code', () => {
      expect(affiliateCodesMatch(null, 'NYOUZ')).toBe(false);
      expect(affiliateCodesMatch('NYOUZ', null)).toBe(false);
    });
  });

  describe('buildGiveawayVisibilityOr', () => {
    it('includes public and ungated private giveaways', () => {
      const filters = buildGiveawayVisibilityOr(null, null);
      expect(filters).toEqual([
        { isPrivate: false },
        { isPrivate: true, requiredAffiliateCode: null },
      ]);
    });

    it('includes affiliate ref and owner filters when provided', () => {
      const filters = buildGiveawayVisibilityOr('NYOUZ', 'user-1');
      expect(filters).toHaveLength(4);
      expect(filters[2]).toEqual({
        isPrivate: true,
        requiredAffiliateCode: { equals: 'NYOUZ', mode: 'insensitive' },
      });
      expect(filters[3]).toEqual({
        affiliateGiveawayRequest: {
          OR: [
            { userId: 'user-1' },
            { affiliate: { userId: 'user-1', isActive: true } },
          ],
        },
      });
    });
  });
});
