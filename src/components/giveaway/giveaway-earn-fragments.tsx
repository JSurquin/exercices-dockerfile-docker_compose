'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { SparklesIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import type { Messages } from '~/utils/types';

type ListedMission = {
  key: string;
  completed: boolean;
  eligible: boolean;
};

export function GiveawayEarnFragments({ messages }: { messages: Messages }) {
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

  return (
    <section
      id="earn-fragments"
      className="giveaway-earn-panel scroll-mt-24 scroll-mb-24 rounded-2xl border border-white/10 bg-card/70 p-4 backdrop-blur-md"
    >
      <h2 className="mb-3 font-display text-lg font-semibold">{earn.title}</h2>
      <ul className="giveaway-earn-list">
        <li className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-theme-accent/15 text-theme-accent">
            <SparklesIcon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{earn.missionsLabel}</p>
            <p className="text-xs text-foreground/70">{earn.missionsReward}</p>
            {availableCount != null ? (
              <p className="text-xs text-foreground/70">{earn.missionsAvailable.replace('{count}', String(availableCount))}</p>
            ) : null}
          </div>
          <Button asChild size="sm" variant="chrome">
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
