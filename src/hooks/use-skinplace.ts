import { useState, useCallback } from 'react';
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
} from '@/lib/types';

const authFetch: RequestInit = { credentials: 'include' };

interface UseSkinplaceOptions {
  onError?: (error: SkinplaceError) => void;
  onSuccess?: (data: unknown) => void;
}

export function useSkinplace(options: UseSkinplaceOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SkinplaceError | null>(null);

  const handleRequest = useCallback(async <T>(
    requestFn: () => Promise<T>
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await requestFn();
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const skinplaceError = err as SkinplaceError;
      setError(skinplaceError);
      options.onError?.(skinplaceError);
      return null;
    } finally {
      setLoading(false);
    }
  }, [options]);

  // Inventaire
  const getInventory = useCallback(async (steamId: string) => {
    return handleRequest<SkinplaceInventoryResponse>(async () => {
      const response = await fetch(`/api/skinplace/inventory?steam_id=${steamId}`, authFetch);
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    });
  }, [handleRequest]);

  // Inventaire multiple
  const getMultipleInventory = useCallback(async (steamIds: string[]) => {
    return handleRequest<SkinplaceMultipleInventoryResponse>(async () => {
      const response = await fetch('/api/skinplace/inventory/multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steam_ids: steamIds }),
        credentials: 'include',
      });
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    });
  }, [handleRequest]);

  // Créer un trade
  const createTrade = useCallback(async (
    steamId: string,
    items: string[],
    tradeUrl: string
  ) => {
    return handleRequest<SkinplaceTradeResponse>(async () => {
      const response = await fetch('/api/skinplace/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steam_id: steamId,
          items,
          trade_url: tradeUrl,
        }),
        credentials: 'include',
      });
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    });
  }, [handleRequest]);

  // Statut du trade
  const getTradeStatus = useCallback(async (token: string) => {
    return handleRequest<SkinplaceTradeResponse>(async () => {
      const response = await fetch(`/api/skinplace/trade/${token}`, authFetch);
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    });
  }, [handleRequest]);

  // Acheter des items
  const purchaseItems = useCallback(async (request: SkinplacePurchaseRequest) => {
    return handleRequest<SkinplacePurchaseResponse>(async () => {
      const response = await fetch('/api/skinplace/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        credentials: 'include',
      });
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    });
  }, [handleRequest]);

  // Items d'achat
  const getPurchaseItems = useCallback(async (purchaseId: string, detailed = false) => {
    return handleRequest<SkinplaceInventoryResponse>(async () => {
      const response = await fetch(
        `/api/skinplace/purchase/items?purchase_id=${purchaseId}&detailed=${detailed}`,
        authFetch
      );
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    });
  }, [handleRequest]);

  // Historique des achats
  const getPurchaseHistory = useCallback(async (
    page = 1,
    limit = 50,
    customId?: string
  ) => {
    return handleRequest<SkinplaceHistoryResponse>(async () => {
      const url = customId
        ? `/api/skinplace/purchase/history/${customId}?page=${page}&limit=${limit}`
        : `/api/skinplace/purchase/history?page=${page}&limit=${limit}`;
      
      const response = await fetch(url, authFetch);
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    });
  }, [handleRequest]);

  // Solde
  const getBalance = useCallback(async () => {
    return handleRequest<SkinplaceBalanceResponse>(async () => {
      const response = await fetch('/api/skinplace/balance', authFetch);
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    });
  }, [handleRequest]);

  // Recharges de solde
  const getBalanceRefills = useCallback(async () => {
    return handleRequest<SkinplaceHistoryResponse>(async () => {
      const response = await fetch('/api/skinplace/balance/refills', authFetch);
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    });
  }, [handleRequest]);

  // Historique instantané
  const getInstantHistory = useCallback(async (page = 1, limit = 50) => {
    return handleRequest<SkinplaceHistoryResponse>(async () => {
      const response = await fetch(
        `/api/skinplace/history?page=${page}&limit=${limit}`,
        authFetch
      );
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    });
  }, [handleRequest]);

  // Hold orders
  const getHoldOrders = useCallback(async (type: 'orders' | 'grouped' | 'full' = 'orders') => {
    return handleRequest<SkinplaceHoldResponse>(async () => {
      const response = await fetch(`/api/skinplace/hold?type=${type}`, authFetch);
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    });
  }, [handleRequest]);

  // Retirer du hold
  const withdrawFromHold = useCallback(async (orderId: string) => {
    return handleRequest<{ success: boolean; error?: string }>(async () => {
      const response = await fetch('/api/skinplace/hold/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
        credentials: 'include',
      });
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    });
  }, [handleRequest]);

  // Items en vente
  const getItemListings = useCallback(async (
    page = 1,
    limit = 50,
    filters?: {
      rarity?: string;
      exterior?: string;
      stat_trak?: boolean;
      min_price?: number;
      max_price?: number;
      search?: string;
    }
  ) => {
    return handleRequest<SkinplaceListingsResponse>(async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await fetch(`/api/skinplace/items/listing?${params}`, authFetch);
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    });
  }, [handleRequest]);

  return {
    loading,
    error,
    getInventory,
    getMultipleInventory,
    createTrade,
    getTradeStatus,
    purchaseItems,
    getPurchaseItems,
    getPurchaseHistory,
    getBalance,
    getBalanceRefills,
    getInstantHistory,
    getHoldOrders,
    withdrawFromHold,
    getItemListings,
  };
}
