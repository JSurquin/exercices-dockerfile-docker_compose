import { useState, useCallback } from 'react';

export interface SteamInventoryItem {
  id: string;
  classid: string;
  instanceid: string;
  amount: string;
  pos: number;
  // Description data
  appid: number;
  contextid: string;
  assetid: string;
  market_hash_name: string;
  market_name: string;
  name: string;
  name_color: string;
  type: string;
  icon_url: string;
  icon_url_large?: string;
  tradable: number;
  marketable: number;
  commodity: number;
  market_tradable_restriction: number;
  descriptions?: Array<{
    type: string;
    value: string;
    color?: string;
  }>;
  tags?: Array<{
    category: string;
    internal_name: string;
    localized_category_name: string;
    localized_tag_name: string;
    color?: string;
  }>;
  // Données calculées côté client
  rarity?: string;
  exterior?: string;
  stat_trak?: boolean;
  estimated_price?: number; // En centimes, via Skinplace pour l'estimation
}

export interface SteamInventoryResponse {
  success: boolean;
  total_inventory_count?: number;
  items: SteamInventoryItem[];
  error?: string;
}

interface UseSteamInventoryOptions {
  onError?: (error: string) => void;
  onSuccess?: (data: SteamInventoryResponse) => void;
}

export function useSteamInventory(options: UseSteamInventoryOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = useCallback(async <T>(
    requestFn: () => Promise<T>
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await requestFn();
      options.onSuccess?.(result as SteamInventoryResponse);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [options]);

  // Récupérer l'inventaire Steam d'un utilisateur
  const getSteamInventory = useCallback(async (steamId64: string) => {
    console.log('getSteamInventory');
    console.log('steamId64', steamId64);
    return handleRequest<SteamInventoryResponse>(async () => {
      const response = await fetch(`/api/steam/inventory?steam_id=${steamId64}`);
      console.log('response', response);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération de l\'inventaire');
      }
      return response.json();
    });
  }, [handleRequest]);

  // Estimer le prix des items via Skinplace
  const estimateItemsPrices = useCallback(async (items: SteamInventoryItem[]) => {
    return handleRequest<{ items: Array<{ id: string; estimated_price: number }> }>(async () => {
      const marketHashNames = items
        .filter(item => item.marketable === 1 && item.tradable === 1)
        .map(item => item.market_hash_name);

      if (marketHashNames.length === 0) {
        return { items: [] };
      }

      const response = await fetch('/api/steam/estimate-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market_hash_names: marketHashNames }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'estimation des prix');
      }
      return response.json();
    });
  }, [handleRequest]);

  // Utilitaires pour parser les données Steam
  const parseItemRarity = useCallback((item: SteamInventoryItem): string => {
    const rarityTag = item.tags?.find(tag => tag.category === 'Rarity');
    return rarityTag?.localized_tag_name || 'Unknown';
  }, []);

  const parseItemExterior = useCallback((item: SteamInventoryItem): string | undefined => {
    const exteriorTag = item.tags?.find(tag => tag.category === 'Exterior');
    return exteriorTag?.localized_tag_name;
  }, []);

  const isStatTrak = useCallback((item: SteamInventoryItem): boolean => {
    return item.market_hash_name.includes('StatTrak™') || 
           item.name.includes('StatTrak™');
  }, []);

  const isTradableAndMarketable = useCallback((item: SteamInventoryItem): boolean => {
    return item.tradable === 1 && item.marketable === 1;
  }, []);

  // Enrichir les items avec les données parsées
  const enrichItems = useCallback((items: SteamInventoryItem[]): SteamInventoryItem[] => {
    return items.map(item => ({
      ...item,
      rarity: parseItemRarity(item),
      exterior: parseItemExterior(item),
      stat_trak: isStatTrak(item),
    }));
  }, [parseItemRarity, parseItemExterior, isStatTrak]);

  return {
    loading,
    error,
    getSteamInventory,
    estimateItemsPrices,
    enrichItems,
    parseItemRarity,
    parseItemExterior,
    isStatTrak,
    isTradableAndMarketable,
  };
}
