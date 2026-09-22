'use client';

import type { ComponentType, CSSProperties } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  ArrowTopRightOnSquareIcon,
  ChartBarIcon,
  GiftIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { SOCIAL_MISSION_URLS } from '@/lib/moonskin-social';
import { getSocialMissionIcon } from '@/components/ui/social-brand-icons';
import { FragmentAmount } from '@/components/ui/level-badge';
import {
  MISSION_CATEGORY_ACCENT,
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

const MISSION_VISIT_BTN =
  'gap-1.5 w-full border-theme-accent/30 bg-background/40 text-theme-accent hover:bg-theme-accent/10 hover:text-theme-accent hover:border-theme-accent/40';

function progressLabel(mission: MissionRow): string | null {
  if (mission.progressTarget == null || mission.progressCurrent == null) return null;
  if (mission.thresholdCents != null) {
    return `${(mission.progressCurrent / 100).toFixed(0)} € / ${(mission.progressTarget / 100).toFixed(0)} €`;
  }
  return `${mission.progressCurrent} / ${mission.progressTarget}`;
}

function SocialMissionActions({
  mission,
  onClaim,
  isPending,
  t,
}: {
  mission: MissionRow;
  onClaim: (key: string) => void;
  isPending: boolean;
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
      <Button size="sm" variant="cta" className="w-full" disabled={isPending} onClick={() => onClaim(mission.key)}>
        {t.claim}
      </Button>
    );
  }

  if (!visited) {
    return (
      <Button size="sm" variant="outline" onClick={handleVisit} className={MISSION_VISIT_BTN}>
        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
        {t.socialVisit}
      </Button>
    );
  }

  if (countdown > 0) {
    return (
      <Button size="sm" disabled className="w-full gap-1.5">
        <ClockIcon className="h-4 w-4 animate-spin" />
        {t.socialWaiting} ({countdown}s)
      </Button>
    );
  }

  return (
    <Button size="sm" variant="cta" className="w-full" disabled={isPending} onClick={() => onClaim(mission.key)}>
      {t.socialConfirm}
    </Button>
  );
}

export function MissionCard({
  mission,
  onClaim,
  isPending,
  t,
}: {
  mission: MissionRow;
  onClaim: (key: string) => void;
  isPending: boolean;
  t: Messages['missions'];
}) {
  const rowStyle = MISSION_ROW_STYLE[mission.key];
  const SocialIcon = getSocialMissionIcon(mission.key);
  const IconComp = SocialIcon ?? rowStyle?.icon ?? SparklesIcon;
  const itemMeta = t.items[mission.key as keyof typeof t.items];
  const isSocial = mission.category === 'SOCIAL' && mission.key !== 'SOCIAL_NEWSLETTER';
  const progressPct =
    !mission.completed && mission.progressTarget != null && mission.progressCurrent != null
      ? Math.min(100, (mission.progressCurrent / mission.progressTarget) * 100)
      : null;
  const progressText = progressLabel(mission);
  const accent = MISSION_CATEGORY_ACCENT[mission.category];

  return (
    <div
      data-type={mission.category.toLowerCase()}
      data-completed={mission.completed ? 'true' : 'false'}
      className={cn('mission-quest', mission.completed && 'mission-quest--done')}
      style={{ '--mission-accent': accent } as CSSProperties}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="mission-quest__icon">
          {mission.completed ? (
            <CheckCircleIcon className="h-5 w-5 text-theme-success" />
          ) : (
            <IconComp className="h-5 w-5" />
          )}
        </div>
        <FragmentAmount
          amount={mission.rewardFragments}
          prefix="+"
          size="xs"
          className="text-base font-bold text-theme-accent"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-semibold leading-snug">
          {itemMeta?.label ?? mission.key.replace(/_/g, ' ')}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {itemMeta?.description ?? ''}
        </p>
      </div>

      {progressPct != null && (
        <div className="space-y-1">
          <Progress value={progressPct} className="mission-progress h-1.5" />
          <p className="text-xs tabular-nums text-muted-foreground">{progressText}</p>
        </div>
      )}

      <div className="mt-auto pt-1">
        {mission.completed ? (
          <Button size="sm" variant="outline" disabled className="w-full">
            <CheckCircleIcon className="h-4 w-4 text-theme-success" />
            {t.claimed}
          </Button>
        ) : mission.eligible && isSocial ? (
          <SocialMissionActions mission={mission} onClaim={onClaim} isPending={isPending} t={t} />
        ) : mission.eligible ? (
          <Button
            size="sm"
            variant="cta"
            className="w-full"
            disabled={isPending}
            onClick={() => onClaim(mission.key)}
          >
            {t.claim}
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled className="w-full">
            {progressText ?? t.inProgress}
          </Button>
        )}
      </div>
    </div>
  );
}
