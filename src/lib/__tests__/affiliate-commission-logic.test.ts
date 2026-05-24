import {
  AFFILIATE_COMMISSION_ELIGIBLE_STATUSES,
  computeAffiliateCommissionCents,
  isTradeEligibleForAffiliateCommission,
  normalizeAffiliateCode,
} from '@/lib/affiliate-commission-logic';

describe('affiliate-commission-logic', () => {
  it('identifies eligible trade statuses after validation period', () => {
    expect(isTradeEligibleForAffiliateCommission('AVAILABLE')).toBe(true);
    expect(isTradeEligibleForAffiliateCommission('PAYOUT_PENDING')).toBe(true);
    expect(isTradeEligibleForAffiliateCommission('PAID')).toBe(true);
    expect(isTradeEligibleForAffiliateCommission('IN_TRADE_HOLD')).toBe(false);
    expect(isTradeEligibleForAffiliateCommission('FAILED')).toBe(false);
  });

  it('computes commission on gross volume with floor rounding', () => {
    expect(computeAffiliateCommissionCents(100_000, 0.02)).toBe(2_000);
    expect(computeAffiliateCommissionCents(10_001, 0.02)).toBe(200);
    expect(computeAffiliateCommissionCents(0, 0.02)).toBe(0);
  });

  it('normalizes affiliate codes', () => {
    expect(normalizeAffiliateCode('  Streamer123  ')).toBe('streamer123');
  });

  it('exports stable eligible status list', () => {
    expect(AFFILIATE_COMMISSION_ELIGIBLE_STATUSES).toEqual([
      'AVAILABLE',
      'PAYOUT_PENDING',
      'PAID',
    ]);
  });
});
