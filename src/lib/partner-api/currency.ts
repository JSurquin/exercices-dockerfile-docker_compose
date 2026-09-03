import { currencyConverter, type SupportedCurrency } from '@/lib/currency-converter';

export const PARTNER_CURRENCIES = ['USD', 'EUR', 'CNY'] as const;
export type PartnerCurrency = (typeof PARTNER_CURRENCIES)[number];

/** Skinplace instant prices are USD. Partner `*_cents` are converted from this source. */
export const PARTNER_SOURCE_CURRENCY: PartnerCurrency = 'USD';

export function isPartnerCurrency(value: string): value is PartnerCurrency {
  return (PARTNER_CURRENCIES as readonly string[]).includes(value);
}

export function normalizePartnerCurrency(raw: string | null | undefined): PartnerCurrency | null {
  if (raw == null || raw.trim() === '') return PARTNER_SOURCE_CURRENCY;
  const value = raw.trim().toUpperCase();
  return isPartnerCurrency(value) ? value : null;
}

export function applyUsdCentsToCurrency(usdCents: number, rateFromUsd: number): number {
  return Math.round(usdCents * rateFromUsd);
}

export async function getPartnerUsdFxRate(currency: PartnerCurrency): Promise<number> {
  if (currency === PARTNER_SOURCE_CURRENCY) return 1;
  return currencyConverter.getExchangeRate(PARTNER_SOURCE_CURRENCY, currency as SupportedCurrency);
}

export async function convertPartnerInventoryCurrency<
  T extends {
    items: Array<{ price_cents: number; merchant_price_cents?: number }>;
    total_value_cents: number;
    total_merchant_value_cents?: number;
  },
>(inventory: T, currency: PartnerCurrency): Promise<T & { currency: PartnerCurrency }> {
  const rate = await getPartnerUsdFxRate(currency);
  if (rate === 1) {
    return { ...inventory, currency };
  }
  const items = inventory.items.map((item) => ({
    ...item,
    price_cents: applyUsdCentsToCurrency(item.price_cents, rate),
    ...(typeof item.merchant_price_cents === 'number'
      ? { merchant_price_cents: applyUsdCentsToCurrency(item.merchant_price_cents, rate) }
      : {}),
  }));
  const totalMerchant = items.every((item) => typeof item.merchant_price_cents === 'number')
    ? items.reduce((sum, item) => sum + (item.merchant_price_cents ?? 0), 0)
    : inventory.total_merchant_value_cents;
  return {
    ...inventory,
    items,
    total_value_cents: items.reduce((sum, item) => sum + item.price_cents, 0),
    ...(typeof totalMerchant === 'number' ? { total_merchant_value_cents: totalMerchant } : {}),
    currency,
  };
}
