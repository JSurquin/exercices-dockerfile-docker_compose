'use client';

import { useState } from 'react';
import { GiveawayCompactTime, GiveawayCountdown, useLiveNow } from '@/components/giveaway/giveaway-countdown';
import { GiveawayCtaButton } from '@/components/giveaway/giveaway-cta-button';
import { FragmentAmount } from '@/components/ui/level-badge';
import { GiveawayEurAmount } from '@/components/giveaway/giveaway-eur-amount';
import { GiveawayMotionSurface, giveawayTierSurfaceStyle } from '@/components/giveaway/giveaway-motion-surface';
import { GiveawayParticipateDialog } from '@/components/giveaway/giveaway-participate-dialog';
import { GiveawayPartnerBadge } from '@/components/giveaway/giveaway-partner-badge';
import { GiveawayPrizeVisual } from '@/components/giveaway/giveaway-prize-visual';
import { GiveawayStatBoxes } from '@/components/giveaway/giveaway-stat-boxes';
import { GiveawayTierBadge } from '@/components/giveaway/giveaway-tier-badge';
import { useLocale } from '@/components/providers/locale-provider';
import type { GiveawayWithEntries } from '@/hooks/use-giveaways';
import {
  getGiveawayCardAction,
  getGiveawayTier,
  getGiveawayTierAccent,
  getGiveawayTierLabel,
  getGiveawayTierTokens,
  getPrizeValueCents,
  getTimeRemaining,
  giveawayTierLabels,
  localizedGiveawayBlurb,
  parsePrizeDisplay,
} from '@/lib/giveaway-presentation';
import { cn } from '@/lib/utils';
import { ClockIcon } from '@heroicons/react/24/outline';
import type { Messages } from '~/utils/types';

export function GiveawayShowcaseCard({
  giveaway,
  messages,
  userFragments,
  onParticipate,
  now,
  featured = false,
  onActivate,
}: {
  giveaway: GiveawayWithEntries;
  messages: Messages;
  userFragments: number;
  onParticipate: (giveaway: GiveawayWithEntries, entries: number) => void | Promise<void>;
  now?: number;
  featured?: boolean;
  onActivate?: () => void;
}) {
  const { locale } = useLocale();
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [burst, setBurst] = useState({ id: 0, count: 1 });
  const liveNow = useLiveNow(1000, now === undefined);
  const layout = messages.giveaways.layout;
  const card = messages.giveaways.card;
  const fg = messages.giveaways.fragments;
  const endDate = typeof giveaway.endDate === 'string' ? new Date(giveaway.endDate) : giveaway.endDate;
  const timeRemaining = getTimeRemaining(endDate, now ?? liveNow);
  const tier = getGiveawayTier(giveaway);
  const accent = getGiveawayTierAccent(tier);
  const tokens = getGiveawayTierTokens(tier);
  const labels = giveawayTierLabels(layout);
  const action = getGiveawayCardAction(giveaway, userFragments);
  const parsed = parsePrizeDisplay(giveaway.prize, giveaway.steamMarketHashName);
  const valueCents = getPrizeValueCents(giveaway);
  const isEnded = giveaway.status === 'ENDED' || timeRemaining.expired;
  const myEntries = giveaway.myEntries ?? 0;
  const totalParticipants = giveaway.totalParticipants ?? 0;
  const totalEntries = giveaway.totalEntries ?? giveaway.soldTickets;
  const myChance = giveaway.myChancePercent ?? (totalEntries > 0 ? (100 * myEntries) / totalEntries : 0);
  const description = localizedGiveawayBlurb(giveaway, layout);

  const handleParticipate = async (target: GiveawayWithEntries, entries: number) => {
    setSubmitting(true);
    try {
      await onParticipate(target, entries);
      setBurst((current) => ({ id: current.id + 1, count: entries }));
    } finally {
      setSubmitting(false);
    }
  };

  const remainingLabel = (
    <p className="inline-flex shrink-0 items-center gap-1 text-xs tabular-nums text-foreground/80" data-countdown>
      <ClockIcon className="h-3.5 w-3.5" aria-hidden />
      {featured ? <span className="hidden sm:inline">{card.timeRemaining}</span> : null}
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
    </p>
  );

  const nameBlock = parsed.hasStructuredName ? (
    <>
      {featured ? <p className="text-xs text-foreground/80">{parsed.weapon}</p> : null}
      <p
        className={cn('font-display font-semibold leading-tight', featured ? 'text-lg' : 'text-sm')}
        style={{ color: accent }}
      >
        {parsed.finish}
      </p>
      {parsed.exterior ? (
        <p className={cn('mt-0.5 text-foreground/80', featured ? 'text-xs' : 'text-xs')}>{parsed.exterior}</p>
      ) : null}
    </>
  ) : (
    <p className={cn('font-display font-semibold leading-tight', featured ? 'text-lg' : 'text-sm')}>
      {parsed.fallbackName}
    </p>
  );

  const valueBlock =
    valueCents != null ? (
      <p
        className={cn(
          'mt-1 font-display font-semibold tabular-nums text-foreground',
          featured ? 'text-[28px] leading-none' : 'text-base'
        )}
      >
        <GiveawayEurAmount cents={valueCents} locale={locale} />
      </p>
    ) : null;

  const header = (
    <div className="flex items-start justify-between gap-2 overflow-visible">
      <div className="flex min-w-0 flex-wrap items-center gap-1.5 overflow-visible">
        <GiveawayTierBadge tier={tier}>{getGiveawayTierLabel(tier, labels)}</GiveawayTierBadge>
        <GiveawayPartnerBadge giveaway={giveaway} messages={messages} />
      </div>
      {remainingLabel}
    </div>
  );

  const body = (
    <>
      {header}

      <GiveawayPrizeVisual
        giveaway={giveaway}
        size="card"
        showDetails={false}
        grayscale={isEnded}
        floating={featured}
        prestige={tier === 'yearly'}
        tier={tier}
      />
      <div className="text-center">
        {nameBlock}
        {valueBlock}
      </div>

      {featured ? (
        <GiveawayCountdown
          endDate={endDate}
          now={now ?? liveNow}
          compact
          className="mt-2 justify-center"
          labels={{
            days: layout.countdownDays,
            hours: layout.countdownHours,
            minutes: layout.countdownMinutes,
            seconds: layout.countdownSeconds,
          }}
        />
      ) : null}

      {description ? (
        <p className="mt-2 line-clamp-2 text-center text-xs leading-snug text-foreground/75">{description}</p>
      ) : null}

      <div className="mt-2">
        <GiveawayStatBoxes
          participants={totalParticipants}
          totalEntries={totalEntries}
          myEntries={myEntries}
          chance={myChance}
          locale={locale}
          compact={!featured}
          featured={featured}
          labels={{
            participants: fg.participants,
            totalEntries: fg.totalEntries,
            yourEntries: fg.yourEntries,
            yourChance: fg.yourChance,
          }}
        />
      </div>

      <div className="mt-2 flex items-center justify-center gap-2 text-xs text-foreground/80">
        <FragmentAmount amount={giveaway.ticketPrice} size="xs" />
        <span>{fg.costPerEntry}</span>
      </div>

      <div className="mt-auto flex justify-center pt-5">
        {isEnded ? (
          <span className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground/70">
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
            tier={featured ? tier : undefined}
            burstId={featured ? burst.id : 0}
            burstCount={burst.count}
            onParticipate={featured ? () => setModalOpen(true) : undefined}
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
          className="giveaway-card-surface giveaway-showcase-card giveaway-showcase-card--featured flex h-full w-full flex-col overflow-visible rounded-2xl border border-white/10 bg-card/85 p-5 backdrop-blur-md"
          style={giveawayTierSurfaceStyle(accent, tokens)}
          data-giveaway={giveaway.id}
          role="article"
        >
          {body}
        </GiveawayMotionSurface>
      ) : (
        <GiveawayMotionSurface
          tilt
          role="button"
          tabIndex={0}
          data-giveaway={giveaway.id}
          className="giveaway-card-surface giveaway-showcase-card flex h-full w-full cursor-pointer flex-col overflow-visible rounded-2xl border border-white/10 bg-card/85 p-5 text-left backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={giveawayTierSurfaceStyle(accent, tokens)}
          onClick={onActivate}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onActivate?.();
            }
          }}
          aria-label={layout.selectGiveaway}
        >
          {body}
        </GiveawayMotionSurface>
      )}

      {featured ? (
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
