import {
  affiliateCodesMatch,
  buildGiveawayVisibilityOr,
  checkPrivateGiveawayParticipation,
  type GiveawayParticipationEligibility,
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
    it('returns unrestricted filter for everyone (private giveaways visible but locked in UI)', () => {
      expect(buildGiveawayVisibilityOr(null, null)).toEqual([{}]);
      expect(buildGiveawayVisibilityOr('NYOUZ', 'user-1')).toEqual([{}]);
    });

    it('returns unrestricted filter for admins', () => {
      const filters = buildGiveawayVisibilityOr(null, 'admin-user', true);
      expect(filters).toEqual([{}]);
    });
  });

  describe('checkPrivateGiveawayParticipation', () => {
    const privateGiveaway = {
      id: 'gw-1',
      isPrivate: true,
      requiredAffiliateCode: 'NYOUZ',
    };

    const baseEligibility: GiveawayParticipationEligibility = {
      referredAffiliateCode: null,
      ownerAffiliateCode: null,
      recentSaleAffiliateCodes: new Set(),
      ownedGiveawayRequestIds: new Set(),
    };

    it('allows public giveaways', () => {
      expect(
        checkPrivateGiveawayParticipation(
          { id: 'gw-1', isPrivate: false, requiredAffiliateCode: null },
          { viewerUserId: 'user-1', eligibility: baseEligibility }
        )
      ).toBe(true);
    });

    it('allows admins', () => {
      expect(
        checkPrivateGiveawayParticipation(privateGiveaway, {
          viewerUserId: 'admin',
          viewerIsAdmin: true,
        })
      ).toBe(true);
    });

    it('denies anonymous users on private affiliate giveaways', () => {
      expect(
        checkPrivateGiveawayParticipation(privateGiveaway, {
          viewerUserId: null,
          eligibility: baseEligibility,
        })
      ).toBe(false);
    });

    it('allows affiliate owner', () => {
      expect(
        checkPrivateGiveawayParticipation(privateGiveaway, {
          viewerUserId: 'aff-user',
          eligibility: { ...baseEligibility, ownerAffiliateCode: 'nyouz' },
        })
      ).toBe(true);
    });

    it('allows referred users without recent sale', () => {
      expect(
        checkPrivateGiveawayParticipation(privateGiveaway, {
          viewerUserId: 'ref-user',
          eligibility: { ...baseEligibility, referredAffiliateCode: 'NYOUZ' },
        })
      ).toBe(true);
    });

    it('allows users with recent sale using affiliate code', () => {
      expect(
        checkPrivateGiveawayParticipation(privateGiveaway, {
          viewerUserId: 'seller',
          eligibility: {
            ...baseEligibility,
            recentSaleAffiliateCodes: new Set(['nyouz']),
          },
        })
      ).toBe(true);
    });

    it('denies users with only cookie ref but no sale or referral', () => {
      expect(
        checkPrivateGiveawayParticipation(privateGiveaway, {
          viewerUserId: 'user-1',
          eligibility: baseEligibility,
        })
      ).toBe(false);
    });

    it('allows giveaway request owner', () => {
      expect(
        checkPrivateGiveawayParticipation(privateGiveaway, {
          viewerUserId: 'aff-user',
          eligibility: {
            ...baseEligibility,
            ownedGiveawayRequestIds: new Set(['gw-1']),
          },
        })
      ).toBe(true);
    });
  });
});
