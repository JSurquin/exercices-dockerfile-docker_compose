'use client';

import { Progress } from '@/components/ui/progress';
import { FragmentAmount } from '@/components/ui/level-badge';
import { GiveawayHowItWorksDialog } from '@/components/giveaway/giveaway-how-it-works-dialog';
import { GiveawayUserAvatar } from '@/components/giveaway/giveaway-user-avatar';
import { fragmentsEntryProgressPercent } from '@/lib/giveaway-presentation';
import { GiftIcon } from '@heroicons/react/24/outline';
import type { Messages } from '~/utils/types';

export function GiveawaysCompactHeader({
  messages,
  user,
  userFragments,
  fragmentsUntilNext,
  cheapestTicketPrice,
}: {
  messages: Messages;
  user: {
    username: string;
    avatar: string;
    level: number;
  };
  userFragments: number;
  fragmentsUntilNext?: number | null;
  cheapestTicketPrice?: number | null;
}) {
  const layout = messages.giveaways.layout;
  const progress = fragmentsEntryProgressPercent(userFragments, cheapestTicketPrice ?? null);
  const levelLabel = layout.levelBadge.replace('{level}', String(user.level));

  return (
    <div className="mb-4 flex flex-col gap-4 lg:mb-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <GiftIcon className="h-6 w-6 shrink-0 text-theme-accent" />
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            {messages.giveaways.title}
          </h1>
        </div>
        <div className="mt-1 flex min-w-0 items-center gap-2 text-sm">
          <p className="max-w-xl truncate text-foreground/70">
            {messages.giveaways.subtitle}
          </p>
          <span className="text-foreground/40" aria-hidden>
            ·
          </span>
          <GiveawayHowItWorksDialog messages={messages} />
        </div>
      </div>

      <div
        data-tour="giveaways-fragments"
        className="hidden min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md md:flex dark:border-white/10"
      >
        <GiveawayUserAvatar
          name={user.username}
          avatar={user.avatar}
          fallbackName={user.username || 'MS'}
          className="h-11 w-11 shrink-0 ring-1 ring-white/15"
        />
        <span className="shrink-0 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold text-foreground">
          {levelLabel}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <FragmentAmount
              amount={userFragments}
              size="sm"
              className="font-display text-2xl font-semibold leading-none"
            />
            <span className="text-xs text-foreground/70">{layout.availableFragments}</span>
          </div>
          {fragmentsUntilNext != null && fragmentsUntilNext > 0 && (
            <p className="mt-1 text-xs text-foreground/70">
              {messages.giveaways.card.fragmentsUntilNext.replace(
                '{count}',
                String(fragmentsUntilNext)
              )}
            </p>
          )}
          {cheapestTicketPrice != null && cheapestTicketPrice > 0 && (
            <Progress
              value={progress}
              className="mt-2 h-1 bg-muted/60 [&>div]:bg-theme-accent"
            />
          )}
        </div>
      </div>
    </div>
  );
}
