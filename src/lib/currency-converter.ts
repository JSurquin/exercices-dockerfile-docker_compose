/**
 * Service de conversion de devises utilisant l'API Frankfurter
 * Convertit les prix USD vers EUR, CNY et autres devises avec cache pour optimiser les performances
 */

export type SupportedCurrency = 'USD' | 'EUR' | 'CNY';

export interface CurrencyInfo {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: Record<SupportedCurrency, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'Dollar américain', flag: '🇺🇸' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Yuan chinois', flag: '🇨🇳' },
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
}

interface CachedRates {
  [currencyPair: string]: CachedRate;
}

class CurrencyConverter {
  private static instance: CurrencyConverter;
  private cache = new Map<string, CachedRate>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes en millisecondes
  private readonly API_BASE_URL = 'https://api.frankfurter.dev/v1';

  private constructor() {}

  public static getInstance(): CurrencyConverter {
    if (!CurrencyConverter.instance) {
      CurrencyConverter.instance = new CurrencyConverter();
    }
    return CurrencyConverter.instance;
  }

  /**
   * Récupère les taux de change depuis l'API Frankfurter
   */
  private async fetchExchangeRates(fromCurrency: SupportedCurrency, toCurrencies: SupportedCurrency[]): Promise<Record<string, number>> {
    try {
      const symbols = toCurrencies.filter(c => c !== fromCurrency).join(',');
      const response = await fetch(`${this.API_BASE_URL}/latest?base=${fromCurrency}&symbols=${symbols}`);
      
      if (!response.ok) {
        throw new Error(`Erreur API Frankfurter: ${response.status}`);
      }

      const data: ExchangeRateResponse = await response.json();
      
      // Ajouter le taux de base (1.0 pour la devise de base)
      const rates = { ...data.rates };
      rates[fromCurrency] = 1.0;
      
      return rates;
    } catch (error) {
      console.error('Erreur lors de la récupération des taux de change:', error);
      // Taux de fallback approximatifs
      const fallbackRates: Record<string, number> = {
        'USD_EUR': 0.92,
        'USD_CNY': 7.25,
        'EUR_USD': 1.09,
        'EUR_CNY': 7.89,
        'CNY_USD': 0.14,
        'CNY_EUR': 0.13,
      };
      
      const result: Record<string, number> = {};
      toCurrencies.forEach(toCurrency => {
        if (toCurrency === fromCurrency) {
          result[toCurrency] = 1.0;
        } else {
          const key = `${fromCurrency}_${toCurrency}`;
          result[toCurrency] = fallbackRates[key] || 1.0;
        }
      });
      
      return result;
    }
  }

  /**
   * Obtient le taux de change entre deux devises avec cache
   */
  public async getExchangeRate(fromCurrency: SupportedCurrency, toCurrency: SupportedCurrency): Promise<number> {
    if (fromCurrency === toCurrency) return 1.0;
    
    const cacheKey = `${fromCurrency}_${toCurrency}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    // Vérifier si le cache est valide
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      console.log(`Utilisation du taux de change en cache: 1 ${fromCurrency} = ${cached.rate} ${toCurrency} (${cached.date})`);
      return cached.rate;
    }

    // Récupérer de nouveaux taux
    try {
      const rates = await this.fetchExchangeRates(fromCurrency, [toCurrency]);
      const rate = rates[toCurrency];
      
      if (!rate) {
        throw new Error(`Taux ${toCurrency} non disponible`);
      }
      
      // Mettre en cache
      this.cache.set(cacheKey, {
        rate,
        timestamp: now,
        date: new Date().toISOString().split('T')[0]
      });

      console.log(`Nouveau taux de change récupéré: 1 ${fromCurrency} = ${rate} ${toCurrency}`);
      return rate;
    } catch (error) {
      // Si on a un cache expiré, l'utiliser quand même
      if (cached) {
        console.warn(`Utilisation du taux de change expiré en cas d'erreur: 1 ${fromCurrency} = ${cached.rate} ${toCurrency}`);
        return cached.rate;
      }
      
      // Sinon, utiliser les taux de fallback
      const fallbackRates: Record<string, number> = {
        'USD_EUR': 0.92, 'USD_CNY': 7.25,
        'EUR_USD': 1.09, 'EUR_CNY': 7.89,
        'CNY_USD': 0.14, 'CNY_EUR': 0.13,
      };
      
      const fallbackRate = fallbackRates[cacheKey] || 1.0;
      console.warn(`Utilisation du taux de fallback: 1 ${fromCurrency} = ${fallbackRate} ${toCurrency}`);
      return fallbackRate;
    }
  }

  /**
   * Obtient le taux de change USD vers EUR avec cache (rétrocompatibilité)
   */
  public async getUsdToEurRate(): Promise<number> {
    return this.getExchangeRate('USD', 'EUR');
  }

  /**
   * Convertit un montant en centimes d'une devise vers une autre
   */
  public async convertCents(fromCents: number, fromCurrency: SupportedCurrency, toCurrency: SupportedCurrency): Promise<number> {
    if (fromCurrency === toCurrency) return fromCents;
    
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    return Math.round(fromCents * rate);
  }

  /**
   * Convertit un montant d'une devise vers une autre
   */
  public async convertAmount(amount: number, fromCurrency: SupportedCurrency, toCurrency: SupportedCurrency): Promise<number> {
    if (fromCurrency === toCurrency) return amount;
    
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    return amount * rate;
  }

  /**
   * Formate un prix en centimes avec le symbole de la devise
   */
  public formatPrice(cents: number, currency: SupportedCurrency): string {
    const currencyInfo = SUPPORTED_CURRENCIES[currency];
    const amount = (cents / 100).toFixed(2);
    
    // Pour le yuan, le symbole va avant le montant
    if (currency === 'CNY') {
      return `${currencyInfo.symbol}${amount}`;
    }
    
    // Pour USD, le symbole va avant
    if (currency === 'USD') {
      return `${currencyInfo.symbol}${amount}`;
    }
    
    // Pour EUR, le symbole va après
    return `${amount}${currencyInfo.symbol}`;
  }

  /**
   * Convertit un montant en centimes USD vers centimes EUR (rétrocompatibilité)
   */
  public async convertUsdCentsToEurCents(usdCents: number): Promise<number> {
    return this.convertCents(usdCents, 'USD', 'EUR');
  }

  /**
   * Convertit un montant en dollars USD vers euros EUR (rétrocompatibilité)
   */
  public async convertUsdToEur(usdAmount: number): Promise<number> {
    return this.convertAmount(usdAmount, 'USD', 'EUR');
  }

  /**
   * Formate un prix en centimes EUR avec le symbole € (rétrocompatibilité)
   */
  public formatEurPrice(eurCents: number): string {
    return this.formatPrice(eurCents, 'EUR');
  }

  /**
   * Formate un prix en centimes USD avec le symbole $ (rétrocompatibilité)
   */
  public formatUsdPrice(usdCents: number): string {
    return this.formatPrice(usdCents, 'USD');
  }

  /**
   * Vide le cache (utile pour forcer une mise à jour)
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('Cache des taux de change vidé');
  }

  /**
   * Obtient les informations du cache actuel
   */
  public getCacheInfo(): { hasCache: boolean; age?: number; rate?: number; date?: string } {
    const cached = this.cache.get('USD_EUR');
    if (!cached) {
      return { hasCache: false };
    }

    return {
      hasCache: true,
      age: Date.now() - cached.timestamp,
      rate: cached.rate,
      date: cached.date
    };
  }
}

// Export de l'instance singleton
export const currencyConverter = CurrencyConverter.getInstance();

// Export des types pour TypeScript
export type { ExchangeRateResponse, CachedRate, CachedRates };
