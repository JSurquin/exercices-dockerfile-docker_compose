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
  return rarityColors[key] ?? 'border-slate-500';
}

export function AdminTradeItemsGrid({ items }: AdminTradeItemsGridProps) {
  if (!items.length) {
    return (
      <p className="rounded-lg border border-dashed border-slate-700 bg-slate-800/30 px-4 py-8 text-center text-sm text-slate-400">
        Aucun item
      </p>
    );
  }

  return (
    <div className="max-h-[min(50vh,28rem)] overflow-y-auto rounded-lg border border-slate-700 bg-slate-950/40 p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex flex-col overflow-hidden rounded-lg border-2 ${rarityBorder(item.rarity)} bg-slate-900/70`}
          >
            <div className="relative flex aspect-square items-center justify-center bg-slate-950/50 p-2">
              <SafeImage
                src={item.iconUrl}
                alt={item.name}
                width={96}
                height={96}
                className="h-full w-full object-contain"
                fallbackIcon={<Package className="h-10 w-10 text-slate-600" />}
                unoptimized
              />
              {item.statTrak && (
                <span className="absolute left-1.5 top-1.5 rounded bg-black/75 px-1 text-[10px] font-bold leading-tight text-yellow-400">
                  ST
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-1.5 p-2.5">
              <p className="line-clamp-2 text-xs font-medium leading-snug text-white" title={item.name}>
                {item.name}
              </p>

              <div className="flex flex-wrap gap-1">
                {item.exterior && (
                  <Badge
                    variant="outline"
                    className="border-slate-600 px-1.5 py-0 text-[10px] text-slate-300"
                  >
                    {item.exterior}
                  </Badge>
                )}
                {item.rarity && (
                  <Badge
                    variant="outline"
                    className={`px-1.5 py-0 text-[10px] capitalize text-slate-400 ${rarityBorder(item.rarity)}`}
                  >
                    {item.rarity.replace(/_/g, ' ')}
                  </Badge>
                )}
              </div>

              <p className="mt-auto text-sm font-semibold text-blue-400">
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
    </div>
  );
}
