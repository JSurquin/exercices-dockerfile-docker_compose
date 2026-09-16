'use client';

import { Badge } from '@/components/ui/badge';
import { ConvertedAmount } from '@/components/ui/converted-amount';
import { SafeImage } from '@/components/ui/safe-image';
import { TrophyIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import {
  getPrizeHaloColor,
  getPrizeValueCents,
  parsePrizeDisplay,
} from '@/lib/giveaway-presentation';
import type { GiveawayWithEntries } from '@/hooks/use-giveaways';

export function GiveawayPrizeVisual({
  giveaway,
  size = 'card',
}: {
  giveaway: GiveawayWithEntries;
  size?: 'card' | 'hero';
}) {
  const parsed = parsePrizeDisplay(giveaway.prize, giveaway.steamMarketHashName);
  const halo = getPrizeHaloColor(giveaway.prize, giveaway.steamMarketHashName);
  const valueCents = getPrizeValueCents(giveaway);
  const isHero = size === 'hero';

  return (
    <div className={cn('relative overflow-hidden rounded-xl', isHero ? 'p-6 sm:p-8' : 'p-4')}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 58%, ${halo}55 0%, transparent 68%)`,
        }}
        aria-hidden
      />
      <div className={cn('relative flex flex-col items-center', isHero ? 'min-h-[220px]' : 'min-h-[132px]')}>
        <SafeImage
          src={giveaway.prizeImageUrl}
          alt={giveaway.prize}
          width={isHero ? 280 : 160}
          height={isHero ? 200 : 110}
          className={cn(
            'object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]',
            isHero ? 'h-[180px] w-auto sm:h-[200px]' : 'h-[96px] w-auto'
          )}
          fallbackClassName={isHero ? 'h-[180px] w-[240px] rounded' : 'h-[96px] w-[140px] rounded'}
          fallbackIcon={<TrophyIcon className={isHero ? 'h-16 w-16 text-theme-accent' : 'h-10 w-10 text-theme-accent'} />}
          unoptimized
        />
        <div className="mt-3 w-full text-center">
          {parsed.hasStructuredName ? (
            <>
              <p className={cn('font-display text-muted-foreground', isHero ? 'text-sm' : 'text-xs')}>
                {parsed.weapon}
              </p>
              <p
                className={cn('font-display font-semibold', isHero ? 'text-2xl sm:text-3xl' : 'text-base')}
                style={{ color: halo }}
              >
                {parsed.finish}
              </p>
              {parsed.exterior && (
                <p className={cn('mt-1 text-muted-foreground', isHero ? 'text-sm' : 'text-xs')}>
                  {parsed.exterior}
                </p>
              )}
            </>
          ) : (
            <p className={cn('font-display font-semibold', isHero ? 'text-2xl sm:text-3xl' : 'text-base')}>
              {parsed.fallbackName}
            </p>
          )}
        </div>
        {valueCents != null && (
          <Badge
            className={cn(
              'mission-glass-badge mt-3 font-display font-semibold',
              isHero ? 'px-4 py-1.5 text-lg' : 'px-2.5 py-1 text-sm'
            )}
          >
            <ConvertedAmount cents={valueCents} className={isHero ? 'h-6' : 'h-4'} />
          </Badge>
        )}
      </div>
    </div>
  );
}
