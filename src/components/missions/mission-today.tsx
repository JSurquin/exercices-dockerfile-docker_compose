'use client';

import type { ComponentType, CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import { ClockIcon, SparklesIcon, StarIcon } from '@heroicons/react/24/outline';
import { FragmentAmount } from '@/components/ui/level-badge';
import {
  MISSION_CATEGORY_ACCENT,
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
  isPending,
  returnsLabel,
  t,
}: {
  mission: MissionRow;
  onClaim: (key: string) => void;
  isPending: boolean;
  returnsLabel: string;
  t: Messages['missions'];
}) {
  const Icon = TODAY_ICONS[mission.key as TodayMissionKey] ?? SparklesIcon;
  const itemMeta = t.items[mission.key as keyof typeof t.items];
  const accent = MISSION_CATEGORY_ACCENT[mission.category];

  return (
    <div
      data-type={mission.category.toLowerCase()}
      data-completed={mission.completed ? 'true' : 'false'}
      className="mission-today-tile"
      style={{ '--mission-accent': accent } as CSSProperties}
    >
      <div className="mission-quest__icon shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-semibold leading-tight">
          {itemMeta?.label ?? mission.key.replace(/_/g, ' ')}
        </p>
        <FragmentAmount
          amount={mission.rewardFragments}
          prefix="+"
          size="xs"
          className="mt-0.5 text-sm font-bold text-theme-accent"
        />
      </div>
      {mission.completed ? (
        <p className="max-w-[9.5rem] text-right text-xs font-medium leading-snug text-muted-foreground">
          {returnsLabel}
        </p>
      ) : (
        <Button
          size="sm"
          variant="cta"
          disabled={isPending || !mission.eligible}
          onClick={() => onClaim(mission.key)}
          className="shrink-0"
        >
          {t.claim}
        </Button>
      )}
    </div>
  );
}
