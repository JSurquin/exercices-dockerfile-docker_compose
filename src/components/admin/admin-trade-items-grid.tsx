'use client';

import { SafeImage } from '@/components/ui/safe-image';
import { Badge } from '@/components/ui/badge';
import { ConvertedPrice } from '@/components/ui/converted-price';
import { Package } from 'lucide-react';
import { TradeItem } from '@/lib/types';

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

export function AdminTradeItemsGrid({ items }: AdminTradeItemsGridProps) {
  if (!items.length) {
    return (
      <p className="admin-dialog-stat rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        Aucun item
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10">
      {items.map((item) => (
        <div
          key={item.id}
          className={`admin-dialog-stat flex flex-col overflow-hidden rounded-md border p-0 ${rarityBorder(item.rarity)}`}
        >
          <div className="relative flex h-10 items-center justify-center bg-background/30 p-0.5">
            <SafeImage
              src={item.iconUrl}
              alt={item.name}
              width={36}
              height={36}
              className="h-8 w-8 object-contain"
              fallbackIcon={<Package className="h-4 w-4 text-muted-foreground/50" />}
              unoptimized
            />
            {item.statTrak && (
              <span className="absolute left-0.5 top-0.5 rounded bg-black/75 px-0.5 text-[7px] font-bold leading-tight text-yellow-400">
                ST
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-0.5 px-1 pb-1 pt-0.5">
            <p
              className="line-clamp-2 text-[9px] font-medium leading-tight text-foreground"
              title={item.name}
            >
              {item.name}
            </p>

            {item.exterior && (
              <Badge
                variant="outline"
                className="admin-panel-field w-fit px-1 py-0 text-[8px] leading-tight text-muted-foreground"
              >
                {item.exterior}
              </Badge>
            )}

            <p className="mt-auto truncate text-[9px] font-semibold tabular-nums text-theme-accent">
              <ConvertedPrice
                usdCents={item.prixCentimes}
                fromCurrency="USD"
                showOriginal
              />
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
