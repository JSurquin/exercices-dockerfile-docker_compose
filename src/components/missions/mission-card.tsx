'use client';

import type { ComponentType, CSSProperties } from 'react';
import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  GiftIcon,
  LockClosedIcon,
  SparklesIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { SOCIAL_MISSION_URLS } from '@/lib/moonskin-social';
import { getSocialMissionIcon } from '@/components/ui/social-brand-icons';
import { FragmentAmount } from '@/components/ui/level-badge';
import {
  formatClaimRewardLabel,
  formatMissionProgressLabel,
  getMissionAccent,
  getMissionActionHref,
  getMissionActionKind,
  getMissionBlockReason,
  getMissionKind,
  getMissionUiStatus,
  hasUsefulMissionDescription,
  hasVisitedSocialMission,
  isQuantitativeMission,
  markSocialMissionVisited,
  type MissionRow,
} from '@/lib/mission-presentation';
import type { Messages } from '~/utils/types';

const MISSION_ROW_STYLE: Record<string, { icon: ComponentType<{ className?: string }> }> = {
  WELCOME_BONUS: { icon: GiftIcon },
  DAILY_CLAIM: { icon: SparklesIcon },
  DAILY_SELL_SKIN: { icon: ChartBarIcon },
  DAILY_VISIT: { icon: ClockIcon },
  WEEKLY_SELL_500: { icon: ChartBarIcon },
  WEEKLY_SELL_1000: { icon: ChartBarIcon },
  WEEKLY_GIVEAWAY_3: { icon: GiftIcon },
  MONTHLY_SELL_5000: { icon: ChartBarIcon },
  MONTHLY_SELL_10000: { icon: ChartBarIcon },
  BONUS_DAILY_SURPRISE: { icon: StarIcon },
};

function missionIcon(key: string): ComponentType<{ className?: string }> {
  return getSocialMissionIcon(key) ?? MISSION_ROW_STYLE[key]?.icon ?? SparklesIcon;
}

function actionLabel(kind: ReturnType<typeof getMissionActionKind>, t: Messages['missions']): string {
  if (kind === 'sell') return t.actionSell;
  if (kind === 'giveaway') return t.actionParticipate;
  return t.actionVisit;
}

function MissionIcon({
  missionKey,
  completed,
}: {
  missionKey: string;
  completed: boolean;
}) {
  const IconComp = missionIcon(missionKey);
  return (
    <div className="mission-quest__icon">
      <IconComp className="h-5 w-5" />
      {completed ? (
        <span className="mission-quest__icon-badge" aria-hidden>
          <CheckCircleIcon className="h-3.5 w-3.5" />
        </span>
      ) : null}
    </div>
  );
}

function MissionActionButton({
  mission,
  t,
}: {
  mission: MissionRow;
  t: Messages['missions'];
}) {
  const kind = getMissionActionKind(mission.key);
  const href = getMissionActionHref(mission.key, SOCIAL_MISSION_URLS[mission.key]);
  const label = actionLabel(kind, t);
  if (!href) {
    return (
      <Button size="sm" variant="outline" className="mission-quest__btn w-full" disabled>
        {t.inProgress}
      </Button>
    );
  }
  const external = href.startsWith('http');
  if (external) {
    return (
      <Button size="sm" className="mission-quest__claim w-full" asChild>
        <a href={href} target="_blank" rel="noopener noreferrer">
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          {label}
        </a>
      </Button>
    );
  }
  return (
    <Button size="sm" className="mission-quest__claim w-full" asChild>
      <Link href={href}>{label}</Link>
    </Button>
  );
}

function SocialMissionActions({
  mission,
  onClaim,
  isClaiming,
  t,
}: {
  mission: MissionRow;
  onClaim: (key: string, origin?: HTMLElement | null) => void;
  isClaiming: boolean;
  t: Messages['missions'];
}) {
  const href = getMissionActionHref(mission.key, SOCIAL_MISSION_URLS[mission.key]);
  const [visited, setVisited] = useState(() => hasVisitedSocialMission(mission.key));

  const handleVisit = useCallback(() => {
    if (!href) return;
    window.open(href, '_blank', 'noopener,noreferrer');
    markSocialMissionVisited(mission.key);
    setVisited(true);
  }, [href, mission.key]);

  if (!href) {
    return (
      <Button
        size="sm"
        className={cn('w-full', isClaiming ? 'mission-quest__btn' : 'mission-quest__claim')}
        variant={isClaiming ? 'outline' : 'default'}
        disabled={isClaiming}
        onClick={(event) => onClaim(mission.key, event.currentTarget)}
      >
        {isClaiming ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : null}
        {formatClaimRewardLabel(t.claimReward, mission.rewardFragments)}
      </Button>
    );
  }

  if (!visited) {
    return (
      <Button size="sm" onClick={handleVisit} className="mission-quest__claim w-full">
        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
        {t.actionVisit}
      </Button>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="mission-quest__thanks">{t.socialThanks}</p>
      <Button
        size="sm"
        className={cn('w-full', isClaiming ? 'mission-quest__btn' : 'mission-quest__claim')}
        variant={isClaiming ? 'outline' : 'default'}
        disabled={isClaiming}
        onClick={(event) => onClaim(mission.key, event.currentTarget)}
      >
        {isClaiming ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : null}
        {formatClaimRewardLabel(t.claimReward, mission.rewardFragments)}
      </Button>
    </div>
  );
}

export function MissionClaimedRow({
  mission,
  t,
}: {
  mission: MissionRow;
  t: Messages['missions'];
}) {
  const itemMeta = t.items[mission.key as keyof typeof t.items];
  const kind = getMissionKind(mission.key);
  const accent = getMissionAccent(mission.key, mission.category);

  return (
    <div
      data-type={kind}
      data-kind={kind}
      data-completed="true"
      className="mission-quest-compact"
      style={kind === 'social' ? undefined : ({ '--mission-accent': accent } as CSSProperties)}
    >
      <MissionIcon missionKey={mission.key} completed />
      <p className="mission-quest-compact__title truncate">
        {itemMeta?.label ?? mission.key.replace(/_/g, ' ')}
      </p>
      <FragmentAmount
        amount={mission.rewardFragments}
        prefix="+"
        size="xs"
        className="mission-quest__reward shrink-0"
      />
      <span className="mission-quest-compact__claimed">
        <CheckCircleIcon className="h-4 w-4 text-theme-success" />
        {t.claimed}
      </span>
    </div>
  );
}

export function MissionCard({
  mission,
  onClaim,
  claimingKey,
  returnsLabel,
  t,
}: {
  mission: MissionRow;
  onClaim: (key: string, origin?: HTMLElement | null) => void;
  claimingKey: string | null;
  returnsLabel: string | null;
  t: Messages['missions'];
}) {
  const itemMeta = t.items[mission.key as keyof typeof t.items];
  const isSocial = mission.category === 'SOCIAL';
  const showProgress = isQuantitativeMission(mission);
  const progressText = formatMissionProgressLabel(mission);
  const progressPct =
    showProgress && mission.progressTarget
      ? Math.min(100, ((mission.progressCurrent ?? 0) / mission.progressTarget) * 100)
      : null;
  const kind = getMissionKind(mission.key);
  const accent = getMissionAccent(mission.key, mission.category);
  const status = getMissionUiStatus(mission);
  const blockReason = getMissionBlockReason(mission);
  const isClaiming = claimingKey === mission.key;
  const description =
    hasUsefulMissionDescription(mission) && itemMeta?.description ? itemMeta.description : null;

  return (
    <div
      data-type={kind}
      data-kind={kind}
      data-completed={mission.completed ? 'true' : 'false'}
      className={cn('mission-quest', mission.completed && 'mission-quest--done')}
      style={kind === 'social' ? undefined : ({ '--mission-accent': accent } as CSSProperties)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <MissionIcon missionKey={mission.key} completed={mission.completed} />
          <div className="min-w-0">
            <p className="mission-quest__title truncate">
              {itemMeta?.label ?? mission.key.replace(/_/g, ' ')}
            </p>
            {description ? <p className="mission-quest__desc truncate">{description}</p> : null}
          </div>
        </div>
        <FragmentAmount
          amount={mission.rewardFragments}
          prefix="+"
          size="xs"
          className="mission-quest__reward shrink-0"
        />
      </div>

      <div className="mission-quest__progress">
        {showProgress && progressPct != null ? (
          <>
            <Progress value={progressPct} className="mission-progress h-2" />
            <p className="mission-quest__meta tabular-nums">{progressText}</p>
          </>
        ) : null}
      </div>

      <div className="mt-auto">
        {status === 'claimed' ? (
          <Button size="sm" variant="outline" disabled className="mission-quest__btn w-full">
            <CheckCircleIcon className="h-4 w-4 text-theme-success" />
            {t.claimed}
          </Button>
        ) : status === 'blocked' && blockReason ? (
          <Button size="sm" variant="outline" disabled className="mission-quest__btn w-full">
            <LockClosedIcon className="h-4 w-4" />
            {blockReason}
          </Button>
        ) : status === 'claimable' && isSocial ? (
          <SocialMissionActions
            mission={mission}
            onClaim={onClaim}
            isClaiming={isClaiming}
            t={t}
          />
        ) : status === 'claimable' ? (
          <Button
            size="sm"
            className={cn('w-full', isClaiming ? 'mission-quest__btn' : 'mission-quest__claim')}
            variant={isClaiming ? 'outline' : 'default'}
            disabled={isClaiming}
            onClick={(event) => onClaim(mission.key, event.currentTarget)}
          >
            {isClaiming ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : null}
            {formatClaimRewardLabel(t.claimReward, mission.rewardFragments)}
          </Button>
        ) : (
          <MissionActionButton mission={mission} t={t} />
        )}
        <p className="mission-quest__foot">
          {status === 'claimed' && returnsLabel ? returnsLabel : '\u00a0'}
        </p>
      </div>
    </div>
  );
}
