import { 
  SkinplaceInventoryResponse,
  SkinplaceMultipleInventoryResponse,
  SkinplaceTradeResponse,
  SkinplacePurchaseRequest,
  SkinplacePurchaseResponse,
  SkinplaceBalanceResponse,
  SkinplaceHistoryResponse,
  SkinplaceHoldResponse,
  SkinplaceListingsResponse,
  SkinplaceError
} from './types';
import { logger } from './logger';

// Configuration Skinplace
const SKINPLACE_BASE_URL = process.env.SKINPLACE_API_URL || 'https://api.skin.place';
const SKINPLACE_API_KEY = process.env.SKINPLACE_API_KEY;
const SKINPLACE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache simple en mémoire (en production, utiliser Redis)
const cache = new Map<string, { data: unknown; timestamp: number }>();

interface SkinplaceConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

class SkinplaceService {
  private config: SkinplaceConfig;

  constructor() {
    this.config = {
      apiKey: SKINPLACE_API_KEY || '',
      baseUrl: SKINPLACE_BASE_URL,
      timeout: 10000, // 10 secondes
      retryAttempts: 3,
      retryDelay: 1000, // 1 seconde
    };
  }

  private async makeRequest<T = unknown>(
    endpoint: string,
    options: RequestInit = {},
    useCache = false
  ): Promise<T> {
    if (!this.config.apiKey) {
      throw new Error('SKINPLACE_API_KEY est requis pour utiliser l\'API Skinplace');
    }
    const cacheKey = `${endpoint}:${JSON.stringify(options.body || {})}`;

    // Vérifier le cache
    if (useCache) {
      const cached = cache.get(cacheKey) as { data: T; timestamp: number } | undefined;
      if (cached && Date.now() - cached.timestamp < SKINPLACE_CACHE_TTL) {
        logger.debug(`Cache hit for ${endpoint}`);
        return cached.data;
      }
    }

    const url = `${this.config.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'MoonSkin/1.0',
      ...options.headers,
    };

    let lastError: Error | null = null;

    // Log de la requête
    logger.api(options.method || 'GET', endpoint);
    if (options.body) {
      logger.debug('Request body:', JSON.parse(options.body as string));
    }

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Log de la réponse
        logger.api(options.method || 'GET', endpoint, response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          logger.error(`Skinplace API error (${response.status})`, errorData);
          throw new Error(
            `Skinplace API Error: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`
          );
        }

        const data = await response.json();

        // Log de la réponse réussie avec les données
        logger.api(options.method || 'GET', endpoint, response.status, data);

        // Mettre en cache si demandé
        if (useCache && (data as { success?: boolean }).success !== false) {
          cache.set(cacheKey, { data: data as unknown, timestamp: Date.now() });
          logger.debug(`Cached response for ${endpoint}`);
        }

        return data as T;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.retryAttempts) {
          logger.warn(`Attempt ${attempt} failed for ${endpoint}, retrying in ${this.config.retryDelay * attempt}ms...`, lastError.message);
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
        } else {
          logger.error(`All ${this.config.retryAttempts} attempts failed for ${endpoint}`, lastError);
        }
      }
    }

    throw lastError || new Error('Toutes les tentatives ont échoué');
  }

  // Inventaire instantané
  async getInventory(steamId: string): Promise<SkinplaceInventoryResponse> {
    return this.makeRequest<SkinplaceInventoryResponse>(
      `/api/v3/instant/inventory?steam_id=${steamId}`,
      { method: 'GET' },
      true // Utiliser le cache
    );
  }

  // Inventaire multiple
  async getMultipleInventory(steamIds: string[]): Promise<SkinplaceMultipleInventoryResponse> {
    return this.makeRequest<SkinplaceMultipleInventoryResponse>(
      '/api/v3/instant/inventory/multiple',
      {
        method: 'POST',
        body: JSON.stringify({ steam_ids: steamIds }),
      },
      true
    );
  }

  // Créer un trade instantané
  async createInstantTrade(
    steamId: string,
    items: string[],
    tradeUrl: string
  ): Promise<SkinplaceTradeResponse> {
    return this.makeRequest<SkinplaceTradeResponse>(
      '/api/v3/instant/payment/trade',
      {
        method: 'POST',
        body: JSON.stringify({
          steam_id: steamId,
          items,
          trade_url: tradeUrl,
        }),
      }
    );
  }

  // Obtenir le statut d'un trade
  async getTradeStatus(token: string): Promise<SkinplaceTradeResponse> {
    return this.makeRequest<SkinplaceTradeResponse>(
      `/api/v3/instant/payment/trade/${token}`,
      { method: 'GET' }
    );
  }

  // Acheter des items
  async purchaseItems(request: SkinplacePurchaseRequest): Promise<SkinplacePurchaseResponse> {
    return this.makeRequest<SkinplacePurchaseResponse>(
      '/api/v3/purchase',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  // Obtenir les items d'achat
  async getPurchaseItems(purchaseId: string): Promise<SkinplaceInventoryResponse> {
    return this.makeRequest<SkinplaceInventoryResponse>(
      `/api/v3/purchase/items?purchase_id=${purchaseId}`,
      { method: 'GET' }
    );
  }

  // Obtenir les items d'achat détaillés
  async getPurchaseItemsDetailed(purchaseId: string): Promise<SkinplaceInventoryResponse> {
    return this.makeRequest<SkinplaceInventoryResponse>(
      `/api/v3/purchase/items/detailed?purchase_id=${purchaseId}`,
      { method: 'GET' }
    );
  }

  // Historique des achats
  async getPurchaseHistory(
    page = 1,
    limit = 50,
    customId?: string
  ): Promise<SkinplaceHistoryResponse> {
    const endpoint = customId 
      ? `/api/v3/purchase/history/${customId}?page=${page}&limit=${limit}`
      : `/api/v3/purchase/history?page=${page}&limit=${limit}`;
    
    return this.makeRequest<SkinplaceHistoryResponse>(
      endpoint,
      { method: 'GET' },
      true
    );
  }

  // Solde
  async getBalance(): Promise<SkinplaceBalanceResponse> {
    return this.makeRequest<SkinplaceBalanceResponse>(
      '/api/v3/balance',
      { method: 'GET' }
    );
  }

  // Recharges de solde
  async getBalanceRefills(): Promise<SkinplaceHistoryResponse> {
    return this.makeRequest<SkinplaceHistoryResponse>(
      '/api/v3/balance/refills',
      { method: 'GET' },
      true
    );
  }

  // Historique instantané
  async getInstantHistory(
    page = 1,
    limit = 50
  ): Promise<SkinplaceHistoryResponse> {
    return this.makeRequest<SkinplaceHistoryResponse>(
      `/api/v3/instant/history?page=${page}&limit=${limit}`,
      { method: 'GET' },
      true
    );
  }

  // Lookup par order_ids (notre ticketId)
  async getInstantHistoryByOrderIds(orderIds: string[]): Promise<SkinplaceHistoryResponse> {
    return this.makeRequest<SkinplaceHistoryResponse>(
      '/api/v3/instant/history',
      {
        method: 'POST',
        body: JSON.stringify({ order_ids: orderIds, limit: 1 }),
      }
    );
  }

  // Hold orders
  async getHoldOrders(): Promise<SkinplaceHoldResponse> {
    return this.makeRequest<SkinplaceHoldResponse>(
      '/api/v3/hold/orders',
      { method: 'GET' },
      true
    );
  }

  // Hold orders groupés
  async getHoldOrdersGrouped(): Promise<SkinplaceHoldResponse> {
    return this.makeRequest<SkinplaceHoldResponse>(
      '/api/v3/hold/grouped',
      { method: 'GET' },
      true
    );
  }

  // Hold orders complets
  async getHoldOrdersFull(): Promise<SkinplaceHoldResponse> {
    return this.makeRequest<SkinplaceHoldResponse>(
      '/api/v3/hold/full',
      { method: 'GET' },
      true
    );
  }

  // Retirer du hold
  async withdrawFromHold(orderId: string): Promise<{ success: boolean; error?: string }> {
    return this.makeRequest<{ success: boolean; error?: string }>(
      '/api/v3/hold/withdraw',
      {
        method: 'POST',
        body: JSON.stringify({ order_id: orderId }),
      }
    );
  }

  // Items en vente
  async getItemListings(
    page = 1,
    limit = 50,
    filters?: {
      search?: string;
    }
  ): Promise<SkinplaceListingsResponse> {
    const body: Record<string, unknown> = {
      game: 'csgo',
      limit,
      offset: (page - 1) * limit,
    };

    if (filters?.search) {
      body.search = filters.search;
    }

    return this.makeRequest<SkinplaceListingsResponse>(
      '/api/v3/items/listing',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      true
    );
  }

  // Items d'achat complets
  async getPurchaseItemsFull(purchaseId: string): Promise<SkinplaceInventoryResponse> {
    return this.makeRequest<SkinplaceInventoryResponse>(
      `/api/v3/purchase/items/full?purchase_id=${purchaseId}`,
      { method: 'GET' }
    );
  }

  // Nettoyer le cache
  clearCache(): void {
    cache.clear();
  }

  // Nettoyer le cache pour un endpoint spécifique
  clearCacheForEndpoint(endpoint: string): void {
    const keysToDelete = Array.from(cache.keys()).filter(key => key.startsWith(endpoint));
    keysToDelete.forEach(key => cache.delete(key));
  }
}

// Instance singleton
export const skinplaceService = new SkinplaceService();

// Fonctions utilitaires
export function isSkinplaceError(response: unknown): response is SkinplaceError {
  if (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    'error' in response
  ) {
    const typed = response as { success: unknown; error: unknown };
    return typed.success === false && typeof typed.error === 'string';
  }

  return false;
}

export function handleSkinplaceError(error: unknown): SkinplaceError {
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
      code: 'NETWORK_ERROR',
    };
  }

  return {
    success: false,
    error: 'Erreur inconnue',
    code: 'UNKNOWN_ERROR',
  };
}

// Export des types pour faciliter l'utilisation
export type {
  SkinplaceInventoryResponse,
  SkinplaceMultipleInventoryResponse,
  SkinplaceTradeResponse,
  SkinplacePurchaseRequest,
  SkinplacePurchaseResponse,
  SkinplaceBalanceResponse,
  SkinplaceHistoryResponse,
  SkinplaceHoldResponse,
  SkinplaceListingsResponse,
  SkinplaceError,
};
