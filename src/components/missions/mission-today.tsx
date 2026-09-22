'use client';

import type { ComponentType, CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowPathIcon, CheckCircleIcon, ClockIcon, SparklesIcon, StarIcon } from '@heroicons/react/24/outline';
import { FragmentAmount } from '@/components/ui/level-badge';
import {
  formatClaimRewardLabel,
  getMissionAccent,
  getMissionKind,
  type MissionRow,
  type TodayMissionKey,
} from '@/lib/mission-presentation';
import type { Messages } from '~/utils/types';

const TODAY_ICONS: Record<TodayMissionKey, ComponentType<{ className?: string }>> = {
  BONUS_DAILY_SURPRISE: StarIcon,
  DAILY_CLAIM: SparklesIcon,
  DAILY_VISIT: ClockIcon,
};

export function MissionTodayTile({
  mission,
  onClaim,
  claimingKey,
  returnsLabel,
  t,
}: {
  mission: MissionRow;
  onClaim: (key: string, origin?: HTMLElement | null) => void;
  claimingKey: string | null;
  returnsLabel: string;
  t: Messages['missions'];
}) {
  const Icon = TODAY_ICONS[mission.key as TodayMissionKey] ?? SparklesIcon;
  const itemMeta = t.items[mission.key as keyof typeof t.items];
  const kind = getMissionKind(mission.key);
  const accent = getMissionAccent(mission.key, mission.category);
  const isClaiming = claimingKey === mission.key;

  return (
    <div
      data-type={kind}
      data-kind={kind}
      data-completed={mission.completed ? 'true' : 'false'}
      className="mission-today-tile"
      style={{ '--mission-accent': accent } as CSSProperties}
    >
      <div className="mission-quest__icon shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mission-quest__title truncate">
          {itemMeta?.label ?? mission.key.replace(/_/g, ' ')}
        </p>
        <FragmentAmount
          amount={mission.rewardFragments}
          prefix="+"
          size="xs"
          className="mission-quest__reward mt-0.5"
        />
      </div>
      {mission.completed ? (
        <p className="mission-quest__meta max-w-[9.5rem] text-right font-medium leading-snug">
          <span className="inline-flex items-center gap-1">
            <CheckCircleIcon className="h-4 w-4 text-theme-success" />
            {returnsLabel}
          </span>
        </p>
      ) : (
        <Button
          size="sm"
          className="mission-quest__claim shrink-0"
          disabled={isClaiming}
          onClick={(event) => onClaim(mission.key, event.currentTarget)}
        >
          {isClaiming ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : null}
          {formatClaimRewardLabel(t.claimReward, mission.rewardFragments)}
        </Button>
      )}
    </div>
  );
}
