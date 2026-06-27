'use client';

import { SafeImage } from '@/components/ui/safe-image';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import { TradeItem } from '@/lib/types';
import { currencyConverter } from '@/lib/currency-converter';
import { useCurrency } from '@/components/providers/currency-provider';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useMemo } from 'react';

interface AdminTradeItemsGridProps {
  items: TradeItem[];
}

const rarityColors: Record<string, string> = {
  consumer_grade: 'border-gray-400',
  industrial_grade: 'border-blue-400',
  mil_spec: 'border-blue-600',
  restricted: 'border-purple-500',
  classified: 'border-pink-500',
  covert: 'border-red-500',
  contraband: 'border-yellow-400',
  extraordinary: 'border-yellow-400',
};

function rarityBorder(rarity: string) {
  const key = rarity?.toLowerCase().replace(/ /g, '_');
  return rarityColors[key] ?? 'border-border/50';
}

function useItemPriceFormatter() {
  const { selectedCurrency } = useCurrency();

  const { data: usdToSelectedRate } = useQuery({
    queryKey: [...queryKeys.currencyRate, selectedCurrency],
    queryFn: async () => {
      if (selectedCurrency === 'USD') return 1;
      return currencyConverter.getExchangeRate('USD', selectedCurrency);
    },
    staleTime: 5 * 60 * 1000,
  });

  return useMemo(() => {
    return (usdCents: number) => {
      const usdLabel = currencyConverter.formatUsdPrice(usdCents);
      if (selectedCurrency === 'USD' || usdToSelectedRate == null) {
        return usdLabel;
      }
      const convertedCents = Math.round(usdCents * usdToSelectedRate);
      const convertedLabel = currencyConverter.formatPrice(convertedCents, selectedCurrency);
      return `${convertedLabel} (${usdLabel})`;
    };
  }, [selectedCurrency, usdToSelectedRate]);
}

export function AdminTradeItemsGrid({ items }: AdminTradeItemsGridProps) {
  const formatItemPrice = useItemPriceFormatter();

  if (!items.length) {
    return (
      <p className="admin-dialog-stat rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        Aucun item
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
      {items.map((item) => (
        <div
          key={item.id}
          className={`flex flex-col overflow-hidden rounded-md border bg-background/20 ${rarityBorder(item.rarity)}`}
        >
          <div className="relative flex h-12 items-center justify-center bg-background/30 p-1 sm:h-14">
            <SafeImage
              src={item.iconUrl}
              alt={item.name}
              width={48}
              height={48}
              className="h-10 w-10 object-contain sm:h-11 sm:w-11"
              fallbackIcon={<Package className="h-6 w-6 text-muted-foreground/50" />}
              unoptimized
            />
            {item.statTrak && (
              <span className="absolute left-1 top-1 rounded bg-black/75 px-0.5 text-[8px] font-bold leading-tight text-yellow-400">
                ST
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-1 p-1.5">
            <p
              className="line-clamp-2 text-[10px] font-medium leading-tight text-foreground"
              title={item.name}
            >
              {item.name}
            </p>

            <div className="flex flex-wrap gap-0.5">
              {item.exterior && (
                <Badge
                  variant="outline"
                  className="admin-panel-field px-1 py-0 text-[9px] leading-tight text-muted-foreground"
                >
                  {item.exterior}
                </Badge>
              )}
            </div>

            <p
              className="mt-auto truncate text-[10px] font-semibold tabular-nums text-theme-accent sm:text-[11px]"
              title={formatItemPrice(item.prixCentimes)}
            >
              {formatItemPrice(item.prixCentimes)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
