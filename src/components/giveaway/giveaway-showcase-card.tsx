'use client';

import { useState } from 'react';
import { GiveawayCompactTime, GiveawayCountdown, useLiveNow } from '@/components/giveaway/giveaway-countdown';
import { GiveawayCtaButton } from '@/components/giveaway/giveaway-cta-button';
import { GiveawayCountUp, GiveawayCountUpMessage, useGiveawayBurstSyncedValue } from '@/components/giveaway/giveaway-count-up';
import { FragmentAmount } from '@/components/ui/level-badge';
import { GiveawayEurAmount } from '@/components/giveaway/giveaway-eur-amount';
import { GiveawayMotionSurface, giveawayTierSurfaceStyle } from '@/components/giveaway/giveaway-motion-surface';
import { GiveawayParticipateDialog } from '@/components/giveaway/giveaway-participate-dialog';
import { GiveawayPartnerBadge } from '@/components/giveaway/giveaway-partner-badge';
import { GiveawayPrizeVisual } from '@/components/giveaway/giveaway-prize-visual';
import { GiveawayTierBadge } from '@/components/giveaway/giveaway-tier-badge';
import { scrollToEarnFragments } from '@/components/giveaway/giveaway-earn-fragments';
import { useLocale } from '@/components/providers/locale-provider';
import type { GiveawayWithEntries } from '@/hooks/use-giveaways';
import {
  formatChancePercent,
  getDisplayedWinChance,
  getGiveawayCardAction,
  getGiveawayTier,
  getGiveawayTierAccent,
  getGiveawayTierLabel,
  getGiveawayTierTokens,
  getGiveawayVisualTier,
  getPrizeRarityColor,
  getPrizeValueCents,
  getTimeRemaining,
  giveawayTierLabels,
  giveawayVisualTierAttr,
  localizedGiveawayBlurb,
  parsePrizeDisplay,
} from '@/lib/giveaway-presentation';
import { cn } from '@/lib/utils';
import { ClockIcon, TicketIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import type { Messages } from '~/utils/types';

export function GiveawayShowcaseCard({
  giveaway,
  messages,
  userFragments,
  onParticipate,
  now,
  featured = false,
  selected = false,
  floatSkin,
  onActivate,
}: {
  giveaway: GiveawayWithEntries;
  messages: Messages;
  userFragments: number;
  onParticipate?: (giveaway: GiveawayWithEntries, entries: number) => void | Promise<void>;
  now?: number;
  featured?: boolean;
  selected?: boolean;
  floatSkin?: boolean;
  onActivate?: () => void;
}) {
  const { locale } = useLocale();
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [burst, setBurst] = useState({ id: 0, count: 1 });
  const liveNow = useLiveNow(1000, now === undefined);
  const layout = messages.giveaways.layout;
  const card = messages.giveaways.card;
  const endDate = typeof giveaway.endDate === 'string' ? new Date(giveaway.endDate) : giveaway.endDate;
  const timeRemaining = getTimeRemaining(endDate, now ?? liveNow);
  const durationTier = getGiveawayTier(giveaway);
  const visualTier = getGiveawayVisualTier(giveaway);
  const accent = getGiveawayTierAccent(visualTier);
  const tokens = getGiveawayTierTokens(visualTier);
  const labels = giveawayTierLabels(layout);
  const action = getGiveawayCardAction(giveaway, userFragments);
  const parsed = parsePrizeDisplay(giveaway.prize, giveaway.steamMarketHashName);
  const rarityColor = getPrizeRarityColor(giveaway.prize, giveaway.steamMarketHashName);
  const valueCents = getPrizeValueCents(giveaway);
  const isEnded = giveaway.status === 'ENDED' || timeRemaining.expired;
  const myEntries = giveaway.myEntries ?? 0;
  const totalParticipants = giveaway.totalParticipants ?? 0;
  const totalEntries = giveaway.totalEntries ?? giveaway.soldTickets;
  const chance = getDisplayedWinChance(myEntries, totalEntries, giveaway.myChancePercent);
  const burstSyncId = featured ? burst.id : 0;
  const displayedEntries = useGiveawayBurstSyncedValue(myEntries, burstSyncId);
  const displayedTotal = useGiveawayBurstSyncedValue(totalEntries, burstSyncId);
  const displayedChance = useGiveawayBurstSyncedValue(chance.percent, burstSyncId);
  const displayedHypothetical = useGiveawayBurstSyncedValue(chance.hypothetical, burstSyncId);
  const description = localizedGiveawayBlurb(giveaway, layout);
  const isPartner = visualTier === 'partner';
  const clickable = Boolean(onActivate) && !featured;
  const skinFloats = floatSkin ?? featured;

  const handleParticipate = async (target: GiveawayWithEntries, entries: number) => {
    if (!onParticipate) return;
    setSubmitting(true);
    try {
      await onParticipate(target, entries);
      setBurst((current) => ({ id: current.id + 1, count: entries }));
    } finally {
      setSubmitting(false);
    }
  };

  const nameColor = rarityColor ?? 'var(--tier)';
  const nameBlock = parsed.hasStructuredName ? (
    <>
      <p className="text-[12px] leading-tight text-foreground/70">{parsed.weapon}</p>
      <p
        className={cn('font-display font-bold leading-tight break-words', featured ? 'text-[22px]' : 'text-lg')}
        style={{ color: nameColor }}
      >
        {parsed.finish}
      </p>
      {parsed.exterior ? <p className="mt-0.5 text-xs text-foreground/70">{parsed.exterior}</p> : null}
    </>
  ) : (
    <p className={cn('font-display font-bold leading-tight break-words', featured ? 'text-[22px]' : 'text-lg')}>
      {parsed.fallbackName}
    </p>
  );

  const valueBlock =
    valueCents != null ? (
      <p
        className={cn(
          'mt-1 font-display font-semibold tabular-nums text-foreground',
          featured ? 'text-[28px] leading-none' : 'text-xl leading-none'
        )}
      >
        <GiveawayEurAmount cents={valueCents} locale={locale} split />
      </p>
    ) : null;

  const compactTime = (
    <GiveawayCompactTime
      remaining={timeRemaining}
      expiredLabel={card.status.ended}
      labels={{
        days: layout.compactDays,
        hours: layout.compactHours,
        minutes: layout.compactMinutes,
        seconds: layout.compactSeconds,
      }}
    />
  );

  const body = (
    <>
      <div className="flex items-start justify-between gap-2 overflow-visible">
        {isPartner ? (
          <GiveawayPartnerBadge giveaway={giveaway} messages={messages} />
        ) : (
          <GiveawayTierBadge tier={durationTier}>{getGiveawayTierLabel(durationTier, labels)}</GiveawayTierBadge>
        )}
        <span className="giveaway-cost-chip shrink-0">
          <FragmentAmount amount={giveaway.ticketPrice} size="xs" />
        </span>
      </div>

      <p className="mt-2 flex items-center justify-center gap-1 text-xs text-foreground/70">
        <UserGroupIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <GiveawayCountUpMessage template={card.socialEntries} token="{count}" value={displayedTotal} />
      </p>

      <GiveawayPrizeVisual
        giveaway={giveaway}
        size={featured ? 'featured' : 'compact'}
        showDetails={false}
        grayscale={isEnded}
        floating={skinFloats}
        prestige={durationTier === 'yearly'}
        tier={visualTier}
      />

      <div className="min-w-0 text-left">
        {nameBlock}
        {valueBlock}
      </div>

      {featured && description ? (
        <p className="giveaway-card-quote line-clamp-3">{description}</p>
      ) : null}

      <div className="giveaway-chance-pill mt-3">
        {displayedHypothetical ? (
          <p className="giveaway-chance-pill__label text-sm font-semibold">
            <GiveawayCountUpMessage
              template={card.chanceWithOneEntry}
              token="{percent}"
              value={displayedChance}
              format={(current) => formatChancePercent(current, locale)}
              decimals={2}
            />
          </p>
        ) : (
          <>
            <p className="giveaway-chance-pill__value font-display tabular-nums">
              <GiveawayCountUp
                value={displayedChance}
                format={(current) => formatChancePercent(current, locale)}
                decimals={2}
              />
            </p>
            <p className="giveaway-chance-pill__label">{card.chanceToWin}</p>
          </>
        )}
      </div>

      {featured ? (
        <GiveawayCountdown
          endDate={endDate}
          now={now ?? liveNow}
          compact
          className="mt-3 justify-center"
          labels={{
            days: layout.countdownDays,
            hours: layout.countdownHours,
            minutes: layout.countdownMinutes,
            seconds: layout.countdownSeconds,
          }}
        />
      ) : null}

      <div className={cn('giveaway-card-meta mt-3', !featured && 'max-w-full')}>
        <span className="giveaway-card-meta__item">
          <TicketIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <GiveawayCountUpMessage template={card.metaYourEntries} token="{count}" value={displayedEntries} />
        </span>
        <span className="giveaway-card-meta__sep" aria-hidden />
        <span className="giveaway-card-meta__item">
          <UserGroupIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <GiveawayCountUpMessage template={card.metaParticipants} token="{count}" value={totalParticipants} />
        </span>
        {featured ? null : (
          <>
            <span className="giveaway-card-meta__sep" aria-hidden />
            <span className="giveaway-card-meta__item" data-countdown>
              <ClockIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {compactTime}
            </span>
          </>
        )}
      </div>

      <div className="mt-auto pt-4">
        {isEnded ? (
          <span className="inline-flex w-full items-center justify-center rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground/70">
            {card.status.ended}
          </span>
        ) : (
          <GiveawayCtaButton
            action={action}
            submitting={submitting}
            messages={messages}
            ticketPrice={giveaway.ticketPrice}
            userFragments={userFragments}
            interactive={featured}
            layout="card"
            tier={visualTier}
            burstId={featured ? burst.id : 0}
            burstCount={burst.count}
            onParticipate={featured && onParticipate ? () => setModalOpen(true) : undefined}
            onEarnFragments={scrollToEarnFragments}
          />
        )}
      </div>
    </>
  );

  return (
    <>
      {featured ? (
        <GiveawayMotionSurface
          featured
          className={cn(
            'giveaway-card-surface surface giveaway-showcase-card giveaway-showcase-card--featured flex h-full w-full flex-col overflow-visible rounded-2xl p-5 backdrop-blur-md',
            selected && 'ring-2 ring-theme-accent/70'
          )}
          style={giveawayTierSurfaceStyle(accent, tokens)}
          data-giveaway={giveaway.id}
          data-tier={giveawayVisualTierAttr(visualTier)}
          role="article"
        >
          {body}
        </GiveawayMotionSurface>
      ) : (
        <GiveawayMotionSurface
          tilt
          role={clickable ? 'button' : 'article'}
          tabIndex={clickable ? 0 : undefined}
          data-giveaway={giveaway.id}
          data-tier={giveawayVisualTierAttr(visualTier)}
          className={cn(
            'giveaway-card-surface giveaway-showcase-card flex h-full w-full flex-col overflow-visible rounded-2xl p-4 text-left backdrop-blur-md',
            clickable
              ? 'surface-interactive giveaway-card-surface--interactive'
              : 'surface',
            selected && 'ring-2 ring-theme-accent/70'
          )}
          style={giveawayTierSurfaceStyle(accent, tokens)}
          onClick={clickable ? onActivate : undefined}
          onKeyDown={
            clickable
              ? (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onActivate?.();
                  }
                }
              : undefined
          }
          aria-label={clickable ? layout.selectGiveaway : undefined}
        >
          {body}
        </GiveawayMotionSurface>
      )}

      {featured && onParticipate ? (
        <GiveawayParticipateDialog
          open={modalOpen}
          onOpenChange={setModalOpen}
          giveaway={giveaway}
          messages={messages}
          userFragments={userFragments}
          onParticipate={handleParticipate}
        />
      ) : null}
    </>
  );
}
