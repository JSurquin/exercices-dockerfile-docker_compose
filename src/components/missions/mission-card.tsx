'use client';

import type { ComponentType, CSSProperties } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  GiftIcon,
  InformationCircleIcon,
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
  isQuantitativeMission,
  type MissionRow,
} from '@/lib/mission-presentation';
import type { Messages } from '~/utils/types';

const SOCIAL_VISIT_DELAY_MS = 10_000;

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

function actionLabel(kind: ReturnType<typeof getMissionActionKind>, t: Messages['missions']): string {
  if (kind === 'sell') return t.actionSell;
  if (kind === 'giveaway') return t.actionParticipate;
  return t.actionVisit;
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
      <Button size="sm" variant="outline" className="mission-quest__btn w-full" asChild>
        <a href={href} target="_blank" rel="noopener noreferrer">
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          {label}
        </a>
      </Button>
    );
  }
  return (
    <Button size="sm" variant="outline" className="mission-quest__btn w-full" asChild>
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
  const socialUrl = SOCIAL_MISSION_URLS[mission.key];
  const [visited, setVisited] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleVisit = useCallback(() => {
    if (!socialUrl) return;
    window.open(socialUrl, '_blank', 'noopener,noreferrer');
    setVisited(true);
    setCountdown(Math.ceil(SOCIAL_VISIT_DELAY_MS / 1000));
  }, [socialUrl]);

  useEffect(() => {
    if (!visited || countdown <= 0) return;
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visited, countdown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!socialUrl) {
    return (
      <Button
        size="sm"
        className="mission-quest__claim w-full"
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
      <Button size="sm" variant="outline" onClick={handleVisit} className="mission-quest__btn w-full">
        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
        {t.actionVisit}
      </Button>
    );
  }

  if (countdown > 0) {
    return (
      <Button size="sm" disabled className="mission-quest__btn w-full gap-1.5">
        <ArrowPathIcon className="h-4 w-4 animate-spin" />
        {t.socialWaiting} ({countdown}s)
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      className="mission-quest__claim w-full"
      disabled={isClaiming}
      onClick={(event) => onClaim(mission.key, event.currentTarget)}
    >
      {isClaiming ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : null}
      {formatClaimRewardLabel(t.claimReward, mission.rewardFragments)}
    </Button>
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
  const rowStyle = MISSION_ROW_STYLE[mission.key];
  const SocialIcon = getSocialMissionIcon(mission.key);
  const IconComp = SocialIcon ?? rowStyle?.icon ?? SparklesIcon;
  const itemMeta = t.items[mission.key as keyof typeof t.items];
  const isSocial = mission.category === 'SOCIAL' && mission.key !== 'SOCIAL_NEWSLETTER';
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
  const description = itemMeta?.description;

  return (
    <div
      data-type={kind}
      data-kind={kind}
      data-completed={mission.completed ? 'true' : 'false'}
      className={cn('mission-quest', mission.completed && 'mission-quest--done')}
      style={{ '--mission-accent': accent } as CSSProperties}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="mission-quest__icon">
            {mission.completed ? (
              <CheckCircleIcon className="h-5 w-5 text-theme-success" />
            ) : (
              <IconComp className="h-5 w-5" />
            )}
          </div>
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="mission-quest__title truncate">
              {itemMeta?.label ?? mission.key.replace(/_/g, ' ')}
            </p>
            {description ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="mission-quest__info"
                    aria-label={t.moreInfo}
                  >
                    <InformationCircleIcon className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-[13px] leading-snug">
                  {description}
                </TooltipContent>
              </Tooltip>
            ) : null}
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
            className="mission-quest__claim w-full"
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
