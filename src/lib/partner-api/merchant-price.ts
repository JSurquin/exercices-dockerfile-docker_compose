/** Account merchant/VIP bonus as stored on the user (`bonusRatePercent`, e.g. 2 = +2%). */
export function normalizePartnerBonusRatePercent(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return 0;
  return value;
}

/** Bonus in cents on a regular price. Same formula as trade `vipBonusCents` (round after %). */
export function partnerBonusCents(priceCents: number, bonusRatePercent: number): number {
  const rate = normalizePartnerBonusRatePercent(bonusRatePercent);
  if (rate === 0 || !Number.isFinite(priceCents) || priceCents <= 0) return 0;
  return Math.round((priceCents * rate) / 100);
}

export function partnerMerchantPriceCents(priceCents: number, bonusRatePercent: number): number {
  return priceCents + partnerBonusCents(priceCents, bonusRatePercent);
}

export function withPartnerMerchantPrices<
  T extends { items: Array<{ price_cents: number }>; total_value_cents: number },
>(inventory: T, bonusRatePercent: number | null | undefined) {
  const rate = normalizePartnerBonusRatePercent(bonusRatePercent);
  const items = inventory.items.map((item) => ({
    ...item,
    merchant_price_cents: partnerMerchantPriceCents(item.price_cents, rate),
  }));
  return {
    ...inventory,
    items,
    bonus_rate_percent: rate,
    total_merchant_value_cents: items.reduce((sum, item) => sum + item.merchant_price_cents, 0),
  };
}
