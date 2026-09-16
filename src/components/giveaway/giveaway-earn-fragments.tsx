'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { SparklesIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { Messages } from '~/utils/types';

type ListedMission = {
  key: string;
  completed: boolean;
  eligible: boolean;
};

export const EARN_FRAGMENTS_ELEMENT_ID = 'earn-fragments';

export function scrollToEarnFragments() {
  const el = document.getElementById(EARN_FRAGMENTS_ELEMENT_ID);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.remove('giveaway-earn-panel--flash');
  void el.offsetWidth;
  el.classList.add('giveaway-earn-panel--flash');
  window.setTimeout(() => {
    el.classList.remove('giveaway-earn-panel--flash');
  }, 600);
}

export function GiveawayEarnFragments({
  messages,
  boostGlow = false,
}: {
  messages: Messages;
  boostGlow?: boolean;
}) {
  const earn = messages.giveaways.earn;
  const { data: missions } = useQuery({
    queryKey: ['giveaways', 'earn-missions'],
    queryFn: async (): Promise<ListedMission[] | null> => {
      const response = await fetch('/api/missions', { credentials: 'include' });
      if (!response.ok) return null;
      const json = (await response.json()) as { missions?: ListedMission[] };
      return json.missions ?? [];
    },
  });
  const availableCount =
    missions == null ? null : missions.filter((mission) => mission.eligible && !mission.completed).length;
  const dailyClaimReady =
    missions?.some((mission) => mission.key === 'DAILY_CLAIM' && mission.eligible && !mission.completed) ?? false;

  return (
    <section
      id={EARN_FRAGMENTS_ELEMENT_ID}
      className={cn(
        'giveaway-sidebar-widget giveaway-page-widget giveaway-earn-panel scroll-mt-24 scroll-mb-24',
        boostGlow && 'giveaway-earn-panel--boost'
      )}
    >
      {availableCount != null && availableCount > 0 ? (
        <span className="giveaway-earn-badge" aria-label={earn.missionsAvailable.replace('{count}', String(availableCount))}>
          <span className="giveaway-earn-badge__ping" aria-hidden />
          <span className="relative z-[1]">{availableCount}</span>
        </span>
      ) : null}
      <h2 className="mb-3 font-display text-lg font-semibold">{earn.title}</h2>
      <ul className="giveaway-earn-list">
        <li className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-theme-accent/15 text-theme-accent">
            <SparklesIcon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{earn.missionsLabel}</p>
            {dailyClaimReady ? (
              <p className="giveaway-earn-daily text-xs font-semibold">{earn.dailyAvailable}</p>
            ) : (
              <p className="text-xs text-foreground/70">{earn.missionsReward}</p>
            )}
            {availableCount != null && !dailyClaimReady ? (
              <p className="text-xs text-foreground/70">{earn.missionsAvailable.replace('{count}', String(availableCount))}</p>
            ) : null}
          </div>
          <Button asChild size="sm" variant={dailyClaimReady ? 'cta' : 'chrome'}>
            <Link href="/missions">{earn.missionsCta}</Link>
          </Button>
        </li>
        <li className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-theme-accent/15 text-theme-accent">
            <ShoppingBagIcon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{earn.sellLabel}</p>
            <p className="text-xs text-foreground/70">{earn.sellReward}</p>
          </div>
          <Button asChild size="sm" variant="chrome">
            <Link href="/sell">{earn.sellCta}</Link>
          </Button>
        </li>
      </ul>
    </section>
  );
}
