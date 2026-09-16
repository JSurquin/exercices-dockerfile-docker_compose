'use client';

import { useState } from 'react';
import { GiveawayCompactTime, useLiveNow } from '@/components/giveaway/giveaway-countdown';
import { GiveawayCtaButton } from '@/components/giveaway/giveaway-cta-button';
import { GiveawayEurAmount } from '@/components/giveaway/giveaway-eur-amount';
import { GiveawayMotionSurface, giveawayTierSurfaceStyle } from '@/components/giveaway/giveaway-motion-surface';
import { GiveawayParticipateDialog } from '@/components/giveaway/giveaway-participate-dialog';
import { GiveawayPartnerBadge } from '@/components/giveaway/giveaway-partner-badge';
import { GiveawayPrizeVisual } from '@/components/giveaway/giveaway-prize-visual';
import { GiveawayStatBoxes } from '@/components/giveaway/giveaway-stat-boxes';
import { GiveawayTierBadge } from '@/components/giveaway/giveaway-tier-badge';
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
import { ClockIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Messages } from '~/utils/types';

export function GiveawayCard({
  giveaway,
  messages,
  locale,
  now,
  selected = false,
  userFragments = 0,
  onSelect,
  onParticipate,
}: {
  giveaway: GiveawayWithEntries;
  messages: Messages;
  locale: string;
  now?: number;
  selected?: boolean;
  userFragments?: number;
  onSelect?: () => void;
  onParticipate?: (giveaway: GiveawayWithEntries, entries: number) => void | Promise<void>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [burst, setBurst] = useState({ id: 0, count: 1 });
  const liveNow = useLiveNow(1000, now === undefined);
  const endDate = typeof giveaway.endDate === 'string' ? new Date(giveaway.endDate) : giveaway.endDate;
  const timeRemaining = getTimeRemaining(endDate, now ?? liveNow);
  const layout = messages.giveaways.layout;
  const card = messages.giveaways.card;
  const fg = messages.giveaways.fragments;
  const isEnded = giveaway.status === 'ENDED' || timeRemaining.expired;
  const tier = getGiveawayTier(giveaway);
  const accent = getGiveawayTierAccent(tier);
  const tokens = getGiveawayTierTokens(tier);
  const description = localizedGiveawayBlurb(giveaway, layout);
  const selectable = Boolean(onSelect) && !isEnded;
  const labels = giveawayTierLabels(layout);
  const action = getGiveawayCardAction(giveaway, userFragments);
  const parsed = parsePrizeDisplay(giveaway.prize, giveaway.steamMarketHashName);
  const valueCents = getPrizeValueCents(giveaway);
  const myEntries = giveaway.myEntries ?? 0;
  const totalParticipants = giveaway.totalParticipants ?? 0;
  const totalEntries = giveaway.totalEntries ?? giveaway.soldTickets;
  const myChance = giveaway.myChancePercent ?? (totalEntries > 0 ? (100 * myEntries) / totalEntries : 0);

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

  return (
    <>
      <GiveawayMotionSurface
        data-giveaway={giveaway.id}
        className={cn(
          'giveaway-card-surface giveaway-card-surface--interactive flex h-full flex-col overflow-visible rounded-2xl border border-white/10 bg-card/80 p-5 backdrop-blur-md',
          selectable && 'cursor-pointer',
          selected && 'ring-2 ring-theme-accent/70'
        )}
        style={giveawayTierSurfaceStyle(accent, tokens)}
        onClick={selectable ? onSelect : undefined}
      >
        <div className="flex items-start justify-between gap-2 overflow-visible">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 overflow-visible">
            <GiveawayTierBadge tier={tier}>{getGiveawayTierLabel(tier, labels)}</GiveawayTierBadge>
            <GiveawayPartnerBadge giveaway={giveaway} messages={messages} />
            {description ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={card.infoAria}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <InformationCircleIcon className="h-4 w-4" aria-hidden />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-left">{description}</TooltipContent>
              </Tooltip>
            ) : null}
          </div>
          <p className="inline-flex shrink-0 items-center gap-1 text-xs tabular-nums text-foreground/80" data-countdown>
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

        <GiveawayPrizeVisual
          giveaway={giveaway}
          showDetails={false}
          grayscale={isEnded}
          prestige={tier === 'yearly'}
          tier={tier}
        />

        <div className="mt-2 text-center">
          {parsed.hasStructuredName ? (
            <>
              <p className="font-display font-semibold" style={{ color: accent }}>
                {parsed.finish}
              </p>
              {parsed.exterior ? <p className="mt-0.5 text-xs text-foreground/80">{parsed.exterior}</p> : null}
            </>
          ) : (
            <p className="font-display font-semibold">{parsed.fallbackName}</p>
          )}
          {valueCents != null ? (
            <p className="mt-1 font-display text-base font-semibold tabular-nums text-foreground">
              <GiveawayEurAmount cents={valueCents} locale={locale} />
            </p>
          ) : null}
        </div>

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
            labels={{
              participants: fg.participants,
              totalEntries: fg.totalEntries,
              yourEntries: fg.yourEntries,
              yourChance: fg.yourChance,
            }}
          />
        </div>

        <div
          className="mt-auto flex justify-end pt-5"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
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
              tier={tier}
              burstId={burst.id}
              burstCount={burst.count}
              onParticipate={() => setModalOpen(true)}
            />
          )}
        </div>
      </GiveawayMotionSurface>

      {onParticipate && (
        <GiveawayParticipateDialog
          open={modalOpen}
          onOpenChange={setModalOpen}
          giveaway={giveaway}
          messages={messages}
          userFragments={userFragments}
          onParticipate={handleParticipate}
        />
      )}
    </>
  );
}
