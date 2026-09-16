'use client';

import { Button } from '@/components/ui/button';
import { GiveawayFragmentCount } from '@/components/giveaway/giveaway-count-up';
import { GiveawayUserAvatar } from '@/components/giveaway/giveaway-user-avatar';
import { SparklesIcon } from '@heroicons/react/24/outline';
import type { Messages } from '~/utils/types';

export function GiveawayWalletBar({
  messages,
  userFragments,
  user,
}: {
  messages: Messages;
  userFragments: number;
  user: {
    username: string;
    avatar: string;
  };
}) {
  const layout = messages.giveaways.layout;
  const earn = messages.giveaways.earn;

  return (
    <div
      data-giveaway-wallet
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-background/95 px-4 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.28)] backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      role="region"
      aria-label={layout.walletBarLabel}
    >
      <div className="mx-auto flex max-w-[90rem] items-center gap-3">
        <GiveawayUserAvatar
          name={user.username}
          avatar={user.avatar}
          fallbackName={user.username || 'MS'}
          className="h-10 w-10 shrink-0 ring-1 ring-white/15"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <GiveawayFragmentCount
              amount={userFragments}
              size="sm"
              className="font-display text-xl font-semibold leading-none"
            />
            <span className="text-xs text-foreground/70">{layout.availableFragments}</span>
          </div>
        </div>
        <Button asChild size="sm" variant="chrome" className="shrink-0">
          <a href="#earn-fragments">
            <SparklesIcon className="h-4 w-4" aria-hidden />
            {earn.shortCta}
          </a>
        </Button>
      </div>
    </div>
  );
}
