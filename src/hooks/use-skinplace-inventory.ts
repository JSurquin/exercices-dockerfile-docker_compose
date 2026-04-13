import { useState, useCallback } from 'react';
import { NormalizedInventoryResponse, NormalizedInventoryItem } from '@/app/api/skinplace/inventory-with-prices/route';
import { currencyConverter } from '@/lib/currency-converter';
import { useLocale } from '@/components/providers/locale-provider';
import { RARITY_ORDER, getRarityHexColor, normalizeRarity } from '@/lib/cs2-constants';

interface UseSkinplaceInventoryOptions {
  onError?: (error: string) => void;
  onSuccess?: (data: NormalizedInventoryResponse) => void;
}

export function useSkinplaceInventory(options: UseSkinplaceInventoryOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { messages } = useLocale();

  const handleRequest = useCallback(async <T>(
    requestFn: () => Promise<T>
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await requestFn();
      options.onSuccess?.(result as NormalizedInventoryResponse);
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

  // Récupérer l'inventaire avec les prix depuis Skin.place
  const getSkinplaceInventory = useCallback(async (steamId64: string) => {
    console.log('getSkinplaceInventory pour:', steamId64);
    
    return handleRequest<NormalizedInventoryResponse>(async () => {
      const response = await fetch(`/api/skinplace/inventory-with-prices?steam_id=${steamId64}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération de l\'inventaire');
      }
      
      const data = await response.json();
      console.log('Inventaire Skin.place récupéré:', data);
      return data;
    });
  }, [handleRequest]);

  // Utilitaires pour filtrer et trier les items
  // Filtre les items réellement vendables (tradable ET sans skip_reason)
  const filterTradableItems = useCallback((items: NormalizedInventoryItem[]): NormalizedInventoryItem[] => {
    return items.filter(item => item.tradable && !item.skip_reason);
  }, []);

  const sortItemsByValue = useCallback((items: NormalizedInventoryItem[], ascending = false): NormalizedInventoryItem[] => {
    return [...items].sort((a, b) => {
      const valueA = a.price_centimes;
      const valueB = b.price_centimes;
      return ascending ? valueA - valueB : valueB - valueA;
    });
  }, []);

  const sortItemsByRarity = useCallback((items: NormalizedInventoryItem[]): NormalizedInventoryItem[] => {
    return [...items].sort((a, b) => {
      const rarityA = RARITY_ORDER[normalizeRarity(a.rarity)] ?? 0;
      const rarityB = RARITY_ORDER[normalizeRarity(b.rarity)] ?? 0;
      return rarityB - rarityA;
    });
  }, []);

  const filterBySearch = useCallback((items: NormalizedInventoryItem[], searchTerm: string): NormalizedInventoryItem[] => {
    if (!searchTerm.trim()) return items;
    
    const term = searchTerm.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(term) ||
      item.market_hash_name.toLowerCase().includes(term) ||
      item.steam_short_name.toLowerCase().includes(term)
    );
  }, []);

  const filterByRarity = useCallback((items: NormalizedInventoryItem[], rarity?: string): NormalizedInventoryItem[] => {
    if (!rarity) return items;
    return items.filter(item => item.rarity === rarity);
  }, []);

  const filterByExterior = useCallback((items: NormalizedInventoryItem[], exterior?: string): NormalizedInventoryItem[] => {
    if (!exterior) return items;
    return items.filter(item => item.exterior === exterior);
  }, []);

  const filterByStatTrak = useCallback((items: NormalizedInventoryItem[], statTrakOnly = false): NormalizedInventoryItem[] => {
    if (!statTrakOnly) return items;
    return items.filter(item => item.is_stattrak);
  }, []);

  // Calculer les statistiques de l'inventaire
  const calculateInventoryStats = useCallback((items: NormalizedInventoryItem[]) => {
    const tradableItems = filterTradableItems(items);
    const totalValue = tradableItems.reduce((sum, item) => sum + item.price_centimes, 0);
    
    const rarityStats = tradableItems.reduce((acc, item) => {
      acc[item.rarity] = (acc[item.rarity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const exteriorStats = tradableItems.reduce((acc, item) => {
      if (item.exterior) {
        acc[item.exterior] = (acc[item.exterior] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const statTrakCount = tradableItems.filter(item => item.is_stattrak).length;
    const souvenirCount = tradableItems.filter(item => item.is_souvenir).length;

    return {
      totalItems: items.length,
      tradableItems: tradableItems.length,
      totalValueCentimes: totalValue,
      averageValueCentimes: tradableItems.length > 0 ? Math.round(totalValue / tradableItems.length) : 0,
      rarityStats,
      exteriorStats,
      statTrakCount,
      souvenirCount,
    };
  }, [filterTradableItems]);

  // Formater le prix en euros (conversion USD -> EUR)
  const formatPrice = useCallback(async (usdCentimes: number): Promise<string> => {
    const eurCentimes = await currencyConverter.convertUsdCentsToEurCents(usdCentimes);
    return currencyConverter.formatEurPrice(eurCentimes);
  }, []);

  // Formater le prix en euros de manière synchrone (pour compatibilité)
  const formatPriceSync = useCallback((centimes: number): string => {
    return (centimes / 100).toFixed(2) + '€';
  }, []);

  // Obtenir la couleur de rareté
  const getRarityColor = useCallback((rarity: string): string => {
    return getRarityHexColor(rarity);
  }, []);

  // Catégories de skip_reason pour l'affichage conditionnel
  type SkipReasonCategory = 'overstock' | 'low_price' | 'high_volatility' | 'unliquid' | 'trade_lock' | 'other';

  const getSkipReasonCategory = useCallback((skipReason?: string): SkipReasonCategory | null => {
    if (!skipReason) return null;
    const r = skipReason.toLowerCase().trim();
    if (!r) return null;

    // Valeurs officielles Skinplace: trade_lock, low_price, high_price, system_lock
    if (r === 'trade_lock' || r.includes('trade_lock') || r.includes('trade lock')) return 'trade_lock';
    if (r === 'low_price' || r === 'price_too_low' || r.includes('low_price') || r.includes('low price')) return 'low_price';
    if (r === 'high_price' || r === 'high_volatility' || r.includes('high_price') || r.includes('high_volatility') || r.includes('volatile')) return 'high_volatility';
    if (r === 'unliquid' || r === 'low_demand' || r.includes('unliquid') || r.includes('illiquid') || r.includes('low_demand')) return 'unliquid';
    // system_lock = overstock côté Skinplace
    if (r === 'system_lock' || r === 'over_stock' || r === 'overstocked' || r === 'overstock' || r.includes('overstock') || r.includes('over_stock') || r.includes('system_lock')) return 'overstock';
    return 'other';
  }, []);

  // Traduire les skip_reason
  const translateSkipReason = useCallback((skipReason?: string): string => {
    if (!skipReason) return '';
    
    const skipReasons = messages.components?.skinplace?.skipReasons;
    if (!skipReasons) return skipReason;
    
    const category = getSkipReasonCategory(skipReason);
    switch (category) {
      case 'overstock':       return skipReasons.overstock ?? skipReasons.over_stock;
      case 'low_price':       return skipReasons.low_price ?? skipReasons.price_too_low;
      case 'high_volatility': return skipReasons.high_volatility ?? skipReason;
      case 'unliquid':        return skipReasons.unliquid ?? skipReasons.low_demand;
      case 'trade_lock':      return skipReasons.trade_lock ?? 'Trade lock';
      default:                return skipReasons.unknown;
    }
  }, [messages, getSkipReasonCategory]);

  return {
    loading,
    error,
    getSkinplaceInventory,
    filterTradableItems,
    sortItemsByValue,
    sortItemsByRarity,
    filterBySearch,
    filterByRarity,
    filterByExterior,
    filterByStatTrak,
    calculateInventoryStats,
    formatPrice,
    formatPriceSync,
    getRarityColor,
    translateSkipReason,
    getSkipReasonCategory,
  };
}

// Export des types pour faciliter l'utilisation
export type { NormalizedInventoryItem, NormalizedInventoryResponse };
