import {
  normalizePartnerBonusRatePercent,
  partnerBonusCents,
  partnerMerchantPriceCents,
  withPartnerMerchantPrices,
} from '@/lib/partner-api/merchant-price';

describe('partner merchant prices', () => {
  it('treats missing or invalid rates as 0%', () => {
    expect(normalizePartnerBonusRatePercent(undefined)).toBe(0);
    expect(normalizePartnerBonusRatePercent(null)).toBe(0);
    expect(normalizePartnerBonusRatePercent(-1)).toBe(0);
    expect(normalizePartnerBonusRatePercent(2)).toBe(2);
  });

  it('adds the same rounded bonus as trade vipBonusCents', () => {
    expect(partnerBonusCents(1250, 2)).toBe(25);
    expect(partnerMerchantPriceCents(1250, 2)).toBe(1275);
    expect(partnerMerchantPriceCents(1250, 0)).toBe(1250);
    expect(partnerBonusCents(106250, 1)).toBe(1063);
  });

  it('attaches merchant prices on an inventory payload', () => {
    const payload = withPartnerMerchantPrices(
      {
        steam_id: '1',
        items: [{ price_cents: 1250 }, { price_cents: 2000 }],
        total_value_cents: 3250,
      },
      2
    );

    expect(payload.bonus_rate_percent).toBe(2);
    expect(payload.items[0].merchant_price_cents).toBe(1275);
    expect(payload.items[1].merchant_price_cents).toBe(2040);
    expect(payload.total_merchant_value_cents).toBe(3315);
    expect(payload.total_value_cents).toBe(3250);
  });
});
