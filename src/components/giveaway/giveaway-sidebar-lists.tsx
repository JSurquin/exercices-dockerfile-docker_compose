'use client';

import { GiveawayCompactTime, useLiveNow } from '@/components/giveaway/giveaway-countdown';
import { GiveawayUserAvatar } from '@/components/giveaway/giveaway-user-avatar';
import { SafeImage } from '@/components/ui/safe-image';
import type { GiveawayWithEntries } from '@/hooks/use-giveaways';
import {
  formatChancePercent,
  getTimeRemaining,
  parsePrizeDisplay,
  viewerIsWinner,
} from '@/lib/giveaway-presentation';
import { TrophyIcon } from '@heroicons/react/24/outline';
import type { Messages } from '~/utils/types';

function shortPrizeName(giveaway: GiveawayWithEntries): string {
  const parsed = parsePrizeDisplay(giveaway.prize, giveaway.steamMarketHashName);
  return parsed.hasStructuredName ? parsed.finish : parsed.fallbackName;
}

export function GiveawayMyParticipations({
  giveaways,
  messages,
  locale,
  now,
  onSelect,
}: {
  giveaways: GiveawayWithEntries[];
  messages: Messages;
  locale: string;
  now?: number;
  onSelect?: (giveaway: GiveawayWithEntries) => void;
}) {
  const liveNow = useLiveNow(1000, now === undefined);
  const clock = now ?? liveNow;
  const layout = messages.giveaways.layout;
  const rows = giveaways.filter(
    (giveaway) => giveaway.status === 'ACTIVE' && (giveaway.myEntries ?? 0) > 0
  );

  return (
    <section className="giveaway-mine-panel mt-4 rounded-2xl border border-white/10 bg-card/70 p-4 backdrop-blur-md">
      <h2 className="mb-3 font-display text-lg font-semibold">{messages.giveaways.myEntries.title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-foreground/70">{messages.giveaways.myEntries.empty}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((giveaway) => {
            const myEntries = giveaway.myEntries ?? 0;
            const totalEntries = giveaway.totalEntries ?? giveaway.soldTickets;
            const chance =
              giveaway.myChancePercent ?? (totalEntries > 0 ? (100 * myEntries) / totalEntries : 0);
            const remaining = getTimeRemaining(giveaway.endDate, clock);
            return (
              <li key={giveaway.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-2.5 py-2 text-left hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => onSelect?.(giveaway)}
                >
                  <SafeImage
                    src={giveaway.prizeImageUrl}
                    alt={giveaway.prize}
                    width={40}
                    height={30}
                    className="h-8 w-10 object-contain"
                    fallbackClassName="h-8 w-10 rounded"
                    fallbackIcon={<TrophyIcon className="h-4 w-4 text-theme-accent" />}
                    unoptimized
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{shortPrizeName(giveaway)}</p>
                    <p className="truncate text-[11px] text-foreground/70">
                      {myEntries} · {formatChancePercent(chance, locale)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums text-foreground/70">
                    <GiveawayCompactTime
                      remaining={remaining}
                      expiredLabel={messages.giveaways.card.status.ended}
                      labels={{
                        days: layout.compactDays,
                        hours: layout.compactHours,
                        minutes: layout.compactMinutes,
                        seconds: layout.compactSeconds,
                      }}
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function GiveawayMyWinnings({
  giveaways,
  messages,
  username,
}: {
  giveaways: GiveawayWithEntries[];
  messages: Messages;
  username: string;
}) {
  const rows = giveaways.filter(
    (giveaway) => giveaway.status === 'ENDED' && viewerIsWinner(giveaway, username)
  );

  return (
    <section className="giveaway-wins-panel mt-4 rounded-2xl border border-white/10 bg-card/70 p-4 backdrop-blur-md">
      <h2 className="mb-3 font-display text-lg font-semibold">{messages.giveaways.myWinnings.title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-foreground/70">{messages.giveaways.myWinnings.empty}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((giveaway) => (
            <li
              key={giveaway.id}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-2.5 py-2"
            >
              <SafeImage
                src={giveaway.prizeImageUrl}
                alt={giveaway.prize}
                width={40}
                height={30}
                className="h-8 w-10 object-contain"
                fallbackClassName="h-8 w-10 rounded"
                fallbackIcon={<TrophyIcon className="h-4 w-4 text-theme-accent" />}
                unoptimized
              />
              <p className="min-w-0 flex-1 truncate text-sm font-medium">{shortPrizeName(giveaway)}</p>
              <GiveawayUserAvatar
                name={username}
                avatar={null}
                fallbackName={messages.giveaways.notifications.anonymousPlayer}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
