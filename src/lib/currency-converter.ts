/**
 * Service de conversion de devises utilisant l'API Frankfurter
 * avec fallback BDD (taux J-1) puis taux hardcodés en dernier recours.
 *
 * Chaîne de résolution :
 *   1. API Frankfurter (temps réel, cache 5 min)
 *   2. Dernier taux sauvegardé en BDD (via /api/exchange-rate)
 *   3. Taux hardcodés (mis à jour manuellement, dernier recours)
 */

export type SupportedCurrency = 'USD' | 'EUR' | 'CNY';

export interface CurrencyInfo {
  code: SupportedCurrency;
  symbol: string;
  nameKey: 'usd' | 'eur' | 'cny';
  flag: string;
}

export const SUPPORTED_CURRENCIES: Record<SupportedCurrency, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', nameKey: 'usd', flag: '🇺🇸' },
  EUR: { code: 'EUR', symbol: '€', nameKey: 'eur', flag: '🇪🇺' },
  CNY: { code: 'CNY', symbol: '¥', nameKey: 'cny', flag: '🇨🇳' },
};

interface ExchangeRateResponse {
  base: string;
  date: string;
  rates: {
    [currency: string]: number;
  };
}

interface CachedRate {
  rate: number;
  timestamp: number;
  date: string;
  source: 'api' | 'db' | 'hardcoded';
}

interface CachedRates {
  [currencyPair: string]: CachedRate;
}

// Taux hardcodés de dernier recours — mis à jour mai 2026
const HARDCODED_FALLBACK_RATES: Record<string, number> = {
  'USD_EUR': 0.855,
  'USD_CNY': 7.25,
  'EUR_USD': 1.17,
  'EUR_CNY': 8.48,
  'CNY_USD': 0.138,
  'CNY_EUR': 0.118,
};

class CurrencyConverter {
  private static instance: CurrencyConverter;
  private cache = new Map<string, CachedRate>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 min
  private readonly API_BASE_URL = 'https://api.frankfurter.dev/v1';
  private persistPromises = new Map<string, Promise<void>>();

  private constructor() {}

  public static getInstance(): CurrencyConverter {
    if (!CurrencyConverter.instance) {
      CurrencyConverter.instance = new CurrencyConverter();
    }
    return CurrencyConverter.instance;
  }

  /**
   * Sauvegarde le taux en BDD via l'API interne (fire-and-forget, côté client).
   * Côté serveur, appelle directement Prisma.
   */
  private persistRate(fromCurrency: string, toCurrency: string, rate: number, date: string): void {
    if (typeof window !== 'undefined') return; // Never persist from client-side

    const key = `${fromCurrency}_${toCurrency}_${date}`;
    if (this.persistPromises.has(key)) return;

    const promise = (async () => {
      try {
        const { prisma } = await import('~/prisma/prisma');
        await prisma.exchangeRate.upsert({
          where: {
            fromCurrency_toCurrency_date: { fromCurrency, toCurrency, date },
          },
          update: { rate, source: 'frankfurter', updatedAt: new Date() },
          create: { fromCurrency, toCurrency, rate, date, source: 'frankfurter' },
        });
      } catch (err) {
        console.warn('Failed to persist exchange rate:', err);
      } finally {
        this.persistPromises.delete(key);
      }
    })();

    this.persistPromises.set(key, promise);
  }

  /**
   * Récupère le dernier taux connu en BDD.
   */
  private async getDbFallbackRate(fromCurrency: string, toCurrency: string): Promise<number | null> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/exchange-rate?from=${fromCurrency}&to=${toCurrency}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data?.rate ?? null;
      } else {
        const { prisma } = await import('~/prisma/prisma');
        const record = await prisma.exchangeRate.findFirst({
          where: { fromCurrency, toCurrency },
          orderBy: { createdAt: 'desc' },
        });
        return record?.rate ?? null;
      }
    } catch (err) {
      console.warn('Failed to fetch DB fallback rate:', err);
      return null;
    }
  }

  /**
   * Récupère les taux de change depuis l'API Frankfurter.
   * En cas d'échec, retourne null (le caller gère le fallback).
   */
  private async fetchExchangeRates(
    fromCurrency: SupportedCurrency,
    toCurrencies: SupportedCurrency[]
  ): Promise<Record<string, number> | null> {
    try {
      const symbols = toCurrencies.filter(c => c !== fromCurrency).join(',');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(
        `${this.API_BASE_URL}/latest?base=${fromCurrency}&symbols=${symbols}`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        clearTimeout(timeout);
        throw new Error(`Frankfurter API error: ${response.status}`);
      }

      const data: ExchangeRateResponse = await response.json();
      clearTimeout(timeout);
      const rates = { ...data.rates };
      rates[fromCurrency] = 1.0;

      // Persist each fetched rate to DB (fire-and-forget)
      const today = data.date || new Date().toISOString().split('T')[0];
      for (const [currency, rate] of Object.entries(rates)) {
        if (currency !== fromCurrency) {
          this.persistRate(fromCurrency, currency, rate, today);
        }
      }

      return rates;
    } catch (error) {
      console.error('Frankfurter API fetch failed:', error);
      return null;
    }
  }

  /**
   * Obtient le taux de change avec la chaîne de fallback complète :
   * API Frankfurter → BDD (taux J-1) → hardcodé
   */
  public async getExchangeRate(
    fromCurrency: SupportedCurrency,
    toCurrency: SupportedCurrency
  ): Promise<number> {
    if (fromCurrency === toCurrency) return 1.0;

    const cacheKey = `${fromCurrency}_${toCurrency}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.rate;
    }

    // 1) Try Frankfurter API
    const apiRates = await this.fetchExchangeRates(fromCurrency, [toCurrency]);
    if (apiRates && apiRates[toCurrency]) {
      const rate = apiRates[toCurrency];
      this.cache.set(cacheKey, {
        rate,
        timestamp: now,
        date: new Date().toISOString().split('T')[0],
        source: 'api',
      });
      console.log(`[CurrencyConverter] API rate: 1 ${fromCurrency} = ${rate} ${toCurrency}`);
      return rate;
    }

    // 2) API failed — use expired cache if available (still better than fallback)
    if (cached) {
      console.warn(`[CurrencyConverter] API down, using expired cache (${cached.source}): 1 ${fromCurrency} = ${cached.rate} ${toCurrency}`);
      // Refresh cache timestamp to avoid hammering the API on every request
      this.cache.set(cacheKey, { ...cached, timestamp: now });
      return cached.rate;
    }

    // 3) No cache at all — try DB fallback (last known rate)
    const dbRate = await this.getDbFallbackRate(fromCurrency, toCurrency);
    if (dbRate) {
      this.cache.set(cacheKey, {
        rate: dbRate,
        timestamp: now,
        date: 'db-fallback',
        source: 'db',
      });
      console.warn(`[CurrencyConverter] Using DB fallback: 1 ${fromCurrency} = ${dbRate} ${toCurrency}`);
      return dbRate;
    }

    // 4) Last resort — hardcoded rates
    const hardcodedRate = HARDCODED_FALLBACK_RATES[cacheKey];
    if (!hardcodedRate) {
      console.error(`[CurrencyConverter] CRITICAL: No fallback rate for ${cacheKey}. Refusing to use 1.0.`);
      throw new Error(`No exchange rate available for ${fromCurrency}->${toCurrency}`);
    }
    this.cache.set(cacheKey, {
      rate: hardcodedRate,
      timestamp: now,
      date: 'hardcoded',
      source: 'hardcoded',
    });
    console.warn(`[CurrencyConverter] Using HARDCODED fallback: 1 ${fromCurrency} = ${hardcodedRate} ${toCurrency}`);
    return hardcodedRate;
  }

  /** Rétrocompatibilité */
  public async getUsdToEurRate(): Promise<number> {
    return this.getExchangeRate('USD', 'EUR');
  }

  /** Convertit un montant en centimes d'une devise vers une autre */
  public async convertCents(
    fromCents: number,
    fromCurrency: SupportedCurrency,
    toCurrency: SupportedCurrency
  ): Promise<number> {
    if (fromCurrency === toCurrency) return fromCents;
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    return Math.round(fromCents * rate);
  }

  /** Convertit un montant d'une devise vers une autre */
  public async convertAmount(
    amount: number,
    fromCurrency: SupportedCurrency,
    toCurrency: SupportedCurrency
  ): Promise<number> {
    if (fromCurrency === toCurrency) return amount;
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    return amount * rate;
  }

  /** Formate un prix en centimes avec le symbole de la devise */
  public formatPrice(cents: number, currency: SupportedCurrency): string {
    const currencyInfo = SUPPORTED_CURRENCIES[currency];
    const amount = (cents / 100).toFixed(2);

    if (currency === 'CNY' || currency === 'USD') {
      return `${currencyInfo.symbol}${amount}`;
    }
    return `${amount}${currencyInfo.symbol}`;
  }

  /** Rétrocompatibilité */
  public async convertUsdCentsToEurCents(usdCents: number): Promise<number> {
    return this.convertCents(usdCents, 'USD', 'EUR');
  }

  /** Rétrocompatibilité */
  public async convertUsdToEur(usdAmount: number): Promise<number> {
    return this.convertAmount(usdAmount, 'USD', 'EUR');
  }

  public formatEurPrice(eurCents: number): string {
    return this.formatPrice(eurCents, 'EUR');
  }

  public formatUsdPrice(usdCents: number): string {
    return this.formatPrice(usdCents, 'USD');
  }

  public clearCache(): void {
    this.cache.clear();
    console.log('[CurrencyConverter] Cache cleared');
  }

  public getCacheInfo(): {
    hasCache: boolean;
    age?: number;
    rate?: number;
    date?: string;
    source?: string;
  } {
    const cached = this.cache.get('USD_EUR');
    if (!cached) return { hasCache: false };

    return {
      hasCache: true,
      age: Date.now() - cached.timestamp,
      rate: cached.rate,
      date: cached.date,
      source: cached.source,
    };
  }
}

export const currencyConverter = CurrencyConverter.getInstance();

export type { ExchangeRateResponse, CachedRate, CachedRates };

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function formatCentsToCurrency(cents: number, currency: SupportedCurrency | string = 'EUR'): string {
  const validCurrency = (currency as SupportedCurrency) in SUPPORTED_CURRENCIES
    ? (currency as SupportedCurrency)
    : 'EUR';
  return currencyConverter.formatPrice(cents, validCurrency);
}

export function toCents(amount: number): number {
  return Math.round(parseFloat((amount * 100).toPrecision(12)));
}

export function fromCents(cents: number): number {
  return cents / 100;
}
