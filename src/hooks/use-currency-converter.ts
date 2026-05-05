'use client';

import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { currencyConverter } from '@/lib/currency-converter';
import { queryKeys } from '@/lib/query-keys';
import { useLocale } from '@/components/providers/locale-provider';

interface UseCurrencyConverterOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useCurrencyConverter(options: UseCurrencyConverterOptions = {}) {
  const { autoRefresh = false, refreshInterval = 5 * 60 * 1000 } = options;
  const { messages } = useLocale();

  const {
    data: exchangeRate = null,
    isLoading: loading,
    error: queryError,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: queryKeys.currencyRate,
    queryFn: () => currencyConverter.getUsdToEurRate(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : messages.hooks.currency.unknownError
    : null;

  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  const convertUsdCentsToEurCents = useCallback(
    async (usdCents: number): Promise<number> =>
      currencyConverter.convertUsdCentsToEurCents(usdCents),
    []
  );

  const convertUsdToEur = useCallback(
    async (usdAmount: number): Promise<number> =>
      currencyConverter.convertUsdToEur(usdAmount),
    []
  );

  const formatEurPrice = useCallback(
    (eurCents: number): string => currencyConverter.formatEurPrice(eurCents),
    []
  );

  const formatUsdPrice = useCallback(
    (usdCents: number): string => currencyConverter.formatUsdPrice(usdCents),
    []
  );

  const convertAndFormatPrice = useCallback(
    async (usdCents: number): Promise<string> => {
      const eurCents = await convertUsdCentsToEurCents(usdCents);
      return formatEurPrice(eurCents);
    },
    [convertUsdCentsToEurCents, formatEurPrice]
  );

  const clearCache = useCallback(() => {
    currencyConverter.clearCache();
    refetch();
  }, [refetch]);

  const getCacheInfo = useCallback(() => currencyConverter.getCacheInfo(), []);

  return {
    exchangeRate,
    loading,
    error,
    lastUpdate,
    fetchRate: refetch,
    clearCache,
    convertUsdCentsToEurCents,
    convertUsdToEur,
    convertAndFormatPrice,
    formatEurPrice,
    formatUsdPrice,
    getCacheInfo,
  };
}
