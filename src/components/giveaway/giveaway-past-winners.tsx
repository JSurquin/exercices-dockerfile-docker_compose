'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { GiveawayPartnerBadge } from '@/components/giveaway/giveaway-partner-badge';
import { GiveawayTierBadge } from '@/components/giveaway/giveaway-tier-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GiveawayEurAmount } from '@/components/giveaway/giveaway-eur-amount';
import { GiveawayUserAvatar } from '@/components/giveaway/giveaway-user-avatar';
import { SafeImage } from '@/components/ui/safe-image';
import {
  collectPastWinnerGroups,
  formatGiveawayDate,
  formatWinnerCount,
  getGiveawayTierLabel,
  getPrizeValueCents,
  giveawayTierLabels,
  parsePrizeDisplay,
  type GiveawayTierFilter,
  type PastWinnerGroup,
} from '@/lib/giveaway-presentation';
import type { GiveawayWithEntries } from '@/hooks/use-giveaways';
import { ChevronDownIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { Messages } from '~/utils/types';

const PAGE_SIZE = 10;
const PAST_FILTERS: GiveawayTierFilter[] = ['all', 'daily', 'weekly', 'monthly', 'yearly', 'special'];

function filterLabel(filter: GiveawayTierFilter, messages: Messages): string {
  const layout = messages.giveaways.layout;
  if (filter === 'all') return layout.filterAll;
  if (filter === 'daily') return layout.tierDaily;
  if (filter === 'weekly') return layout.tierWeekly;
  if (filter === 'monthly') return layout.tierMonthly;
  if (filter === 'yearly') return layout.tierYearly;
  return layout.tierSpecial;
}

function prizeLabel(group: PastWinnerGroup): string {
  const parsed = parsePrizeDisplay(group.prize, group.steamMarketHashName);
  return parsed.hasStructuredName ? `${parsed.weapon} ${parsed.finish}` : parsed.fallbackName;
}

export function GiveawayPastWinners({
  giveaways,
  messages,
  locale,
}: {
  giveaways: GiveawayWithEntries[];
  messages: Messages;
  locale: string;
}) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [filter, setFilter] = useState<GiveawayTierFilter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const pw = messages.giveaways.pastWinners;
  const card = messages.giveaways.card;
  const labels = giveawayTierLabels(messages.giveaways.layout);
  const groups = useMemo(() => collectPastWinnerGroups(giveaways), [giveaways]);
  const filtered = useMemo(
    () => (filter === 'all' ? groups : groups.filter((group) => group.tier === filter)),
    [filter, groups]
  );
  const shown = filtered.slice(0, visible);

  return (
    <section id="past-winners" className="scroll-mt-24">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">{pw.title}</h2>
        <Select
          value={filter}
          onValueChange={(value) => {
            setFilter(value as GiveawayTierFilter);
            setVisible(PAGE_SIZE);
          }}
        >
          <SelectTrigger size="sm" aria-label={pw.filterAria}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAST_FILTERS.map((item) => (
              <SelectItem key={item} value={item}>
                {filterLabel(item, messages)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">{pw.empty}</p>
      ) : (
        <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-card/70">
          <div className="hidden w-full grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)_minmax(5.5rem,auto)_minmax(6.5rem,auto)_minmax(6.5rem,auto)] gap-3 px-4 py-2 text-[11px] uppercase tracking-wide text-foreground/55 sm:grid">
            <span>{pw.player}</span>
            <span>{pw.prizeCol}</span>
            <span>{pw.tier}</span>
            <span className="text-right">{pw.value}</span>
            <span className="text-right">{pw.date}</span>
          </div>
          <ul className="divide-y divide-white/10">
            {shown.map((group) => {
              const valueCents = getPrizeValueCents(group);
              const isGroup = group.winners.length > 1;
              const isOpen = expanded === group.key;
              const primary = group.winners[0];
              return (
                <li key={group.key}>
                  <div
                    className={cn(
                      'grid min-h-14 w-full grid-cols-1 items-center gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)_minmax(5.5rem,auto)_minmax(6.5rem,auto)_minmax(6.5rem,auto)]',
                      isGroup && 'cursor-pointer'
                    )}
                    onClick={
                      isGroup
                        ? () => setExpanded((current) => (current === group.key ? null : group.key))
                        : undefined
                    }
                    onKeyDown={
                      isGroup
                        ? (event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              setExpanded((current) => (current === group.key ? null : group.key));
                            }
                          }
                        : undefined
                    }
                    role={isGroup ? 'button' : undefined}
                    tabIndex={isGroup ? 0 : undefined}
                    aria-expanded={isGroup ? isOpen : undefined}
                    aria-label={isGroup ? pw.expandWinners : undefined}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {isGroup ? (
                        <>
                          <div className="flex -space-x-2">
                            {group.winners.slice(0, 3).map((winner, index) => (
                              <GiveawayUserAvatar
                                key={`${group.key}-${index}`}
                                name={winner.username}
                                avatar={winner.avatar}
                                className="ring-2 ring-card"
                                fallbackName={messages.giveaways.notifications.anonymousPlayer}
                              />
                            ))}
                          </div>
                          <span className="truncate text-sm font-medium">
                            {formatWinnerCount(
                              group.winners.length,
                              card.winnerOne,
                              card.winnerOther
                            )}
                          </span>
                          <ChevronDownIcon
                            className={cn('h-4 w-4 shrink-0 text-foreground/55', isOpen && 'rotate-180')}
                            aria-hidden
                          />
                        </>
                      ) : (
                        <>
                          <GiveawayUserAvatar
                            name={primary?.username}
                            avatar={primary?.avatar}
                            fallbackName={messages.giveaways.notifications.anonymousPlayer}
                          />
                          <span className="truncate text-sm font-medium">
                            {primary?.username ?? messages.giveaways.notifications.anonymousPlayer}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex min-w-0 items-center gap-2">
                      <SafeImage
                        src={group.prizeImageUrl}
                        alt={group.prize}
                        width={40}
                        height={30}
                        className="h-8 w-10 object-contain"
                        fallbackClassName="h-8 w-10 rounded"
                        fallbackIcon={<TrophyIcon className="h-4 w-4 text-theme-accent" />}
                        unoptimized
                      />
                      <span className="truncate text-sm">{prizeLabel(group)}</span>
                      <GiveawayPartnerBadge
                        giveaway={{
                          isPrivate: group.isPrivate,
                          requiredAffiliateCode: group.requiredAffiliateCode,
                        }}
                        messages={messages}
                        className="max-w-[9rem]"
                      />
                    </div>
                    <GiveawayTierBadge tier={group.tier} className="w-fit">
                      {getGiveawayTierLabel(group.tier, labels)}
                    </GiveawayTierBadge>
                    <span className="text-right text-sm tabular-nums">
                      {valueCents != null ? <GiveawayEurAmount cents={valueCents} locale={locale} /> : '—'}
                    </span>
                    <span className="text-right text-sm text-foreground/70">
                      {formatGiveawayDate(group.endDate, locale)}
                    </span>
                  </div>
                  {isGroup && isOpen && (
                    <ul className="space-y-2 px-4 pb-3">
                      {group.winners.map((winner, index) => (
                        <li key={`${group.key}-open-${index}`} className="flex items-center gap-2 pl-1">
                          <GiveawayUserAvatar
                            name={winner.username}
                            avatar={winner.avatar}
                            fallbackName={messages.giveaways.notifications.anonymousPlayer}
                          />
                          <span className="truncate text-sm">
                            {winner.username ?? messages.giveaways.notifications.anonymousPlayer}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {visible < filtered.length && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setVisible((count) => count + PAGE_SIZE)}>
            {pw.seeMore}
          </Button>
        </div>
      )}
    </section>
  );
}
