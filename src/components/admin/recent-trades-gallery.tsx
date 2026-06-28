'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SafeImage } from '@/components/ui/safe-image';
import { ConvertedPrice } from '@/components/ui/converted-price';
import { useLocale } from '@/components/providers/locale-provider';
import { queryKeys } from '@/lib/query-keys';
import { adminGlassCard, adminIconAccent, panelGlassField } from '@/lib/admin-ui';
import { cn } from '@/lib/utils';
import { TradeItem } from '@/lib/types';
import { Images, Package } from 'lucide-react';

const GALLERY_LIMITS = [5, 10, 20, 100] as const;

type GalleryLimit = (typeof GALLERY_LIMITS)[number];

interface GalleryTrade {
  id: string;
  ticketId: string;
  créédLe: string;
  items: TradeItem[];
}

interface GalleryResponse {
  trades: GalleryTrade[];
  limit: number;
}

const rarityGlow: Record<string, string> = {
  consumer_grade: 'from-gray-500/10',
  industrial_grade: 'from-blue-400/15',
  mil_spec: 'from-blue-600/20',
  restricted: 'from-purple-500/20',
  classified: 'from-pink-500/20',
  covert: 'from-red-500/25',
  contraband: 'from-yellow-400/25',
  extraordinary: 'from-yellow-400/25',
};

function rarityGradient(rarity: string) {
  const key = rarity?.toLowerCase().replace(/ /g, '_');
  return rarityGlow[key] ?? 'from-theme-accent/10';
}

export function RecentTradesGallery() {
  const { messages } = useLocale();
  const t = messages.adminNav.dashboardOverview;
  const [limit, setLimit] = useState<GalleryLimit>(5);

  const { data, isLoading, isFetching } = useQuery<GalleryResponse>({
    queryKey: queryKeys.adminTradesGallery(limit),
    queryFn: async () => {
      const response = await fetch(`/api/admin/trades/gallery?limit=${limit}`);
      if (!response.ok) throw new Error(t.galleryLoadError);
      return response.json();
    },
    staleTime: 30_000,
  });

  const galleryItems = useMemo(
    () => (data?.trades ?? []).flatMap((trade) => trade.items),
    [data?.trades]
  );

  const tradeCount = data?.trades.length ?? 0;

  return (
    <Card className={cn(adminGlassCard, 'transition-all duration-300')} data-testid="recent-trades-gallery">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-foreground flex items-center gap-2 text-base md:text-lg">
            <Images className={cn('h-5 w-5', adminIconAccent)} />
            {t.tradesGalleryTitle}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t.tradesGallerySub}</p>
          {!isLoading && tradeCount > 0 && (
            <p className="text-xs text-muted-foreground tabular-nums">
              {t.tradesGalleryMeta
                .replace('{trades}', String(tradeCount))
                .replace('{items}', String(galleryItems.length))}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground whitespace-nowrap">{t.tradesGalleryLimitLabel}</span>
          <Select
            value={String(limit)}
            onValueChange={(value) => setLimit(Number(value) as GalleryLimit)}
          >
            <SelectTrigger className={cn('w-[88px]', panelGlassField)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GALLERY_LIMITS.map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-theme-accent border-t-transparent" />
          </div>
        ) : galleryItems.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">{t.tradesGalleryEmpty}</p>
        ) : (
          <div
            className={cn(
              'max-h-[min(520px,60vh)] overflow-y-auto overflow-x-hidden rounded-xl border border-border/40 bg-background/20 p-3 backdrop-blur-sm',
              isFetching && 'opacity-70 transition-opacity'
            )}
          >
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12">
              {galleryItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'group flex flex-col overflow-hidden rounded-lg border border-border/50 bg-gradient-to-b to-background/40 shadow-sm transition-all duration-200 hover:border-theme-accent/40 hover:shadow-[0_0_16px_var(--cta-shadow)]',
                    rarityGradient(item.rarity)
                  )}
                >
                  <div className="relative flex aspect-square items-center justify-center bg-background/30 p-2">
                    <SafeImage
                      src={item.iconUrl}
                      alt={item.name}
                      width={72}
                      height={72}
                      className="h-full w-full max-h-14 max-w-14 object-contain drop-shadow-md transition-transform duration-200 group-hover:scale-105"
                      fallbackIcon={<Package className="h-6 w-6 text-muted-foreground/40" />}
                      unoptimized
                    />
                    {item.statTrak && (
                      <span className="absolute left-1 top-1 rounded bg-black/80 px-1 text-[8px] font-bold leading-tight text-yellow-400">
                        ST
                      </span>
                    )}
                  </div>

                  <div className="border-t border-border/30 bg-background/25 px-1.5 py-1.5 text-center">
                    <p className="text-[10px] font-semibold tabular-nums text-theme-accent leading-tight">
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
        )}
      </CardContent>
    </Card>
  );
}
