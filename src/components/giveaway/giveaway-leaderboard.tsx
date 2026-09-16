'use client';

import { useState } from 'react';
import { GiveawayUserAvatar } from '@/components/giveaway/giveaway-user-avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  visibleLeaderboardRows,
  type GiveawayLeaderboardRow,
} from '@/lib/giveaway-presentation';
import { cn } from '@/lib/utils';
import type { Messages } from '~/utils/types';

function LeaderboardList({
  rows,
  youLabel,
  fallbackName,
  className,
}: {
  rows: GiveawayLeaderboardRow[];
  youLabel: string;
  fallbackName: string;
  className?: string;
}) {
  return (
    <ul className={cn('space-y-2', className)}>
      {rows.map((row, index) => {
        const name = (row.username ?? '').trim();
        const displayName = name || (row.isYou ? youLabel : fallbackName);
        return (
          <li key={`${displayName}-${index}`} className="flex items-center gap-2 text-sm">
            <span className="w-5 tabular-nums text-foreground/70">{index + 1}</span>
            <GiveawayUserAvatar name={displayName} avatar={row.avatar} fallbackName={fallbackName} />
            <span className="min-w-0 flex-1 truncate text-foreground">
              {displayName}
              {row.isYou && name ? ` (${youLabel})` : ''}
            </span>
            <span className="tabular-nums text-foreground/70">{row.entries}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function GiveawayLeaderboard({
  rows,
  messages,
  compact = false,
  participantCount,
}: {
  rows: GiveawayLeaderboardRow[];
  messages: Messages;
  compact?: boolean;
  participantCount?: number;
}) {
  const layout = messages.giveaways.layout;
  const [open, setOpen] = useState(false);
  const visibleLimit = Math.min(5, participantCount ?? rows.length);
  const preview = visibleLeaderboardRows(rows, 5, visibleLimit);
  const sortedAll = visibleLeaderboardRows(rows, rows.length, rows.length);
  const showSeeAll = rows.length > preview.length;

  if (rows.length === 0) {
    return (
      <div>
        <p className="mb-1 text-sm font-medium text-foreground">{layout.leaderboardTitle}</p>
        <p className="text-xs text-foreground/70">{layout.leaderboardEmpty}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{layout.leaderboardTitle}</p>
        {showSeeAll && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="text-xs font-medium text-theme-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {layout.leaderboardSeeAll}
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">{layout.leaderboardTitle}</DialogTitle>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto pr-1">
              <LeaderboardList rows={sortedAll} youLabel={layout.leaderboardYou} fallbackName={messages.giveaways.notifications.anonymousPlayer} />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <LeaderboardList
        rows={preview}
        youLabel={layout.leaderboardYou}
        fallbackName={messages.giveaways.notifications.anonymousPlayer}
        className={compact ? 'space-y-1.5' : undefined}
      />
    </div>
  );
}
