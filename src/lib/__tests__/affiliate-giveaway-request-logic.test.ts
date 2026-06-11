import {
  AFFILIATE_MAX_PENDING_GIVEAWAY_REQUESTS,
  canApproveGiveawayRequest,
  canSubmitGiveawayRequest,
  validateGiveawayRequestInput,
} from '@/lib/affiliate-giveaway-request-logic';

describe('affiliate-giveaway-request-logic', () => {
  const now = new Date('2026-06-11T12:00:00.000Z');
  const startDate = new Date('2026-06-12T12:00:00.000Z');
  const endDate = new Date('2026-06-19T12:00:00.000Z');

  describe('validateGiveawayRequestInput', () => {
    it('accepts valid input', () => {
      expect(
        validateGiveawayRequestInput({
          startDate,
          endDate,
          winnerCount: 3,
          costCents: 5000,
          now,
        }).ok
      ).toBe(true);
    });

    it('rejects end before start', () => {
      const result = validateGiveawayRequestInput({
        startDate: endDate,
        endDate: startDate,
        winnerCount: 1,
        costCents: 100,
        now,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBe('INVALID_DATES');
    });

    it('rejects start in the past', () => {
      const result = validateGiveawayRequestInput({
        startDate: new Date('2026-06-10T12:00:00.000Z'),
        endDate,
        winnerCount: 1,
        costCents: 100,
        now,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBe('INVALID_DATES');
    });

    it('rejects invalid winner count and cost', () => {
      expect(
        validateGiveawayRequestInput({
          startDate,
          endDate,
          winnerCount: 0,
          costCents: 100,
          now,
        }).ok
      ).toBe(false);
      expect(
        validateGiveawayRequestInput({
          startDate,
          endDate,
          winnerCount: 1,
          costCents: 0,
          now,
        }).ok
      ).toBe(false);
    });
  });

  describe('canSubmitGiveawayRequest', () => {
    const base = {
      pendingCount: 0,
      maxPending: AFFILIATE_MAX_PENDING_GIVEAWAY_REQUESTS,
      affiliateActive: true,
      availableCents: 10_000,
      costCents: 5_000,
      accountFrozen: false,
    };

    it('allows submit when balance covers cost', () => {
      expect(canSubmitGiveawayRequest(base).ok).toBe(true);
    });

    it('blocks when available balance is zero', () => {
      const result = canSubmitGiveawayRequest({ ...base, availableCents: 0 });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBe('INSUFFICIENT_BALANCE');
    });

    it('blocks when balance is below requested cost', () => {
      const result = canSubmitGiveawayRequest({
        ...base,
        availableCents: 4_999,
        costCents: 5_000,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBe('INSUFFICIENT_BALANCE');
    });

    it('blocks when account is frozen', () => {
      const result = canSubmitGiveawayRequest({ ...base, accountFrozen: true });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBe('ACCOUNT_FROZEN');
    });

    it('blocks when too many pending requests', () => {
      const result = canSubmitGiveawayRequest({
        ...base,
        pendingCount: AFFILIATE_MAX_PENDING_GIVEAWAY_REQUESTS,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBe('TOO_MANY_PENDING');
    });

    it('blocks inactive affiliate', () => {
      const result = canSubmitGiveawayRequest({ ...base, affiliateActive: false });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBe('AFFILIATE_INACTIVE');
    });
  });

  describe('canApproveGiveawayRequest', () => {
    const base = {
      status: 'PENDING' as const,
      availableCents: 10_000,
      costCents: 5_000,
      accountFrozen: false,
    };

    it('allows approval with sufficient balance', () => {
      expect(canApproveGiveawayRequest(base).ok).toBe(true);
    });

    it('blocks approval when balance dropped below cost', () => {
      const result = canApproveGiveawayRequest({
        ...base,
        availableCents: 1_000,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBe('INSUFFICIENT_BALANCE');
    });

    it('blocks re-approval of non-pending request', () => {
      const result = canApproveGiveawayRequest({
        ...base,
        status: 'APPROVED',
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBe('INVALID_STATUS');
    });
  });
});
