'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FragmentAmount } from '@/components/ui/level-badge';
import { GiveawayCountdown, useLiveNow } from '@/components/giveaway/giveaway-countdown';
import { GiveawayEntryControl } from '@/components/giveaway/giveaway-entry-control';
import { GiveawayPrizeVisual } from '@/components/giveaway/giveaway-prize-visual';
import type { GiveawayWithEntries } from '@/hooks/use-giveaways';
import { getGiveawayTier, getGiveawayTierAccent, getTimeRemaining } from '@/lib/giveaway-presentation';
import { cn } from '@/lib/utils';
import { TicketIcon, UserGroupIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import type { Messages } from '~/utils/types';

function tierLabel(tier: ReturnType<typeof getGiveawayTier>, messages: Messages): string {
  const layout = messages.giveaways.layout;
  if (tier === 'daily') return layout.tierDaily;
  if (tier === 'weekly') return layout.tierWeekly;
  if (tier === 'monthly') return layout.tierMonthly;
  return layout.tierSpecial;
}

export function GiveawayHero({
  giveaway,
  messages,
  userFragments,
  onParticipate,
  currentUser,
}: {
  giveaway: GiveawayWithEntries;
  messages: Messages;
  userFragments: number;
  onParticipate: (giveaway: GiveawayWithEntries, entries: number) => void | Promise<void>;
  currentUser: { username: string; avatar: string } | null;
}) {
  const layout = messages.giveaways.layout;
  const fg = messages.giveaways.fragments;
  const now = useLiveNow();
  const myEntries = giveaway.myEntries ?? 0;
  const totalParticipants = giveaway.totalParticipants ?? 0;
  const totalEntries = giveaway.totalEntries ?? giveaway.soldTickets;
  const myChance = giveaway.myChancePercent ?? (totalEntries > 0 ? (100 * myEntries) / totalEntries : 0);
  const isParticipationLocked =
    giveaway.isPrivate && !!giveaway.requiredAffiliateCode && giveaway.canParticipate === false;
  const timeRemaining = getTimeRemaining(giveaway.endDate, now);
  const isActive = giveaway.status === 'ACTIVE' && !timeRemaining.expired;
  const tier = getGiveawayTier(giveaway);
  const accent = getGiveawayTierAccent(tier);

  const leaderboard =
    myEntries > 0 && currentUser
      ? [{ username: currentUser.username, avatar: currentUser.avatar, entries: myEntries, isYou: true }]
      : [];

  return (
    <Card
      data-giveaway={giveaway.id}
      className="mb-6 overflow-hidden border-white/10 bg-card/80 py-0 backdrop-blur-md lg:mb-8"
      style={{ boxShadow: `0 0 0 1px ${accent}40, 0 0 40px ${accent}18` }}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge className="mission-glass-badge font-normal">{layout.featured}</Badge>
          <Badge
            className="mission-glass-badge font-normal"
            style={{ color: accent, borderColor: `${accent}55` }}
          >
            {tierLabel(tier, messages)}
          </Badge>
        </div>
        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <GiveawayPrizeVisual giveaway={giveaway} size="hero" />

          <div className="flex flex-col gap-5">
            <h2 className="font-display text-xl font-semibold sm:text-2xl">{giveaway.title}</h2>
            <GiveawayCountdown
              endDate={giveaway.endDate}
              now={now}
              labels={{
                days: layout.countdownDays,
                hours: layout.countdownHours,
                minutes: layout.countdownMinutes,
                seconds: layout.countdownSeconds,
              }}
            />

            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Stat label={fg.participants} value={String(totalParticipants)} icon={UserGroupIcon} />
              <Stat label={fg.totalEntries} value={String(totalEntries)} icon={TicketIcon} />
              <Stat label={fg.yourEntries} value={String(myEntries)} />
              <Stat label={fg.yourChance} value={`${myChance.toFixed(2)}%`} />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FragmentAmount amount={giveaway.ticketPrice} size="xs" />
              <span>{fg.costPerEntry}</span>
            </div>

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
              </div>
            )}

            {isActive && !isParticipationLocked && (
              <GiveawayEntryControl
                giveaway={giveaway}
                messages={messages}
                userFragments={userFragments}
                onParticipate={onParticipate}
              />
            )}

            <div>
              <p className="mb-2 text-sm font-medium">{layout.leaderboardTitle}</p>
              {leaderboard.length === 0 ? (
                <p className="text-sm text-muted-foreground">{layout.leaderboardEmpty}</p>
              ) : (
                <ul className="space-y-2">
                  {leaderboard.map((row, index) => (
                    <li key={row.username} className="flex items-center gap-2 text-sm">
                      <span className="w-5 text-muted-foreground">{index + 1}</span>
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={row.avatar} alt={row.username} />
                        <AvatarFallback>
                          {(row.username.trim().slice(0, 2) || 'MS').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 flex-1 truncate">
                        {row.username}
                        {row.isYou ? ` (${layout.leaderboardYou})` : ''}
                      </span>
                      <span className="tabular-nums text-muted-foreground">{row.entries}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
    <div className={cn('rounded-lg border border-white/10 bg-white/5 px-3 py-2')}>
      <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </p>
      <p className="font-display text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
