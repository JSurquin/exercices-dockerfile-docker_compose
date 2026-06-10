'use client';

import type { ComponentType } from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/providers/auth-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { useTourMode } from '@/components/providers/tour-provider';
import { MissionsTourDemo } from '@/components/tour-demos/missions-tour-demo';
import Link from 'next/link';
import { LoginRequiredBlock } from '@/components/auth/require-auth';
import { PageLoading } from '@/components/ui/page-loading';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  CheckCircleIcon,
  LockClosedIcon,
  ClockIcon,
  GiftIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  StarIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import { SOCIAL_MISSION_URLS } from '@/lib/moonskin-social';
import { getSocialMissionIcon } from '@/components/ui/social-brand-icons';
import { FragmentAmount, FragmentBadge } from '@/components/ui/level-badge';
import type { Messages } from '~/utils/types';

const SOCIAL_VISIT_DELAY_MS = 10_000;

type MissionRow = {
  key: string;
  category: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SOCIAL' | 'BONUS';
  rewardFragments: number;
  periodKey: string;
  completed: boolean;
  eligible: boolean;
  progressCurrent?: number;
  progressTarget?: number;
  thresholdCents?: number;
};

const MISSION_ICON_ACCENT = 'text-theme-accent';

const MISSION_ROW_STYLE: Record<string, { icon: ComponentType<{ className?: string }> }> = {
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

const CATEGORY_STYLE: Record<
  'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SOCIAL' | 'BONUS',
  { icon: ComponentType<{ className?: string }> }
> = {
  DAILY: { icon: ClockIcon },
  WEEKLY: { icon: CalendarDaysIcon },
  MONTHLY: { icon: ChartBarIcon },
  SOCIAL: { icon: SparklesIcon },
  BONUS: { icon: StarIcon },
};

const MISSION_VISIT_BTN =
  'gap-1.5 border-theme-accent/30 bg-background/40 text-theme-accent hover:bg-theme-accent/10 hover:text-theme-accent hover:border-theme-accent/40';

const CATEGORY_ORDER = ['BONUS', 'DAILY', 'WEEKLY', 'MONTHLY', 'SOCIAL'] as const;

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
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [visited, countdown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!socialUrl) {
    return (
      <Button size="sm" variant="cta" disabled={isPending} onClick={() => onClaim(mission.key)}>
        {t.claim}
      </Button>
    );
  }

  if (!visited) {
    return (
      <Button size="sm" variant="outline" onClick={handleVisit} className={MISSION_VISIT_BTN}>
        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
        {t.socialVisit}
      </Button>
    );
  }

  if (countdown > 0) {
    return (
      <Button size="sm" disabled className="gap-1.5 min-w-[140px]">
        <ClockIcon className="w-4 h-4 animate-spin" />
        {t.socialWaiting} ({countdown}s)
      </Button>
    );
  }

  return (
    <Button size="sm" variant="cta" disabled={isPending} onClick={() => onClaim(mission.key)}>
      {t.socialConfirm}
    </Button>
  );
}

function MissionCard({
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

  return (
    <div
      className={cn(
        'md:flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 rounded-xl p-4 transition-all',
        mission.completed
          ? 'border border-border/50 bg-muted/25 opacity-75 backdrop-blur-sm'
          : mission.eligible
            ? 'lunar-card !rounded-xl'
            : 'border border-border/40 bg-card/30 hover:bg-muted/20 backdrop-blur-sm'
      )}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-border/40 backdrop-blur-sm',
            mission.completed
              ? 'bg-muted/50'
              : mission.eligible
                ? 'bg-theme-accent/10'
                : 'bg-muted/40'
          )}
        >
          {mission.completed ? (
            <CheckCircleIcon className="w-5 h-5 text-theme-success" />
          ) : !mission.eligible ? (
            <LockClosedIcon className="w-5 h-5 text-muted-foreground" />
          ) : (
            <IconComp className={cn('w-5 h-5', MISSION_ICON_ACCENT)} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm">
            {itemMeta?.label ?? mission.key.replace(/_/g, ' ')}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {itemMeta?.description ?? ''}
          </p>
          {!mission.completed && mission.progressTarget != null && mission.progressCurrent != null && (
            <div className="mt-2 space-y-1">
              <Progress
                value={Math.min(100, (mission.progressCurrent / mission.progressTarget) * 100)}
                className="mission-progress h-1.5"
              />
              <p className="text-xs text-muted-foreground">
                {mission.thresholdCents != null
                  ? `${(mission.progressCurrent / 100).toFixed(0)} € / ${(mission.progressTarget / 100).toFixed(0)} €`
                  : `${mission.progressCurrent} / ${mission.progressTarget}`}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1 text-sm font-bold text-theme-accent">
          <FragmentAmount amount={mission.rewardFragments} prefix="+" size="xs" />
        </div>
        {mission.completed ? (
          <Badge
            variant="outline"
            className="bg-muted/30 text-muted-foreground border-border/60 backdrop-blur-sm"
          >
            <CheckCircleIcon className="w-3.5 h-3.5 mr-1 text-theme-success" />
            {t.claimed}
          </Badge>
        ) : mission.eligible && isSocial ? (
          <SocialMissionActions
            mission={mission}
            onClaim={onClaim}
            isPending={isPending}
            t={t}
          />
        ) : mission.eligible ? (
          <Button size="sm" variant="cta" disabled={isPending} onClick={() => onClaim(mission.key)}>
            {t.claim}
          </Button>
        ) : (
          <Badge variant="outline" className="text-muted-foreground border-border/50 bg-muted/20">
            <LockClosedIcon className="w-3.5 h-3.5 mr-1" />
            {t.notAvailable}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default function MissionsPage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const { messages, locale } = useLocale();
  const { isTourMode } = useTourMode();
  const t = messages.missions;
  const queryClient = useQueryClient();
  const [animatingFragments, setAnimatingFragments] = useState(false);
  const [claimedFragments, setClaimedFragments] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['missions', locale],
    queryFn: async () => {
      const r = await fetch('/api/missions', { credentials: 'include' });
      if (!r.ok) throw new Error(t.fetchError);
      return r.json() as Promise<{ missions: MissionRow[] }>;
    },
    enabled: !!user,
  });

  const claim = useMutation({
    mutationFn: async (missionKey: string) => {
      const r = await fetch('/api/missions/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ missionKey }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || t.genericError);
      return j;
    },
    onSuccess: async (j: { fragments?: number }) => {
      const earned = j.fragments ?? 0;
      setClaimedFragments(earned);
      setAnimatingFragments(true);
      setTimeout(() => setAnimatingFragments(false), 1600);

      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.userDashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.userBalanceHistory });

      await refreshUser();

      toast.success(t.toastEarnedTitle.replace('{amount}', String(earned)), {
        description: t.toastEarnedDescription,
        duration: 3000,
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t.genericError),
  });

  if (authLoading) {
    return (
      <PageLoading variant="compact" message={t.loading} className="min-h-[50vh]" />
    );
  }

  if (!user) {
    if (isTourMode) return <MissionsTourDemo />;
    return <LoginRequiredBlock />;
  }

  const missions = data?.missions ?? [];
  const byCat = (c: string) => missions.filter((m) => m.category === c);

  const totalClaimable = missions.filter((m) => m.eligible && !m.completed)
    .reduce((s, m) => s + m.rewardFragments, 0);
  const totalCompleted = missions.filter((m) => m.completed).length;
  const totalMissions = missions.length;

  return (
    <div className="container max-w-3xl mx-auto px-4 py-10 space-y-8">
      <AnimatePresence>
        {animatingFragments && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{
                opacity: 0,
                scale: 0.95,
                transition: { duration: 0.2, ease: 'easeOut' },
              }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex flex-col items-center gap-3 px-8 py-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
              style={{
                background: 'rgba(13, 13, 18, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(200, 205, 220, 0.12)',
                borderRadius: '16px',
              }}
            >
              <FragmentBadge
                size="md"
                className="drop-shadow-[0_0_16px_rgba(200,205,220,0.15)]"
              />
              <p className="text-2xl font-bold tabular-nums bg-gradient-to-br from-white via-[#e8e8f0] to-[#c0c0c0] bg-clip-text text-transparent">
                +{claimedFragments} {t.celebrationFragments}
              </p>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#7a7a8c]">
                {t.celebrationComplete}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <SparklesIcon className="w-8 h-8 text-theme-accent" />
            {messages.nav.missions}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t.pageSubtitle}
          </p>
        </div>
        <Link href="/giveaways">
          <Button variant="outline">{messages.giveaways.title}</Button>
        </Link>
      </div>

      <div data-tour="missions-stats" className="grid md:grid-cols-3 gap-3">
        <Card className="lunar-card border-border/60 bg-card/40">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">{t.statsFragments}</p>
            <motion.div
              key={user.fragments ?? 0}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center"
            >
              <FragmentAmount
                amount={user.fragments ?? 0}
                size="sm"
                className="text-2xl font-bold text-theme-accent"
              />
            </motion.div>
          </CardContent>
        </Card>
        <Card className="lunar-card border-border/60 bg-card/40">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">{t.statsToClaim}</p>
            <FragmentAmount
              amount={totalClaimable}
              prefix="+"
              size="sm"
              className="text-2xl font-bold text-theme-accent justify-center"
            />
          </CardContent>
        </Card>
        <Card className="lunar-card border-border/60 bg-card/40">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">{t.statsCompleted}</p>
            <p className="text-2xl font-bold text-theme-accent tabular-nums">
              {totalCompleted}/{totalMissions}
            </p>
          </CardContent>
        </Card>
      </div>

      {totalMissions > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t.globalProgress}</span>
            <span className="font-medium">{Math.round((totalCompleted / totalMissions) * 100)}%</span>
          </div>
          <Progress
            value={(totalCompleted / totalMissions) * 100}
            className="mission-progress h-2"
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div data-tour="missions-categories" className="space-y-8">
          {CATEGORY_ORDER.map((cat) => {
            const catMissions = byCat(cat);
            const catStyle = CATEGORY_STYLE[cat];
            const CatIcon = catStyle.icon;
            const catCopy = t.categories[cat];
            const catCompleted = catMissions.filter((m) => m.completed).length;
            const catClaimable = catMissions.filter((m) => m.eligible && !m.completed)
              .reduce((s, m) => s + m.rewardFragments, 0);

            return (
              <Card key={cat} className="lunar-card border-border/60 bg-card/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base text-foreground">
                    <div className="flex items-center gap-2">
                      <CatIcon className={cn('w-5 h-5', MISSION_ICON_ACCENT)} />
                      {catCopy.label}
                    </div>
                    <div className="flex items-center gap-2">
                      {catClaimable > 0 && (
                        <Badge className="mission-glass-badge text-xs">
                          <FragmentAmount
                            amount={catClaimable}
                            prefix="+"
                            size="xs"
                            className="text-xs font-medium"
                          />
                          <span className="ml-1">{t.categoryAvailableSuffix}</span>
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground font-normal">
                        {catCompleted}/{catMissions.length}
                      </span>
                    </div>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{catCopy.description}</p>
                  {catMissions.length > 0 && (
                    <Progress
                      value={(catCompleted / catMissions.length) * 100}
                      className="mission-progress h-1.5 mt-2"
                    />
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {catMissions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">{t.noMissionsInCategory}</p>
                  ) : (
                    catMissions.map((m) => (
                      <MissionCard
                        key={`${m.key}-${m.periodKey}`}
                        mission={m}
                        onClaim={(key) => claim.mutate(key)}
                        isPending={claim.isPending}
                        t={t}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {claim.isError && (
        <p className="text-sm text-destructive">
          {(claim.error as Error)?.message}
        </p>
      )}
    </div>
  );
}
