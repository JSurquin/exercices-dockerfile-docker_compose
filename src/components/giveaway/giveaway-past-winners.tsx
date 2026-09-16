'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { GiveawayUserAvatar } from '@/components/giveaway/giveaway-user-avatar';
import { SafeImage } from '@/components/ui/safe-image';
import {
  collectPastWinners,
  formatGiveawayDate,
  getGiveawayTierAccent,
  type GiveawayTier,
} from '@/lib/giveaway-presentation';
import type { GiveawayWithEntries } from '@/hooks/use-giveaways';
import { TrophyIcon } from '@heroicons/react/24/outline';
import type { Messages } from '~/utils/types';

const PAGE_SIZE = 6;

function tierLabel(tier: GiveawayTier, messages: Messages): string {
  const layout = messages.giveaways.layout;
  if (tier === 'daily') return layout.tierDaily;
  if (tier === 'weekly') return layout.tierWeekly;
  if (tier === 'monthly') return layout.tierMonthly;
  return layout.tierSpecial;
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
  const rows = useMemo(() => collectPastWinners(giveaways), [giveaways]);
  const shown = rows.slice(0, visible);

  return (
    <section className="mt-12">
      <h2 className="mb-4 font-display text-lg font-semibold">{messages.giveaways.pastWinners.title}</h2>
      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">{messages.giveaways.pastWinners.empty}</p>
      ) : (
        <ul className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-card/70">
          {shown.map((row) => (
            <li key={row.key} className="flex items-center gap-3 px-4 py-3">
              <GiveawayUserAvatar
                name={row.username}
                avatar={row.avatar}
                fallbackName={messages.giveaways.notifications.anonymousPlayer}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {row.username ?? messages.giveaways.notifications.anonymousPlayer}
                </p>
                <p className="text-xs text-muted-foreground">{formatGiveawayDate(row.endDate, locale)}</p>
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <SafeImage
                  src={row.prizeImageUrl}
                  alt={row.prize}
                  width={48}
                  height={36}
                  className="h-9 w-12 object-contain"
                  fallbackClassName="h-9 w-12 rounded"
                  fallbackIcon={<TrophyIcon className="h-4 w-4 text-theme-accent" />}
                  unoptimized
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{row.prize}</p>
                  <p className="text-[11px]" style={{ color: getGiveawayTierAccent(row.tier) }}>
                    {tierLabel(row.tier, messages)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {visible < rows.length && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setVisible((count) => count + PAGE_SIZE)}>
            {messages.giveaways.pastWinners.seeMore}
          </Button>
        </div>
      )}
    </section>
  );
}
