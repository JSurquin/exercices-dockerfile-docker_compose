'use client';

import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { SparklesIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import type { Messages } from '~/utils/types';
import { useLiveNow } from '@/components/giveaway/giveaway-countdown';
import { formatCompactCountdown, getTimeRemaining, nextUtcMidnightMs } from '@/lib/giveaway-presentation';

type DailyMission = {
  key: string;
  rewardFragments: number;
  completed: boolean;
  eligible: boolean;
};

export function GiveawayEarnFragments({
  messages,
  onClaimed,
}: {
  messages: Messages;
  onClaimed?: (earned: number) => void;
}) {
  const earn = messages.giveaways.earn;
  const layout = messages.giveaways.layout;
  const queryClient = useQueryClient();
  const now = useLiveNow(1000);
  const nextClaimRemaining = getTimeRemaining(new Date(nextUtcMidnightMs(now)), now);
  const { data: daily } = useQuery({
    queryKey: ['giveaways', 'earn-daily-claim'],
    queryFn: async (): Promise<DailyMission | null> => {
      const response = await fetch('/api/missions', { credentials: 'include' });
      if (!response.ok) return null;
      const json = (await response.json()) as { missions?: DailyMission[] };
      return json.missions?.find((mission) => mission.key === 'DAILY_CLAIM') ?? null;
    },
  });

  const claimDaily = async () => {
    const response = await fetch('/api/missions/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ missionKey: 'DAILY_CLAIM' }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(typeof json.error === 'string' ? json.error : messages.missions.genericError);
      return;
    }
    toast.success(
      messages.missions.toastEarnedTitle.replace(
        '{amount}',
        String(json.fragments ?? daily?.rewardFragments ?? 0)
      )
    );
    await queryClient.invalidateQueries({ queryKey: ['giveaways', 'earn-daily-claim'] });
    onClaimed?.(Number(json.fragments) || daily?.rewardFragments || 0);
  };

  const claimedCountdown = formatCompactCountdown(
    nextClaimRemaining,
    {
      days: layout.compactDays,
      hours: layout.compactHours,
      minutes: layout.compactMinutes,
      seconds: layout.compactSeconds,
    },
    earn.dailyClaimed
  );

  return (
    <section
      id="earn-fragments"
      className="giveaway-earn-panel scroll-mt-24 scroll-mb-24 rounded-2xl border border-white/10 bg-card/70 p-4 backdrop-blur-md"
    >
      <h2 className="mb-3 font-display text-lg font-semibold">{earn.title}</h2>
      <ul className="giveaway-earn-list">
        <li className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-theme-accent/15 text-theme-accent">
            <ShoppingBagIcon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{earn.sellLabel}</p>
            <p className="text-xs text-foreground/70">{earn.sellReward}</p>
          </div>
          <Button asChild size="sm" variant="chrome">
            <Link href="/">{earn.sellCta}</Link>
          </Button>
        </li>
        {daily && (
          <li className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-theme-accent/15 text-theme-accent">
              <SparklesIcon className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{earn.dailyLabel}</p>
              <p className="text-xs text-foreground/70">
                {earn.dailyReward.replace('{count}', String(daily.rewardFragments))}
              </p>
            </div>
            {daily.completed ? (
              <div className="shrink-0 text-right">
                <Button size="sm" variant="secondary" disabled>
                  {earn.dailyClaimed}
                </Button>
                <p className="mt-1 text-[11px] tabular-nums text-foreground/70">
                  {earn.nextClaimIn.replace('{time}', claimedCountdown)}
                </p>
              </div>
            ) : (
              <Button
                size="sm"
                variant="chrome"
                disabled={!daily.eligible}
                onClick={() => void claimDaily()}
              >
                {earn.dailyCta}
              </Button>
            )}
          </li>
        )}
      </ul>
    </section>
  );
}
