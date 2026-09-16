'use client';

import { Badge } from '@/components/ui/badge';
import { GiveawayEurAmount } from '@/components/giveaway/giveaway-eur-amount';
import { useLocale } from '@/components/providers/locale-provider';
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
    <div className={cn('relative overflow-visible', isHero ? 'px-3 py-4 sm:px-4 sm:py-5' : 'px-3 py-3')}>
      <div
        className={cn(
          'pointer-events-none absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl',
          isHero ? 'h-[11.5rem] w-[14rem] sm:h-[13rem] sm:w-[16rem]' : 'h-[8.5rem] w-[11rem]'
        )}
        style={{
          background: `radial-gradient(circle, ${halo}88 0%, ${halo}38 38%, transparent 72%)`,
        }}
        aria-hidden
      />
      <div
        className={cn(
          'relative flex flex-col items-center justify-center',
          isHero ? 'min-h-[120px] sm:min-h-[140px]' : 'h-[96px]'
        )}
      >
        <SafeImage
          src={giveaway.prizeImageUrl}
          alt={giveaway.prize}
          width={isHero ? 240 : 160}
          height={isHero ? 170 : 96}
          className={cn(
            'object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]',
            isHero ? 'h-[120px] w-auto sm:h-[140px]' : 'h-[96px] w-auto',
            grayscale && 'grayscale'
          )}
          fallbackClassName={isHero ? 'h-[120px] w-[180px] rounded' : 'h-[96px] w-[140px] rounded'}
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
  const { locale } = useLocale();
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
        <GiveawayEurAmount
          cents={valueCents}
          locale={locale}
          className={layout === 'inline' ? 'text-[11px]' : isHero ? 'text-base' : 'text-sm'}
        />
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
