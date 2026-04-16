/** Bonus net = 0,2 % de la valeur brute (USD centimes) */
export const AFFILIATE_SELL_PROMO_GROSS_RATE = 0.002;
/** Fragments crédités quand le trade passe AVAILABLE (après hold) */
export const AFFILIATE_SELL_PROMO_FRAGMENTS = 500;

export function computeSellPromoBonusCents(grossCents: number): number {
  return Math.round(grossCents * AFFILIATE_SELL_PROMO_GROSS_RATE);
}
