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
  showDetails = true,
  grayscale = false,
}: {
  giveaway: GiveawayWithEntries;
  size?: 'card' | 'hero';
  showDetails?: boolean;
  grayscale?: boolean;
}) {
  const halo = getPrizeHaloColor(giveaway.prize, giveaway.steamMarketHashName);
  const isHero = size === 'hero';

  return (
    <div className={cn('relative overflow-hidden rounded-xl', isHero ? 'p-4 sm:p-5' : 'p-2')}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 58%, ${halo}55 0%, transparent 68%)`,
        }}
        aria-hidden
      />
      <div
        className={cn(
          'relative flex flex-col items-center justify-center',
          isHero ? 'min-h-[120px] sm:min-h-[140px]' : 'h-[120px]'
        )}
      >
        <SafeImage
          src={giveaway.prizeImageUrl}
          alt={giveaway.prize}
          width={isHero ? 240 : 180}
          height={isHero ? 170 : 120}
          className={cn(
            'object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]',
            isHero ? 'h-[120px] w-auto sm:h-[140px]' : 'h-[120px] w-auto',
            grayscale && 'grayscale'
          )}
          fallbackClassName={isHero ? 'h-[120px] w-[180px] rounded' : 'h-[120px] w-[160px] rounded'}
          fallbackIcon={
            <TrophyIcon className={isHero ? 'h-16 w-16 text-theme-accent' : 'h-10 w-10 text-theme-accent'} />
          }
          unoptimized
        />
      </div>
      {showDetails && (
        <div className="relative mt-3">
          <GiveawayPrizeDetails giveaway={giveaway} size={size} />
        </div>
      )}
    </div>
  );
}

export function GiveawayPrizeDetails({
  giveaway,
  size = 'card',
  layout = 'stacked',
}: {
  giveaway: GiveawayWithEntries;
  size?: 'card' | 'hero';
  layout?: 'stacked' | 'inline';
}) {
  const parsed = parsePrizeDisplay(giveaway.prize, giveaway.steamMarketHashName);
  const halo = getPrizeHaloColor(giveaway.prize, giveaway.steamMarketHashName);
  const valueCents = getPrizeValueCents(giveaway);
  const isHero = size === 'hero';

  const nameLine = parsed.hasStructuredName ? (
    layout === 'inline' ? (
      <p className="min-w-0 truncate text-xs">
        <span className="text-foreground/70">{parsed.weapon}</span>
        <span className="mx-1 font-semibold" style={{ color: halo }}>
          {parsed.finish}
        </span>
        {parsed.exterior ? <span className="text-foreground/70">{parsed.exterior}</span> : null}
      </p>
    ) : (
      <>
        <p className={cn('font-display text-foreground/70', isHero ? 'text-sm' : 'text-xs')}>
          {parsed.weapon}
        </p>
        <p
          className={cn('font-display font-semibold', isHero ? 'text-xl sm:text-2xl' : 'text-base')}
          style={{ color: halo }}
        >
          {parsed.finish}
        </p>
        {parsed.exterior && (
          <p className={cn('mt-0.5 text-foreground/70', isHero ? 'text-sm' : 'text-xs')}>
            {parsed.exterior}
          </p>
        )}
      </>
    )
  ) : (
    <p
      className={cn(
        'font-display font-semibold',
        layout === 'inline' ? 'truncate text-xs' : isHero ? 'text-xl sm:text-2xl' : 'text-base'
      )}
    >
      {parsed.fallbackName}
    </p>
  );

  const valueBadge =
    valueCents != null ? (
      <Badge
        className={cn(
          'mission-glass-badge shrink-0 font-display font-semibold',
          layout === 'inline'
            ? 'px-1.5 py-0.5 text-[11px]'
            : isHero
              ? 'mt-2 px-3 py-1 text-base'
              : 'mt-2 px-2.5 py-1 text-sm'
        )}
      >
        <ConvertedAmount cents={valueCents} className={layout === 'inline' ? 'h-3.5' : isHero ? 'h-5' : 'h-4'} />
      </Badge>
    ) : null;

  if (layout === 'inline') {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <div className="min-w-0 flex-1">{nameLine}</div>
        {valueBadge}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center">
      {nameLine}
      {valueBadge}
    </div>
  );
}
