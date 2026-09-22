'use client';

import type { CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowPathIcon, GiftIcon } from '@heroicons/react/24/outline';
import { FragmentAmount } from '@/components/ui/level-badge';
import { formatClaimRewardLabel, MISSION_KIND_ACCENT, type MissionRow } from '@/lib/mission-presentation';
import type { Messages } from '~/utils/types';

export function MissionWelcomeBanner({
  mission,
  onClaim,
  claimingKey,
  t,
}: {
  mission: MissionRow;
  onClaim: (key: string, origin?: HTMLElement | null) => void;
  claimingKey: string | null;
  t: Messages['missions'];
}) {
  const isClaiming = claimingKey === mission.key;
  const item = t.items.WELCOME_BONUS;

  return (
    <div
      className="mission-welcome lunar-card px-4 py-4 sm:px-6 sm:py-5"
      style={{ '--mission-accent': MISSION_KIND_ACCENT.daily } as CSSProperties}
    >
      <div className="relative z-[1] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-theme-accent/30 bg-theme-accent/15">
            <GiftIcon className="h-6 w-6 text-theme-accent" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
              {item.label}
            </h2>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end">
          <FragmentAmount
            amount={mission.rewardFragments}
            prefix="+"
            size="sm"
            className="text-2xl font-bold text-theme-accent"
          />
          <Button
            size="lg"
            className="mission-quest__claim min-w-[9.5rem]"
            disabled={isClaiming}
            onClick={(event) => onClaim(mission.key, event.currentTarget)}
          >
            {isClaiming ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <GiftIcon className="h-4 w-4" />}
            {formatClaimRewardLabel(t.claimReward, mission.rewardFragments)}
          </Button>
        </div>
      </div>
    </div>
  );
}
