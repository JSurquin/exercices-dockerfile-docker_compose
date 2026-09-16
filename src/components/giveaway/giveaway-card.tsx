'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FragmentAmount } from '@/components/ui/level-badge';
import { GiveawayCompactTime, useLiveNow } from '@/components/giveaway/giveaway-countdown';
import { GiveawayEntryControl } from '@/components/giveaway/giveaway-entry-control';
import { GiveawayPrizeVisual } from '@/components/giveaway/giveaway-prize-visual';
import type { GiveawayWithEntries } from '@/hooks/use-giveaways';
import {
  getGiveawayTier,
  getGiveawayTierAccent,
  getTimeRemaining,
} from '@/lib/giveaway-presentation';
import { cn } from '@/lib/utils';
import {
  ClockIcon,
  LockClosedIcon,
  StarIcon,
  TicketIcon,
  TrophyIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import type { Messages } from '~/utils/types';

function tierLabel(tier: ReturnType<typeof getGiveawayTier>, messages: Messages): string {
  const layout = messages.giveaways.layout;
  if (tier === 'daily') return layout.tierDaily;
  if (tier === 'weekly') return layout.tierWeekly;
  if (tier === 'monthly') return layout.tierMonthly;
  return layout.tierSpecial;
}

export function GiveawayCard({
  giveaway,
  onParticipate,
  messages,
  userFragments,
  now,
}: {
  giveaway: GiveawayWithEntries;
  onParticipate: (giveaway: GiveawayWithEntries, entries: number) => void;
  messages: Messages;
  userFragments: number;
  now?: number;
}) {
  const liveNow = useLiveNow();
  const endDate = typeof giveaway.endDate === 'string' ? new Date(giveaway.endDate) : giveaway.endDate;
  const timeRemaining = getTimeRemaining(endDate, now ?? liveNow);
  const layout = messages.giveaways.layout;
  const fg = messages.giveaways.fragments;
  const myEntries = giveaway.myEntries ?? 0;
  const totalParticipants = giveaway.totalParticipants ?? 0;
  const totalEntries = giveaway.totalEntries ?? giveaway.soldTickets;
  const myChance = giveaway.myChancePercent ?? (totalEntries > 0 ? (100 * myEntries) / totalEntries : 0);
  const isParticipationLocked =
    giveaway.isPrivate && !!giveaway.requiredAffiliateCode && giveaway.canParticipate === false;
  const tier = getGiveawayTier(giveaway);
  const accent = getGiveawayTierAccent(tier);

  return (
    <Card
      data-giveaway={giveaway.id}
      className={cn(
        'flex h-full flex-col overflow-hidden border-white/10 bg-card/80 py-0 backdrop-blur-md transition-all duration-300',
        isParticipationLocked ? 'opacity-60 grayscale-[0.35] hover:shadow-none' : 'hover:shadow-lg'
      )}
      style={{
        boxShadow: `0 0 0 1px ${accent}33, 0 0 28px ${accent}14`,
      }}
    >
      <CardContent className="flex h-full flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <Badge
            className="mission-glass-badge font-normal"
            style={{ color: accent, borderColor: `${accent}55` }}
          >
            {tierLabel(tier, messages)}
          </Badge>
          <div className="flex flex-col items-end gap-1">
            {giveaway.status === 'ACTIVE' ? (
              <Badge className="mission-glass-badge gap-1.5 font-normal">
                <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-green-500/70" />
                {messages.giveaways.card.status.active}
              </Badge>
            ) : (
              <Badge variant="secondary">
                {giveaway.status === 'ENDED'
                  ? messages.giveaways.card.status.ended
                  : messages.giveaways.card.status.cancelled}
              </Badge>
            )}
            {giveaway.isPrivate && (
              <Badge className="flex items-center gap-1 border border-purple-500/40 bg-purple-500/20 text-xs text-purple-300">
                <LockClosedIcon className="h-3 w-3 shrink-0" aria-hidden />
                {messages.giveaways.card.privateLabel}
              </Badge>
            )}
          </div>
        </div>

        <GiveawayPrizeVisual giveaway={giveaway} />

        <h3 className="line-clamp-2 min-h-[2.5rem] font-display text-base font-semibold leading-snug">
          {giveaway.title}
        </h3>

        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2">
            <FragmentAmount amount={giveaway.ticketPrice} size="xs" />
            <span className="text-muted-foreground">{fg.costPerEntry}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <UserGroupIcon className="h-4 w-4 shrink-0" />
            <span>
              {totalParticipants} {fg.participants} · {totalEntries} {fg.totalEntries}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <TicketIcon className="h-4 w-4 shrink-0" />
            <span>
              {fg.yourEntries}: {myEntries} · {fg.yourChance}: {myChance.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClockIcon className="h-4 w-4 shrink-0" />
            <span>
              <GiveawayCompactTime
                remaining={timeRemaining}
                expiredLabel={messages.giveaways.card.status.ended}
                labels={{
                  days: layout.countdownDays,
                  hours: layout.countdownHours,
                  minutes: layout.countdownMinutes,
                  seconds: layout.countdownSeconds,
                }}
              />
            </span>
          </div>
        </div>

        <div className="mt-auto space-y-3">
          {giveaway.status === 'ENDED' &&
            (giveaway.winnerId || (giveaway.winners && giveaway.winners.length > 0)) && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/20">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center space-x-2">
                    <StarIcon className="h-5 w-5 shrink-0 text-green-600" />
                    <span className="truncate text-sm font-medium text-green-800 dark:text-green-200">
                      {messages.giveaways.card.winner}{' '}
                      {giveaway.winners && giveaway.winners.length > 0
                        ? `${giveaway.winners.length} ${messages.giveaways.card.winnersCount}`
                        : giveaway.winnerId?.slice(-6)}
                    </span>
                  </div>
                  <Link href={`/giveaways/${giveaway.id}`}>
                    <Button variant="outline" size="sm" className="shrink-0 text-xs">
                      {messages.giveawaysPage.viewDetails}
                    </Button>
                  </Link>
                </div>
              </div>
            )}

          {isParticipationLocked && (
            <div className="space-y-1 rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 text-sm text-purple-200/90">
              <div className="flex items-start gap-2">
                <LockClosedIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <p>
                  {messages.giveaways.card.reservedForAffiliateCode.replace(
                    '{code}',
                    giveaway.requiredAffiliateCode ?? ''
                  )}
                </p>
              </div>
              <p className="pl-6 text-xs text-muted-foreground">
                {messages.giveaways.card.reservedForAffiliateCodeHint}
              </p>
            </div>
          )}

          {giveaway.status === 'ACTIVE' && !timeRemaining.expired && !isParticipationLocked && (
            <GiveawayEntryControl
              giveaway={giveaway}
              messages={messages}
              userFragments={userFragments}
              onParticipate={onParticipate}
              compact
            />
          )}

          {giveaway.status !== 'ACTIVE' && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrophyIcon className="h-4 w-4 shrink-0" />
              <span>
                {giveaway.winnerCount ?? 1} {fg.winnerCount}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
