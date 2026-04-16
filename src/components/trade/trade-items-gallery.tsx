'use client';

import { useState } from 'react';
import { SafeImage } from '@/components/ui/safe-image';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TradeItem } from '@/hooks/use-user-trades';
import { ConvertedPrice } from '@/components/ui/converted-price';
import { MagnifyingGlassPlusIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface TradeItemsGalleryProps {
  items: TradeItem[];
}

const rarityColors: Record<string, string> = {
  consumer_grade:    'border-gray-400',
  industrial_grade:  'border-blue-400',
  mil_spec:          'border-blue-600',
  restricted:        'border-purple-500',
  classified:        'border-pink-500',
  covert:            'border-red-500',
  contraband:        'border-yellow-400',
  extraordinary:     'border-yellow-400',
};

function rarityBorder(rarity: string) {
  const key = rarity?.toLowerCase().replace(/ /g, '_');
  return rarityColors[key] ?? 'border-slate-500';
}

function ItemTile({
  item,
  size = 'md',
  onClick,
}: {
  item: TradeItem;
  size?: 'sm' | 'md' | 'lg';
  onClick: () => void;
}) {
  const dim = size === 'lg' ? 'w-full aspect-square' : size === 'md' ? 'w-20 h-20 sm:w-24 sm:h-24' : 'w-14 h-14 sm:w-16 sm:h-16';

  return (
    <button
      onClick={onClick}
      className={`relative group ${dim} rounded-lg border-2 ${rarityBorder(item.rarity)} bg-slate-900/60 overflow-hidden hover:scale-105 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500`}
    >
      <SafeImage
        src={item.iconUrl}
        alt={item.name}
        width={96}
        height={96}
        className="object-contain p-1"
        fallbackIcon={<Package className="w-12 h-12" />}
        unoptimized
      />
      {item.statTrak && (
        <span className="absolute top-0.5 left-0.5 text-[8px] font-bold text-yellow-400 bg-black/70 rounded px-0.5 leading-tight">
          ST
        </span>
      )}
      {/* Overlay zoom hint */}
      <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
        <MagnifyingGlassPlusIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </span>
    </button>
  );
}

export function TradeItemsGallery({ items }: TradeItemsGalleryProps) {
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);

  if (!items.length) return null;

  const openZoom = (i: number) => setZoomIndex(i);
  const closeZoom = () => setZoomIndex(null);
  const prev = () => setZoomIndex((i) => (i! > 0 ? i! - 1 : items.length - 1));
  const next = () => setZoomIndex((i) => (i! < items.length - 1 ? i! + 1 : 0));

  const zoomedItem = zoomIndex !== null ? items[zoomIndex] : null;

  /* ── Layout mosaïque selon le nombre d'items ── */
  const renderMosaic = () => {
    if (items.length === 1) {
      return (
        <div className="w-24 h-24 sm:w-28 sm:h-28">
          <ItemTile item={items[0]} size="lg" onClick={() => openZoom(0)} />
        </div>
      );
    }
    if (items.length === 2) {
      return (
        <div className="flex gap-1.5">
          {items.map((item, i) => (
            <ItemTile key={item.id} item={item} size="md" onClick={() => openZoom(i)} />
          ))}
        </div>
      );
    }
    if (items.length === 3) {
      return (
        <div className="flex gap-1.5">
          {items.map((item, i) => (
            <ItemTile key={item.id} item={item} size="md" onClick={() => openZoom(i)} />
          ))}
        </div>
      );
    }
    // 4+ items : grille 2×2 + badge overflow
    const visible = items.slice(0, 4);
    const overflow = items.length - 4;
    return (
      <div className="grid grid-cols-2 gap-1.5">
        {visible.map((item, i) => (
          <div key={item.id} className="relative">
            <ItemTile item={item} size="sm" onClick={() => openZoom(i)} />
            {/* Badge overflow sur la 4e case */}
            {i === 3 && overflow > 0 && (
              <button
                onClick={() => openZoom(3)}
                className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg text-white font-bold text-sm"
              >
                +{overflow}
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {renderMosaic()}

      {/* ── Dialog zoom ── */}
      <Dialog open={zoomIndex !== null} onOpenChange={(open) => !open && closeZoom()}>
        <DialogContent className="max-w-sm sm:max-w-md p-4 gap-0 bg-slate-900 border-slate-700">
          <DialogTitle className="sr-only">
            {zoomedItem?.name ?? 'Item'}
          </DialogTitle>

          {zoomedItem && (
            <div className="flex flex-col items-center gap-4">
              {/* Navigation */}
              {items.length > 1 && (
                <div className="flex items-center justify-between w-full">
                  <button
                    onClick={prev}
                    className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <ChevronLeftIcon className="w-5 h-5 text-slate-300" />
                  </button>
                  <span className="text-xs text-slate-400">
                    {zoomIndex! + 1} / {items.length}
                  </span>
                  <button
                    onClick={next}
                    className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <ChevronRightIcon className="w-5 h-5 text-slate-300" />
                  </button>
                </div>
              )}

              {/* Image grande */}
              <div className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-xl border-2 ${rarityBorder(zoomedItem.rarity)} bg-slate-800/80 flex items-center justify-center`}>
                <SafeImage
                  src={zoomedItem.iconUrl}
                  alt={zoomedItem.name}
                  width={224}
                  height={224}
                  className="object-contain p-3"
                  fallbackIcon={<Package className="w-20 h-20" />}
                  unoptimized
                />
              </div>

              {/* Infos */}
              <div className="text-center space-y-1.5 w-full">
                <p className="font-semibold text-white text-sm leading-snug">{zoomedItem.name}</p>
                <div className="flex items-center justify-center flex-wrap gap-1.5">
                  {zoomedItem.statTrak && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 text-xs">
                      StatTrak™
                    </Badge>
                  )}
                  {zoomedItem.exterior && (
                    <Badge variant="outline" className="text-xs text-slate-300 border-slate-600">
                      {zoomedItem.exterior}
                    </Badge>
                  )}
                  <Badge variant="outline" className={`text-xs border-2 ${rarityBorder(zoomedItem.rarity)} text-slate-300`}>
                    {zoomedItem.rarity}
                  </Badge>
                </div>
                <p className="text-orange-400 font-bold text-base">
                  <ConvertedPrice
                    usdCents={zoomedItem.prixCentimes}
                    fromCurrency="USD"
                    showOriginal
                  />
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
