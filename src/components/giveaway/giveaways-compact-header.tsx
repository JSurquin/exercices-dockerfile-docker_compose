'use client';

import { GiveawayAnimatedProgress } from '@/components/giveaway/giveaway-animated-progress';
import { GiveawayFragmentCount } from '@/components/giveaway/giveaway-count-up';
import { GiveawayHowItWorksDialog } from '@/components/giveaway/giveaway-how-it-works-dialog';
import { GiveawayUserAvatar } from '@/components/giveaway/giveaway-user-avatar';
import { fragmentsEntryProgressPercent } from '@/lib/giveaway-presentation';
import { GiftIcon } from '@heroicons/react/24/outline';
import type { Messages } from '~/utils/types';

export function GiveawaysCompactHeader({ messages }: { messages: Messages }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2.5">
        <GiftIcon className="h-6 w-6 shrink-0 text-theme-accent" />
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
          {messages.nav.giveaways}
        </h1>
      </div>
      <p className="mt-1 max-w-2xl text-sm leading-snug text-foreground/70 line-clamp-2">
        {messages.giveaways.subtitle}{' '}
        <GiveawayHowItWorksDialog messages={messages} />
      </p>
    </div>
  );
}

export function GiveawayLevelCard({
  messages,
  user,
  userFragments,
  fragmentsUntilNext,
  nextTicketPrice,
  nextTierLabel,
}: {
  messages: Messages;
  user: {
    username: string;
    avatar: string;
    level: number;
  };
  userFragments: number;
  fragmentsUntilNext?: number | null;
  nextTicketPrice?: number | null;
  nextTierLabel?: string | null;
}) {
  const layout = messages.giveaways.layout;
  const progress = fragmentsEntryProgressPercent(userFragments, nextTicketPrice ?? null);
  const levelLabel = layout.levelBadge.replace('{level}', String(user.level));
  const untilNext =
    fragmentsUntilNext != null && fragmentsUntilNext > 0
      ? messages.giveaways.card.fragmentsUntilNext
          .replace('{count}', String(fragmentsUntilNext))
          .replace('{tier}', nextTierLabel ?? '')
      : null;

  return (
    <section
      data-tour="giveaways-fragments"
      className="giveaway-sidebar-widget giveaway-page-level"
    >
      <div className="flex min-w-0 items-center gap-3">
        <GiveawayUserAvatar
          name={user.username}
          avatar={user.avatar}
          fallbackName={user.username || 'MS'}
          className="h-11 w-11 shrink-0 ring-1 ring-white/15"
        />
        <span className="shrink-0 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold text-foreground">
          {levelLabel}
        </span>
      </div>
      <div className="mt-3 min-w-0">
        <div className="flex items-baseline gap-2">
          <GiveawayFragmentCount
            amount={userFragments}
            size="sm"
            className="font-display text-2xl font-semibold leading-none"
          />
          <span className="text-xs text-foreground/70">{layout.availableFragments}</span>
        </div>
        {untilNext ? <p className="mt-1 text-xs text-foreground/70">{untilNext}</p> : null}
        {nextTicketPrice != null && nextTicketPrice > 0 ? (
          <GiveawayAnimatedProgress value={progress} className="mt-2 h-1 bg-muted/60 [&>div]:bg-theme-accent" />
        ) : null}
      </div>
    </section>
  );
}
