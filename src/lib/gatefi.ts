import crypto from 'crypto';

// =============================================================================
// CONFIGURATION
// =============================================================================

export const GATEFI_CONFIG = {
  apiKeyPublic: process.env.GATEFI_API_KEY_PUBLIC!,
  apiKeyPrivate: process.env.GATEFI_API_KEY_PRIVATE!,
  partnerAccountId: process.env.GATEFI_PARTNER_ACCOUNT_ID!,
  webhookSecret: process.env.GATEFI_WEBHOOK_SECRET,
  environment: (process.env.GATEFI_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
};

// URLs de base selon l'environnement
export const GATEFI_URLS = {
  offramp: GATEFI_CONFIG.environment === 'production' 
    ? 'https://api.gatefi.com/offramp/v1'
    : 'https://api-sandbox.gatefi.com/offramp/v1',
  onramp: GATEFI_CONFIG.environment === 'production'
    ? 'https://api.gatefi.com/onramp/v1'
    : 'https://api-sandbox.gatefi.com/onramp/v1',
};

// =============================================================================
// TYPES
// =============================================================================

export interface GateFiQuoteRequest {
  partnerAccountId: string;
  fiatAmount?: number;
  cryptoAmount?: string;
  payment: string;
  fiat: string;
  crypto: string;
  region: string;
  calcByFiat?: boolean;
}

export interface GateFiQuoteResponse {
  amountIn: string;
  amountOut: string;
  processingFee: string;
  networkFee?: string;
  rate: string;
  crypto: string;
  fiat: string;
}

export interface GateFiSellRequest {
  partnerAccountId: string;
  amount: string;
  payment: string;
  fiat: string;
  crypto: string;
  region: string;
  orderCustomId: string;
  email?: string;
  emailLock?: boolean;
  sumsubTokenShare?: string;
}

export interface GateFiBuyRequest {
  partnerAccountId: string;
  amount: string;
  payment: string;
  fiat: string;
  crypto: string;
  region: string;
  walletAddress: string;
  orderCustomId?: string;
  email?: string;
  emailLock?: boolean;
  sumsubTokenShare?: string;
  successUrl?: string;
  cancelUrl?: string;
  declineUrl?: string;
}

export interface GateFiOrderResponse {
  id: string;
  orderCustomId?: string;
  status: GateFiOrderStatus;
  orderType: 'BUY' | 'SELL';
  crypto: string;
  fiat: string;
  cryptoAmount: string;
  fiatAmount: string;
  processingFee: string;
  networkFee?: string;
  txHash?: string;
  walletAddress?: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  failureReason?: string;
}

export type GateFiOrderStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELED';

export interface GateFiConfiguration {
  version: string;
  updatedAt: string;
  features: {
    quotes: { enabled: boolean };
    buy?: { enabled: boolean };
    sell?: { enabled: boolean };
  };
  limits: Record<string, any>;
  paymentMethods: Array<{
    code: string;
    name: string;
    fiat: string[];
    crypto: string[];
  }>;
}

export interface GateFiError {
  error: string;
  message: string;
  statusCode: number;
}

// =============================================================================
// SIGNATURE GENERATION
// =============================================================================

/**
 * Génère la signature HMAC SHA-256 pour l'authentification GateFi
 * @param queryString - Query string de la requête (sans le '?')
 * @param apiKeyPrivate - Clé API privée
 * @returns Signature hexadécimale
 */
export function generateSignature(queryString: string, apiKeyPrivate: string): string {
  const hmac = crypto.createHmac('sha256', apiKeyPrivate);
  hmac.update(queryString);
  return hmac.digest('hex');
}

/**
 * Construit la query string à partir des paramètres
 * @param params - Objet contenant les paramètres
 * @returns Query string encodée
 */
export function buildQueryString(params: Record<string, any>): string {
  const sortedKeys = Object.keys(params).sort();
  const queryParts: string[] = [];
  
  for (const key of sortedKeys) {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') {
      queryParts.push(`${key}=${encodeURIComponent(String(value))}`);
    }
  }
  
  return queryParts.join('&');
}

/**
 * Prépare les headers pour une requête GateFi
 * @param queryString - Query string de la requête
 * @returns Headers avec api-key et signature
 */
export function prepareHeaders(queryString: string): Record<string, string> {
  const signature = generateSignature(queryString, GATEFI_CONFIG.apiKeyPrivate);
  
  return {
    'api-key': GATEFI_CONFIG.apiKeyPublic,
    'signature': signature,
    'Content-Type': 'application/json',
  };
}

// =============================================================================
// HTTP CLIENT
// =============================================================================

export interface FetchOptions {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * Effectue une requête HTTP avec retry et backoff exponentiel
 */
export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit & FetchOptions = {}
): Promise<T> {
  const {
    retries = 3,
    retryDelay = 1000,
    timeout = 30000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Si c'est une redirection (303), retourner l'URL de location
      if (response.status === 303) {
        const location = response.headers.get('location');
        if (!location) {
          throw new Error('303 redirect without location header');
        }
        return { redirectUrl: location } as T;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `GateFi API error: ${response.status} - ${errorData.message || response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      lastError = error as Error;

      // Ne pas retry sur les erreurs 4xx (sauf 429)
      if (error instanceof Error && error.message.includes('4')) {
        const status = parseInt(error.message.match(/\d{3}/)?.[0] || '0');
        if (status >= 400 && status < 500 && status !== 429) {
          throw error;
        }
      }

      // Attendre avant de retry avec backoff exponentiel
      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Unknown error during fetch');
}

// =============================================================================
// MONTANTS ET CONVERSIONS
// =============================================================================

/**
 * Convertit les centimes en EUR avec 2 décimales
 */
export function centsToEur(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Convertit EUR en centimes
 */
export function eurToCents(eur: number): number {
  return Math.round(eur * 100);
}

/**
 * Valide un montant en centimes
 */
export function validateAmount(cents: number): boolean {
  return cents > 0 && Number.isInteger(cents);
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Valide la configuration GateFi
 */
export function validateConfig(): void {
  if (!GATEFI_CONFIG.apiKeyPublic) {
    throw new Error('GATEFI_API_KEY_PUBLIC is not configured');
  }
  if (!GATEFI_CONFIG.apiKeyPrivate) {
    throw new Error('GATEFI_API_KEY_PRIVATE is not configured');
  }
  if (!GATEFI_CONFIG.partnerAccountId) {
    throw new Error('GATEFI_PARTNER_ACCOUNT_ID is not configured');
  }
}

/**
 * Valide une signature webhook GateFi
 */
export function validateWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!GATEFI_CONFIG.webhookSecret) {
    throw new Error('GATEFI_WEBHOOK_SECRET is not configured');
  }

  const expectedSignature = crypto
    .createHmac('sha256', GATEFI_CONFIG.webhookSecret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// =============================================================================
// CONSTANTES
// =============================================================================

export const SUPPORTED_FIATS = ['EUR', 'USD', 'GBP'] as const;
export const SUPPORTED_CRYPTOS = ['ETH', 'USDT', 'USDC', 'BTC'] as const;
export const SUPPORTED_SEPA_REGIONS = ['FR', 'DE', 'ES', 'IT', 'NL', 'BE'] as const;

export const PAYMENT_METHODS = {
  SEPA: 'SEPATRANSFER',
  CRYPTO: 'CRYPTO',
} as const;

// Limites par défaut (à ajuster selon la configuration réelle)
export const DEFAULT_LIMITS = {
  SEPA: {
    min: 1000, // 10 EUR en centimes
    max: 100000, // 1000 EUR en centimes
  },
  CRYPTO: {
    min: 1000, // 10 EUR équivalent
    max: 500000, // 5000 EUR équivalent
  },
} as const;

