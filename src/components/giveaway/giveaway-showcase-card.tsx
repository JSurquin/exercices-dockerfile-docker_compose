'use client';

import { useState } from 'react';
import { ConvertedAmount } from '@/components/ui/converted-amount';
import { GiveawayCompactTime, useLiveNow } from '@/components/giveaway/giveaway-countdown';
import { GiveawayCtaButton } from '@/components/giveaway/giveaway-cta-button';
import { GiveawayParticipateDialog } from '@/components/giveaway/giveaway-participate-dialog';
import { GiveawayPrizeVisual } from '@/components/giveaway/giveaway-prize-visual';
import { GiveawayTierBadge } from '@/components/giveaway/giveaway-tier-badge';
import type { GiveawayWithEntries } from '@/hooks/use-giveaways';
import {
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
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const liveNow = useLiveNow(1000, now === undefined);
  const layout = messages.giveaways.layout;
  const card = messages.giveaways.card;
  const endDate = typeof giveaway.endDate === 'string' ? new Date(giveaway.endDate) : giveaway.endDate;
  const timeRemaining = getTimeRemaining(endDate, now ?? liveNow);
  const tier = getGiveawayTier(giveaway);
  const accent = getGiveawayTierAccent(tier);
  const labels = giveawayTierLabels(layout);
  const action = getGiveawayCardAction(giveaway, userFragments);
  const parsed = parsePrizeDisplay(giveaway.prize, giveaway.steamMarketHashName);
  const valueCents = getPrizeValueCents(giveaway);
  const isEnded = giveaway.status === 'ENDED' || timeRemaining.expired;

  const handleParticipate = async (target: GiveawayWithEntries, entries: number) => {
    setSubmitting(true);
    try {
      await onParticipate(target, entries);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <article
        data-giveaway={giveaway.id}
        className={cn(
          'giveaway-card-surface giveaway-showcase-card flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-card/85 p-4 backdrop-blur-md',
          featured && 'giveaway-showcase-card--featured'
        )}
        style={{ '--giveaway-accent': accent } as CSSProperties}
      >
        <div className="flex items-start justify-between gap-2">
          <GiveawayTierBadge tier={tier}>{getGiveawayTierLabel(tier, labels)}</GiveawayTierBadge>
          <p
            className="inline-flex shrink-0 items-center gap-1 text-xs tabular-nums text-foreground/80"
            data-countdown
          >
            <ClockIcon className="h-3.5 w-3.5" aria-hidden />
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
        </div>

        <button
          type="button"
          className="mt-2 min-h-0 flex-1 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onActivate}
          aria-label={layout.selectGiveaway}
        >
          <GiveawayPrizeVisual
            giveaway={giveaway}
            size={featured ? 'hero' : 'card'}
            showDetails={false}
            grayscale={isEnded}
          />
          <div className="mt-2 text-center">
            {parsed.hasStructuredName ? (
              <>
                <p className={cn('font-display text-foreground/70', featured ? 'text-sm' : 'text-xs')}>
                  {parsed.weapon}
                </p>
                <p
                  className={cn('font-display font-semibold', featured ? 'text-xl sm:text-2xl' : 'text-base')}
                  style={{ color: accent }}
                >
                  {parsed.finish}
                </p>
                {parsed.exterior ? (
                  <p className={cn('mt-0.5 text-foreground/70', featured ? 'text-sm' : 'text-xs')}>
                    {parsed.exterior}
                  </p>
                ) : null}
              </>
            ) : (
              <p className={cn('font-display font-semibold', featured ? 'text-xl sm:text-2xl' : 'text-base')}>
                {parsed.fallbackName}
              </p>
            )}
            {valueCents != null ? (
              <p
                className={cn(
                  'mt-2 font-display font-semibold tabular-nums text-foreground',
                  featured ? 'text-3xl sm:text-4xl' : 'text-2xl'
                )}
              >
                <ConvertedAmount cents={valueCents} />
              </p>
            ) : null}
          </div>
        </button>

        <div className="mt-3 flex justify-end">
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

      <GiveawayParticipateDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        giveaway={giveaway}
        messages={messages}
        userFragments={userFragments}
        onParticipate={handleParticipate}
      />
    </>
  );
}
