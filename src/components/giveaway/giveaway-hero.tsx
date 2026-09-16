'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FragmentAmount } from '@/components/ui/level-badge';
import { GiveawayCountdown, useLiveNow } from '@/components/giveaway/giveaway-countdown';
import { GiveawayEntryControl } from '@/components/giveaway/giveaway-entry-control';
import { GiveawayLeaderboard } from '@/components/giveaway/giveaway-leaderboard';
import { GiveawayPrizeVisual } from '@/components/giveaway/giveaway-prize-visual';
import type { GiveawayWithEntries } from '@/hooks/use-giveaways';
import {
  formatChancePercent,
  formatGiveawayDate,
  getGiveawayKicker,
  getGiveawayTier,
  getGiveawayTierAccent,
  getGiveawayTierLabel,
  getTimeRemaining,
  giveawayTierLabels,
  type GiveawayLeaderboardRow,
} from '@/lib/giveaway-presentation';
import { cn } from '@/lib/utils';
import { TicketIcon, UserGroupIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import type { CSSProperties } from 'react';
import type { Messages } from '~/utils/types';

export function GiveawayHero({
  giveaway,
  messages,
  locale,
  userFragments,
  onParticipate,
  currentUser,
  now,
}: {
  giveaway: GiveawayWithEntries;
  messages: Messages;
  locale: string;
  userFragments: number;
  onParticipate: (giveaway: GiveawayWithEntries, entries: number) => void | Promise<void>;
  currentUser: { username: string; avatar: string } | null;
  now?: number;
}) {
  const layout = messages.giveaways.layout;
  const fg = messages.giveaways.fragments;
  const liveNow = useLiveNow(1000, now === undefined);
  const clock = now ?? liveNow;
  const myEntries = giveaway.myEntries ?? 0;
  const totalParticipants = giveaway.totalParticipants ?? 0;
  const totalEntries = giveaway.totalEntries ?? giveaway.soldTickets;
  const myChance = giveaway.myChancePercent ?? (totalEntries > 0 ? (100 * myEntries) / totalEntries : 0);
  const isParticipationLocked = giveaway.isPrivate && giveaway.canParticipate === false;
  const timeRemaining = getTimeRemaining(giveaway.endDate, clock);
  const isActive = giveaway.status === 'ACTIVE' && !timeRemaining.expired;
  const tier = getGiveawayTier(giveaway);
  const accent = getGiveawayTierAccent(tier);
  const labels = giveawayTierLabels(layout);

  const leaderboard: GiveawayLeaderboardRow[] =
    giveaway.leaderboard && giveaway.leaderboard.length > 0
      ? giveaway.leaderboard
      : myEntries > 0 && currentUser
        ? [{ username: currentUser.username, avatar: currentUser.avatar, entries: myEntries, isYou: true }]
        : [];

  return (
    <Card
      data-giveaway={giveaway.id}
      className="giveaway-card-surface mb-6 overflow-hidden border-white/10 bg-card/80 py-0 backdrop-blur-md lg:mb-8 lg:max-h-[560px]"
      style={{ '--giveaway-accent': accent } as CSSProperties}
    >
      <CardContent className="p-4 sm:p-5 lg:max-h-[560px] lg:overflow-y-auto">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge className="mission-glass-badge font-normal text-foreground">{layout.featured}</Badge>
          <Badge
            className="mission-glass-badge font-normal text-foreground"
            style={{ borderColor: `${accent}88` }}
          >
            {getGiveawayTierLabel(tier, labels)}
          </Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 md:items-start lg:gap-5">
          <GiveawayPrizeVisual giveaway={giveaway} size="hero" />

          <div className="flex min-h-0 flex-col gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold sm:text-xl">
                {getGiveawayKicker(tier, layout)}
              </h2>
              <p className="mt-0.5 text-xs text-foreground/70">
                {layout.endsOnDate.replace('{date}', formatGiveawayDate(giveaway.endDate, locale))}
              </p>
            </div>
            <GiveawayCountdown
              endDate={giveaway.endDate}
              now={clock}
              labels={{
                days: layout.countdownDays,
                hours: layout.countdownHours,
                minutes: layout.countdownMinutes,
                seconds: layout.countdownSeconds,
              }}
            />

            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <Stat label={fg.participants} value={String(totalParticipants)} icon={UserGroupIcon} />
              <Stat label={fg.totalEntries} value={String(totalEntries)} icon={TicketIcon} />
              <Stat label={fg.yourEntries} value={String(myEntries)} />
              <Stat label={fg.yourChance} value={formatChancePercent(myChance, locale)} />
            </div>

            <div className="flex items-center gap-2 text-sm text-foreground/70">
              <FragmentAmount amount={giveaway.ticketPrice} size="xs" />
              <span>{fg.costPerEntry}</span>
            </div>

            {isParticipationLocked && (
              <div className="space-y-1 rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 text-sm text-foreground">
                <div className="flex items-start gap-2">
                  <LockClosedIcon className="mt-0.5 h-4 w-4 shrink-0 text-purple-300" aria-hidden />
                  <p>
                    {messages.giveaways.card.reservedForAffiliateCode.replace(
                      '{code}',
                      giveaway.requiredAffiliateCode ?? ''
                    )}
                  </p>
                </div>
              </div>
            )}

            {isActive && !isParticipationLocked && (
              <GiveawayEntryControl
                giveaway={giveaway}
                messages={messages}
                userFragments={userFragments}
                onParticipate={onParticipate}
                compact
              />
            )}

            <GiveawayLeaderboard rows={leaderboard} messages={messages} compact />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof UserGroupIcon;
}) {
  return (
    <div className={cn('rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5')}>
      <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-foreground/70">
        {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden /> : null}
        {label}
      </p>
      <p className="font-display text-base font-semibold tabular-nums text-foreground sm:text-lg">{value}</p>
    </div>
  );
}
