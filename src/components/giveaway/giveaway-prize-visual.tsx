'use client';

import { Badge } from '@/components/ui/badge';
import { GiveawayEurAmount } from '@/components/giveaway/giveaway-eur-amount';
import { useLocale } from '@/components/providers/locale-provider';
import { SafeImage } from '@/components/ui/safe-image';
import { TrophyIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { createGiveawayPrestigeParticles } from '@/lib/giveaway-motion';
import {
  getPrizeRarityColor,
  getPrizeValueCents,
  parsePrizeDisplay,
  type GiveawayVisualTier,
} from '@/lib/giveaway-presentation';
import type { GiveawayWithEntries } from '@/hooks/use-giveaways';

const PRESTIGE_PARTICLES = createGiveawayPrestigeParticles();

export function GiveawayPrizeVisual({
  giveaway,
  size = 'card',
  showDetails = true,
  grayscale = false,
  floating = false,
  prestige = false,
  tier,
}: {
  giveaway: GiveawayWithEntries;
  size?: 'card' | 'hero' | 'featured' | 'compact';
  showDetails?: boolean;
  grayscale?: boolean;
  floating?: boolean;
  prestige?: boolean;
  tier?: GiveawayVisualTier;
}) {
  const isHero = size === 'hero';
  const isCompact = size === 'compact';
  const showPrestige = prestige || tier === 'yearly';
  const skinHeight = isHero ? undefined : isCompact ? 110 : 160;

  return (
    <div className={cn('relative overflow-visible', isHero ? 'px-3 py-4 sm:px-4 sm:py-5' : 'px-2 py-2')}>
      <div
        className={cn(
          'giveaway-prize-halo pointer-events-none absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 rounded-full',
          isHero ? 'h-[11.5rem] w-[14rem] sm:h-[13rem] sm:w-[16rem]' : isCompact ? 'h-[7.5rem] w-[9.5rem]' : 'h-[10.5rem] w-[13rem]'
        )}
        aria-hidden
      />
      <div
        className={cn(
          'relative flex flex-col items-center justify-center',
          isHero ? 'min-h-[120px] sm:min-h-[140px]' : isCompact ? 'h-[110px]' : 'h-[160px]'
        )}
      >
        {showPrestige ? (
          <div className="giveaway-prestige pointer-events-none absolute inset-0" aria-hidden>
            {PRESTIGE_PARTICLES.map((particle, index) => (
              <span
                key={index}
                className="giveaway-prestige__particle"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  animationDelay: `${particle.delay}s`,
                  animationDuration: `${particle.duration}s`,
                }}
              />
            ))}
          </div>
        ) : null}
        <div className={cn('giveaway-prize-skin-wrap', floating && 'giveaway-prize-skin-wrap--float')}>
          <SafeImage
            src={giveaway.prizeImageUrl}
            alt={giveaway.prize}
            width={isHero ? 240 : isCompact ? 160 : 220}
            height={isHero ? 170 : skinHeight}
            className={cn(
              'giveaway-prize-skin object-contain drop-shadow-[0_14px_22px_rgba(0,0,0,0.45)]',
              isHero ? 'h-[120px] w-auto sm:h-[140px]' : isCompact ? 'h-[110px] w-auto' : 'h-[160px] w-auto',
              grayscale && 'grayscale'
            )}
            fallbackClassName={isHero ? 'h-[120px] w-[180px] rounded' : isCompact ? 'h-[110px] w-[140px] rounded' : 'h-[160px] w-[180px] rounded'}
            fallbackIcon={
              <TrophyIcon className={isHero ? 'h-16 w-16 text-theme-accent' : 'h-10 w-10 text-theme-accent'} />
            }
            unoptimized
          />
        </div>
        <span className="giveaway-prize-ground-shadow" aria-hidden />
      </div>
      {showDetails && (
        <div className="relative mt-3">
          <GiveawayPrizeDetails giveaway={giveaway} size={isHero ? 'hero' : 'card'} />
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
  const rarityColor = getPrizeRarityColor(giveaway.prize, giveaway.steamMarketHashName);
  const valueCents = getPrizeValueCents(giveaway);
  const isHero = size === 'hero';
  const nameColor = rarityColor ?? 'var(--tier)';

  const nameLine = parsed.hasStructuredName ? (
    layout === 'inline' ? (
      <p className="min-w-0 truncate text-xs">
        <span className="text-foreground/70">{parsed.weapon}</span>
        <span className="mx-1 font-semibold" style={{ color: nameColor }}>
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
          style={{ color: nameColor }}
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
