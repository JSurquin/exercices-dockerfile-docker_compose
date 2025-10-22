import { useState, useEffect, useCallback } from 'react';
import { currencyConverter } from '@/lib/currency-converter';

interface UseCurrencyConverterOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // en millisecondes
}

export function useCurrencyConverter(options: UseCurrencyConverterOptions = {}) {
  const { autoRefresh = false, refreshInterval = 5 * 60 * 1000 } = options; // 5 minutes par défaut
  
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Récupérer le taux de change
  const fetchRate = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const rate = await currencyConverter.getUsdToEurRate();
      setExchangeRate(rate);
      setLastUpdate(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Erreur lors de la récupération du taux de change:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Convertir un prix en centimes USD vers centimes EUR
  const convertUsdCentsToEurCents = useCallback(async (usdCents: number): Promise<number> => {
    return await currencyConverter.convertUsdCentsToEurCents(usdCents);
  }, []);

  // Convertir un prix en dollars USD vers euros EUR
  const convertUsdToEur = useCallback(async (usdAmount: number): Promise<number> => {
    return await currencyConverter.convertUsdToEur(usdAmount);
  }, []);

  // Formater un prix en euros
  const formatEurPrice = useCallback((eurCents: number): string => {
    return currencyConverter.formatEurPrice(eurCents);
  }, []);

  // Formater un prix en dollars
  const formatUsdPrice = useCallback((usdCents: number): string => {
    return currencyConverter.formatUsdPrice(usdCents);
  }, []);

  // Convertir et formater directement un prix USD en EUR
  const convertAndFormatPrice = useCallback(async (usdCents: number): Promise<string> => {
    const eurCents = await convertUsdCentsToEurCents(usdCents);
    return formatEurPrice(eurCents);
  }, [convertUsdCentsToEurCents, formatEurPrice]);

  // Vider le cache
  const clearCache = useCallback(() => {
    currencyConverter.clearCache();
    fetchRate(); // Récupérer un nouveau taux
  }, [fetchRate]);

  // Obtenir les informations du cache
  const getCacheInfo = useCallback(() => {
    return currencyConverter.getCacheInfo();
  }, []);

  // Charger le taux initial
  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

  // Auto-refresh si activé
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchRate();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchRate]);

  return {
    // État
    exchangeRate,
    loading,
    error,
    lastUpdate,
    
    // Actions
    fetchRate,
    clearCache,
    
    // Utilitaires de conversion
    convertUsdCentsToEurCents,
    convertUsdToEur,
    convertAndFormatPrice,
    
    // Utilitaires de formatage
    formatEurPrice,
    formatUsdPrice,
    
    // Informations
    getCacheInfo,
  };
}
