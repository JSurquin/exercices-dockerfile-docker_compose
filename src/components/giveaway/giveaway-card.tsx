'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FragmentAmount } from '@/components/ui/level-badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { GiveawayCompactTime, useLiveNow } from '@/components/giveaway/giveaway-countdown';
import { GiveawayParticipateDialog } from '@/components/giveaway/giveaway-participate-dialog';
import {
  GiveawayPrizeDetails,
  GiveawayPrizeVisual,
} from '@/components/giveaway/giveaway-prize-visual';
import type { GiveawayWithEntries } from '@/hooks/use-giveaways';
import {
  formatChancePercent,
  formatCommunityName,
  formatWinnerCount,
  getGiveawayCardAction,
  getGiveawayTier,
  getGiveawayTierAccent,
  getGiveawayTierLabel,
  getTimeRemaining,
  giveawayTierLabels,
} from '@/lib/giveaway-presentation';
import { cn } from '@/lib/utils';
import {
  ArrowPathIcon,
  ClockIcon,
  InformationCircleIcon,
  LockClosedIcon,
  TrophyIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import type { CSSProperties } from 'react';
import type { Messages } from '~/utils/types';

function scrollToEarnFragments() {
  document.getElementById('earn-fragments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

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
  const liveNow = useLiveNow(1000, now === undefined);
  const endDate = typeof giveaway.endDate === 'string' ? new Date(giveaway.endDate) : giveaway.endDate;
  const timeRemaining = getTimeRemaining(endDate, now ?? liveNow);
  const layout = messages.giveaways.layout;
  const card = messages.giveaways.card;
  const myEntries = giveaway.myEntries ?? 0;
  const totalParticipants = giveaway.totalParticipants ?? 0;
  const totalEntries = giveaway.totalEntries ?? giveaway.soldTickets;
  const myChance = giveaway.myChancePercent ?? (totalEntries > 0 ? (100 * myEntries) / totalEntries : 0);
  const isEnded = giveaway.status === 'ENDED' || timeRemaining.expired;
  const tier = getGiveawayTier(giveaway);
  const accent = getGiveawayTierAccent(tier);
  const winnerCount = giveaway.winnerCount ?? giveaway.winners?.length ?? 1;
  const description = giveaway.description?.trim() ?? '';
  const selectable = Boolean(onSelect) && !isEnded;
  const labels = giveawayTierLabels(layout);
  const action = getGiveawayCardAction(giveaway, userFragments);
  const communityLabel =
    giveaway.isPrivate && giveaway.requiredAffiliateCode
      ? card.communityName.replace('{name}', formatCommunityName(giveaway.requiredAffiliateCode))
      : null;

  const handleParticipate = async (target: GiveawayWithEntries, entries: number) => {
    if (!onParticipate) return;
    setSubmitting(true);
    try {
      await onParticipate(target, entries);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card
        data-giveaway={giveaway.id}
        className={cn(
          'giveaway-card-surface giveaway-card-surface--interactive flex h-[380px] flex-col overflow-hidden border-white/10 bg-card/80 py-0 backdrop-blur-md',
          selectable && 'cursor-pointer',
          selected && 'ring-2 ring-theme-accent/70'
        )}
        style={{ '--giveaway-accent': accent } as CSSProperties}
        onClick={selectable ? onSelect : undefined}
      >
        <CardContent className="flex h-full flex-col gap-2.5 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <Badge
                className="mission-glass-badge shrink-0 font-normal text-foreground"
                style={{ borderColor: `${accent}88` }}
              >
                {getGiveawayTierLabel(tier, labels)}
              </Badge>
              {giveaway.isPrivate && (
                <Badge className="flex max-w-[9.5rem] items-center gap-1 truncate border border-purple-500/40 bg-purple-500/20 text-xs font-normal text-foreground">
                  <LockClosedIcon className="h-3 w-3 shrink-0" aria-hidden />
                  <span className="truncate">{communityLabel ?? card.privateLabel}</span>
                </Badge>
              )}
            </div>
            <Badge className="mission-glass-badge shrink-0 gap-1 font-normal text-foreground">
              <FragmentAmount amount={giveaway.ticketPrice} size="xs" />
            </Badge>
          </div>

          <GiveawayPrizeVisual giveaway={giveaway} showDetails={false} grayscale={isEnded} />
          <GiveawayPrizeDetails giveaway={giveaway} layout="inline" />

          <div className="flex min-w-0 items-center gap-1.5 text-xs text-foreground/70">
            <p className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden whitespace-nowrap">
              <span className="inline-flex min-w-0 items-center gap-1">
                <UserGroupIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate tabular-nums">{totalParticipants}</span>
              </span>
              <span aria-hidden>·</span>
              <span className="inline-flex min-w-0 items-center gap-1">
                <TrophyIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">
                  {formatWinnerCount(winnerCount, card.winnerOne, card.winnerOther)}
                </span>
              </span>
              <span aria-hidden>·</span>
              <span className="inline-flex min-w-0 items-center gap-1" data-countdown>
                <ClockIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate tabular-nums">
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
                </span>
              </span>
            </p>
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

          {myEntries > 0 && (
            <p className="truncate text-xs text-foreground/70">
              {card.yourEntriesLine
                .replace('{entries}', String(myEntries))
                .replace('{chance}', formatChancePercent(myChance, locale))}
            </p>
          )}

          <div className="mt-auto pt-1">
            {isEnded ? (
              <Button type="button" variant="secondary" className="w-full" disabled>
                {card.status.ended}
              </Button>
            ) : submitting ? (
              <Button type="button" variant="chrome" className="w-full" disabled aria-busy>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              </Button>
            ) : action.type === 'reserved' ? (
              <Button type="button" variant="secondary" className="w-full opacity-100" disabled>
                <LockClosedIcon className="h-4 w-4" aria-hidden />
                {card.accessReserved}
              </Button>
            ) : action.type === 'maxReached' ? (
              <Button type="button" variant="secondary" className="w-full" disabled>
                {card.maxEntriesReached}
              </Button>
            ) : action.type === 'unaffordable' ? (
              <Button
                type="button"
                variant="outline"
                className="w-full opacity-100"
                onClick={(event) => {
                  event.stopPropagation();
                  scrollToEarnFragments();
                }}
              >
                {card.missingFragmentsCta.split('{count}')[0]}
                <FragmentAmount amount={action.missing} size="xs" />
                {card.missingFragmentsCta.split('{count}')[1]}
              </Button>
            ) : (
              <Button
                type="button"
                variant="chrome"
                className="w-full"
                onClick={(event) => {
                  event.stopPropagation();
                  setModalOpen(true);
                }}
              >
                {card.participate}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

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
