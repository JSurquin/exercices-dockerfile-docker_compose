import {
  currencyConverter,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/lib/currency-converter";

export const WALLET_COMPACT_THRESHOLD = 10_000;

export type CompactWalletValue = {
  display: string;
  exact: string;
  abbreviated: boolean;
};

function formatShortCoefficient(value: number, locale: string): string {
  const rounded = Math.round(value * 10) / 10;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(rounded);
}

function compactMagnitude(absValue: number, locale: string): string | null {
  if (absValue < WALLET_COMPACT_THRESHOLD) return null;

  const thousands = absValue / 1_000;
  const millions = absValue / 1_000_000;

  if (absValue >= 1_000_000_000 || Math.round(millions) >= 1_000) {
    return `${formatShortCoefficient(absValue / 1_000_000_000, locale)}Md`;
  }
  if (absValue >= 1_000_000 || Math.round(thousands) >= 1_000) {
    return `${formatShortCoefficient(millions, locale)}M`;
  }
  return `${formatShortCoefficient(thousands, locale)}k`;
}

export function formatWalletFragments(count: number, locale: string): CompactWalletValue {
  const exact = new Intl.NumberFormat(locale).format(count);
  const compact = compactMagnitude(Math.abs(count), locale);
  if (!compact) {
    return { display: exact, exact, abbreviated: false };
  }
  const sign = count < 0 ? "-" : "";
  return { display: `${sign}${compact}`, exact, abbreviated: true };
}

export function formatWalletMoney(
  cents: number,
  currency: SupportedCurrency,
  locale: string
): CompactWalletValue {
  const exact = currencyConverter.formatPrice(cents, currency);
  const amount = cents / 100;
  const compact = compactMagnitude(Math.abs(amount), locale);
  if (!compact) {
    return { display: exact, exact, abbreviated: false };
  }

  const sign = amount < 0 ? "-" : "";
  const symbol = SUPPORTED_CURRENCIES[currency].symbol;
  const display =
    currency === "CNY" || currency === "USD"
      ? `${sign}${symbol}${compact}`
      : `${sign}${compact}${symbol}`;

  return { display, exact, abbreviated: true };
}
