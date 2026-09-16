'use client';

import { useState } from 'react';
import { ConvertedAmount } from '@/components/ui/converted-amount';
import { FragmentAmount } from '@/components/ui/level-badge';
import { GiveawayCompactTime, GiveawayCountdown, useLiveNow } from '@/components/giveaway/giveaway-countdown';
import { GiveawayCtaButton } from '@/components/giveaway/giveaway-cta-button';
import { GiveawayParticipateDialog } from '@/components/giveaway/giveaway-participate-dialog';
import { GiveawayPartnerBadge } from '@/components/giveaway/giveaway-partner-badge';
import { GiveawayPrizeVisual } from '@/components/giveaway/giveaway-prize-visual';
import { GiveawayTierBadge } from '@/components/giveaway/giveaway-tier-badge';
import { useLocale } from '@/components/providers/locale-provider';
import type { GiveawayWithEntries } from '@/hooks/use-giveaways';
import {
  formatChancePercent,
  getGiveawayCardAction,
  getGiveawayTier,
  getGiveawayTierAccent,
  getGiveawayTierLabel,
  getPrizeValueCents,
  getTimeRemaining,
  giveawayTierLabels,
  parsePrizeDisplay,
} from '@/lib/giveaway-presentation';
import { cn } from '@/lib/utils';
import { ClockIcon } from '@heroicons/react/24/outline';
import type { CSSProperties } from 'react';
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
  const liveNow = useLiveNow(1000, now === undefined);
  const layout = messages.giveaways.layout;
  const card = messages.giveaways.card;
  const fg = messages.giveaways.fragments;
  const endDate = typeof giveaway.endDate === 'string' ? new Date(giveaway.endDate) : giveaway.endDate;
  const timeRemaining = getTimeRemaining(endDate, now ?? liveNow);
  const tier = getGiveawayTier(giveaway);
  const accent = getGiveawayTierAccent(tier);
  const labels = giveawayTierLabels(layout);
  const action = getGiveawayCardAction(giveaway, userFragments);
  const parsed = parsePrizeDisplay(giveaway.prize, giveaway.steamMarketHashName);
  const valueCents = getPrizeValueCents(giveaway);
  const isEnded = giveaway.status === 'ENDED' || timeRemaining.expired;
  const myEntries = giveaway.myEntries ?? 0;
  const totalParticipants = giveaway.totalParticipants ?? 0;
  const totalEntries = giveaway.totalEntries ?? giveaway.soldTickets;
  const myChance = giveaway.myChancePercent ?? (totalEntries > 0 ? (100 * myEntries) / totalEntries : 0);

  const handleParticipate = async (target: GiveawayWithEntries, entries: number) => {
    setSubmitting(true);
    try {
      await onParticipate(target, entries);
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
      {featured ? <p className="font-display text-sm text-foreground/70">{parsed.weapon}</p> : null}
      <p
        className={cn('font-display font-semibold', featured ? 'text-xl sm:text-2xl' : 'text-base')}
        style={{ color: accent }}
      >
        {parsed.finish}
      </p>
      {parsed.exterior ? (
        <p className={cn('mt-0.5 text-foreground/70', featured ? 'text-sm' : 'text-xs')}>{parsed.exterior}</p>
      ) : null}
    </>
  ) : (
    <p className={cn('font-display font-semibold', featured ? 'text-xl sm:text-2xl' : 'text-base')}>
      {parsed.fallbackName}
    </p>
  );

  const valueBlock =
    valueCents != null ? (
      <p
        className={cn(
          'mt-2 font-display font-semibold tabular-nums text-foreground',
          featured ? 'text-3xl sm:text-4xl' : 'text-2xl'
        )}
      >
        <ConvertedAmount cents={valueCents} split />
      </p>
    ) : null;

  return (
    <>
      {featured ? (
        <article
          data-giveaway={giveaway.id}
          className="giveaway-card-surface giveaway-showcase-card giveaway-showcase-card--featured flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-card/85 p-4 backdrop-blur-md"
          style={{ '--giveaway-accent': accent } as CSSProperties}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <GiveawayTierBadge tier={tier}>{getGiveawayTierLabel(tier, labels)}</GiveawayTierBadge>
              <GiveawayPartnerBadge giveaway={giveaway} messages={messages} />
            </div>
            {remainingLabel}
          </div>

          <GiveawayPrizeVisual giveaway={giveaway} size="hero" showDetails={false} grayscale={isEnded} />
          <div className="mt-1 text-center">
            {nameBlock}
            {valueBlock}
          </div>

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

          <p className="mt-3 truncate text-center text-xs text-foreground/70">
            <span className="tabular-nums">{totalParticipants}</span> {fg.participants}
            <span aria-hidden> · </span>
            <span className="tabular-nums">{totalEntries}</span> {fg.totalEntries}
            <span aria-hidden> · </span>
            {fg.yourEntries} <span className="tabular-nums">{myEntries}</span>
            <span aria-hidden> · </span>
            {fg.yourChance} {formatChancePercent(myChance, locale)}
          </p>

          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-foreground/70">
            <FragmentAmount amount={giveaway.ticketPrice} size="xs" />
            <span>{fg.costPerEntry}</span>
          </div>

          <div className="mt-auto flex justify-end pt-3">
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
                compact
                onParticipate={() => setModalOpen(true)}
              />
            )}
          </div>
        </article>
      ) : (
        <button
          type="button"
          data-giveaway={giveaway.id}
          className="giveaway-card-surface giveaway-showcase-card flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-card/85 p-4 text-left backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ '--giveaway-accent': accent } as CSSProperties}
          onClick={onActivate}
          aria-label={layout.selectGiveaway}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <GiveawayTierBadge tier={tier}>{getGiveawayTierLabel(tier, labels)}</GiveawayTierBadge>
              <GiveawayPartnerBadge giveaway={giveaway} messages={messages} />
            </div>
            {remainingLabel}
          </div>
          <GiveawayPrizeVisual giveaway={giveaway} size="card" showDetails={false} grayscale={isEnded} />
          <div className="mt-2 text-center">
            {nameBlock}
            {valueBlock}
          </div>
        </button>
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
