'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FragmentAmount } from '@/components/ui/level-badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { GiveawayCompactTime, useLiveNow } from '@/components/giveaway/giveaway-countdown';
import { GiveawayEntryControl } from '@/components/giveaway/giveaway-entry-control';
import {
  GiveawayPrizeDetails,
  GiveawayPrizeVisual,
} from '@/components/giveaway/giveaway-prize-visual';
import { GiveawayUserAvatar } from '@/components/giveaway/giveaway-user-avatar';
import type { GiveawayWithEntries } from '@/hooks/use-giveaways';
import {
  formatWinnerCount,
  getGiveawayTier,
  getGiveawayTierAccent,
  getTimeRemaining,
} from '@/lib/giveaway-presentation';
import { cn } from '@/lib/utils';
import {
  LockClosedIcon,
  TrophyIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import type { CSSProperties } from 'react';
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
  onParticipate: (giveaway: GiveawayWithEntries, entries: number) => void | Promise<void>;
  messages: Messages;
  userFragments: number;
  now?: number;
}) {
  const liveNow = useLiveNow(1000, now === undefined);
  const endDate = typeof giveaway.endDate === 'string' ? new Date(giveaway.endDate) : giveaway.endDate;
  const timeRemaining = getTimeRemaining(endDate, now ?? liveNow);
  const layout = messages.giveaways.layout;
  const card = messages.giveaways.card;
  const fg = messages.giveaways.fragments;
  const myEntries = giveaway.myEntries ?? 0;
  const totalParticipants = giveaway.totalParticipants ?? 0;
  const totalEntries = giveaway.totalEntries ?? giveaway.soldTickets;
  const myChance = giveaway.myChancePercent ?? (totalEntries > 0 ? (100 * myEntries) / totalEntries : 0);
  const isParticipationLocked =
    giveaway.isPrivate && !!giveaway.requiredAffiliateCode && giveaway.canParticipate === false;
  const isEnded = giveaway.status === 'ENDED' || timeRemaining.expired;
  const tier = getGiveawayTier(giveaway);
  const accent = getGiveawayTierAccent(tier);
  const winnerCount = giveaway.winnerCount ?? giveaway.winners?.length ?? 1;
  const primaryWinner = giveaway.winners?.[0]?.user;
  const description = giveaway.description?.trim() ?? '';

  return (
    <Card
      data-giveaway={giveaway.id}
      className={cn(
        'giveaway-card-surface flex h-full flex-col overflow-hidden border-white/10 bg-card/80 py-0 backdrop-blur-md',
        isParticipationLocked
          ? 'opacity-60 grayscale-[0.35]'
          : 'giveaway-card-surface--interactive'
      )}
      style={{ '--giveaway-accent': accent } as CSSProperties}
    >
      <CardContent className="flex h-full flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <Badge
              className="mission-glass-badge font-normal"
              style={{ color: accent, borderColor: `${accent}55` }}
            >
              {tierLabel(tier, messages)}
            </Badge>
            {giveaway.isPrivate && (
              <Badge className="flex items-center gap-1 border border-purple-500/40 bg-purple-500/20 text-xs text-purple-300">
                <LockClosedIcon className="h-3 w-3 shrink-0" aria-hidden />
                {card.privateLabel}
              </Badge>
            )}
          </div>
          {isEnded ? (
            <Badge variant="secondary">{card.status.ended}</Badge>
          ) : (
            <Badge className="mission-glass-badge gap-1.5 font-normal" data-countdown>
              <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-green-500/70 motion-reduce:animate-none" />
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
            </Badge>
          )}
        </div>

        {giveaway.isPrivate && giveaway.requiredAffiliateCode && (
          <p className="text-xs text-purple-200/80">
            {card.communityName.replace('{name}', giveaway.requiredAffiliateCode)}
          </p>
        )}

        <GiveawayPrizeVisual
          giveaway={giveaway}
          showDetails={false}
          grayscale={isEnded}
        />
        <GiveawayPrizeDetails giveaway={giveaway} />

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground/70">
          <span className="inline-flex items-center gap-1">
            <FragmentAmount amount={giveaway.ticketPrice} size="xs" />
          </span>
          <span className="inline-flex items-center gap-1">
            <UserGroupIcon className="h-3.5 w-3.5 shrink-0" />
            {totalParticipants} {fg.participants}
          </span>
          <span className="inline-flex items-center gap-1">
            <TrophyIcon className="h-3.5 w-3.5 shrink-0" />
            {formatWinnerCount(winnerCount, card.winnerOne, card.winnerOther)}
          </span>
        </div>

        {myEntries > 0 && (
          <p className="text-xs text-foreground/70">
            {card.yourEntriesLine
              .replace('{entries}', String(myEntries))
              .replace('{chance}', myChance.toFixed(1))}
          </p>
        )}

        {description && (
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="line-clamp-2 cursor-help text-xs text-foreground/70">{description}</p>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-left">{description}</TooltipContent>
          </Tooltip>
        )}

        <div className="mt-auto space-y-3 pt-1">
          {isParticipationLocked && (
            <div className="space-y-1 rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 text-sm text-purple-200/90">
              <div className="flex items-start gap-2">
                <LockClosedIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <p>
                  {card.reservedForAffiliateCode.replace(
                    '{code}',
                    giveaway.requiredAffiliateCode ?? ''
                  )}
                </p>
              </div>
            </div>
          )}

          {isEnded ? (
            (giveaway.winners && giveaway.winners.length > 0) || giveaway.winnerId ? (
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <GiveawayUserAvatar
                  name={primaryWinner?.steamUsername}
                  avatar={primaryWinner?.steamAvatar}
                  fallbackName={messages.giveaways.notifications.anonymousPlayer}
                />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-foreground/70">{card.winner}</p>
                  <p className="truncate text-sm font-medium">
                    {primaryWinner?.steamUsername ?? messages.giveaways.notifications.anonymousPlayer}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-foreground/70">{card.status.ended}</p>
            )
          ) : (
            giveaway.status === 'ACTIVE' &&
            !timeRemaining.expired &&
            !isParticipationLocked && (
              <GiveawayEntryControl
                giveaway={giveaway}
                messages={messages}
                userFragments={userFragments}
                onParticipate={onParticipate}
                compact
              />
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
