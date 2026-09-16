'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { FragmentAmount, LevelBadge } from '@/components/ui/level-badge';
import { GiveawayHowItWorksDialog } from '@/components/giveaway/giveaway-how-it-works-dialog';
import { getDisplayInitials } from '@/lib/giveaway-presentation';
import { getLevelInfo } from '@/lib/level-system';
import { GiftIcon } from '@heroicons/react/24/outline';
import type { Messages } from '~/utils/types';

export function GiveawaysCompactHeader({
  messages,
  user,
  userFragments,
  fragmentsUntilNext,
}: {
  messages: Messages;
  user: {
    username: string;
    avatar: string;
    xp: number;
    level: number;
  };
  userFragments: number;
  fragmentsUntilNext?: number | null;
}) {
  const layout = messages.giveaways.layout;
  const levelInfo = getLevelInfo(user.xp);
  const xpPercent = Math.round(levelInfo.levelProgress * 100);
  const initials = getDisplayInitials(user.username) || 'MS';

  return (
    <div className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <GiftIcon className="h-6 w-6 shrink-0 text-theme-accent" />
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            {messages.giveaways.title}
          </h1>
        </div>
        <div className="mt-1 flex min-w-0 items-center gap-2 text-sm">
          <p className="max-w-xl truncate text-muted-foreground">
            {messages.giveaways.subtitle}
          </p>
          <span className="text-muted-foreground/50" aria-hidden>
            ·
          </span>
          <GiveawayHowItWorksDialog messages={messages} />
        </div>
      </div>

      <div
        data-tour="giveaways-fragments"
        className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md dark:border-white/10"
      >
        <Avatar className="h-11 w-11 shrink-0 ring-1 ring-white/15">
          <AvatarImage src={user.avatar} alt={user.username} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <LevelBadge
          tierIndex={levelInfo.tierIndex}
          size="sm"
          alt={`${messages.giveaways.userTickets.level} ${user.level}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <FragmentAmount
              amount={userFragments}
              size="sm"
              className="font-display text-2xl font-semibold leading-none"
            />
            <span className="text-xs text-muted-foreground">{layout.availableFragments}</span>
          </div>
          {fragmentsUntilNext != null && fragmentsUntilNext > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {messages.giveaways.card.fragmentsUntilNext.replace(
                '{count}',
                String(fragmentsUntilNext)
              )}
            </p>
          )}
          <Progress
            value={xpPercent}
            className="mt-2 h-1 bg-muted/60 [&>div]:bg-theme-accent"
          />
        </div>
      </div>
    </div>
  );
}
