'use client';

import type { ComponentType } from 'react';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
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
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import { SOCIAL_MISSION_URLS } from '@/lib/moonskin-social';
import { getSocialMissionIcon } from '@/components/ui/social-brand-icons';
import { FragmentAmount, FragmentBadge } from '@/components/ui/level-badge';
import type { Messages } from '~/utils/types';

const WELCOME_BONUS_MISSION_KEY = 'WELCOME_BONUS';

const SOCIAL_VISIT_DELAY_MS = 10_000;

type MissionCategory = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SOCIAL' | 'BONUS';
type CategoryFilter = 'ALL' | MissionCategory;

type MissionRow = {
  key: string;
  category: MissionCategory;
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

const CATEGORY_STYLE: Record<
  MissionCategory,
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

const CATEGORY_ORDER: MissionCategory[] = ['BONUS', 'DAILY', 'WEEKLY', 'MONTHLY', 'SOCIAL'];
const FILTER_ORDER: CategoryFilter[] = ['ALL', 'DAILY', 'WEEKLY', 'MONTHLY', 'SOCIAL', 'BONUS'];

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
  const progressPct =
    !mission.completed && mission.progressTarget != null && mission.progressCurrent != null
      ? Math.min(100, (mission.progressCurrent / mission.progressTarget) * 100)
      : null;

  return (
    <div
      data-type={mission.category.toLowerCase()}
      className={cn(
        'mission-quest',
        mission.completed
          ? 'border border-border/50 bg-muted/20 opacity-80 backdrop-blur-sm'
          : mission.eligible
            ? 'lunar-card !rounded-2xl'
            : 'border border-border/40 bg-card/30 backdrop-blur-sm'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/40 backdrop-blur-sm',
            mission.completed
              ? 'bg-muted/50'
              : mission.eligible
                ? 'bg-theme-accent/10'
                : 'bg-muted/40'
          )}
        >
          {mission.completed ? (
            <CheckCircleIcon className="h-5 w-5 text-theme-success" />
          ) : !mission.eligible ? (
            <LockClosedIcon className="h-5 w-5 text-muted-foreground" />
          ) : (
            <IconComp className={cn('h-5 w-5', MISSION_ICON_ACCENT)} />
          )}
        </div>
        <FragmentAmount
          amount={mission.rewardFragments}
          prefix="+"
          size="xs"
          className="text-sm font-bold text-theme-accent"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug">
          {itemMeta?.label ?? mission.key.replace(/_/g, ' ')}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {itemMeta?.description ?? ''}
        </p>
      </div>

      {progressPct != null && (
        <div className="space-y-1">
          <Progress value={progressPct} className="mission-progress h-1.5" />
          <p className="text-xs text-muted-foreground">
            {mission.thresholdCents != null
              ? `${(mission.progressCurrent! / 100).toFixed(0)} € / ${(mission.progressTarget! / 100).toFixed(0)} €`
              : `${mission.progressCurrent} / ${mission.progressTarget}`}
          </p>
        </div>
      )}

      <div className="mt-auto flex items-center justify-end pt-1">
        {mission.completed ? (
          <Badge
            variant="outline"
            className="bg-muted/30 text-muted-foreground border-border/60 backdrop-blur-sm"
          >
            <CheckCircleIcon className="mr-1 h-3.5 w-3.5 text-theme-success" />
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
          <Badge variant="outline" className="border-border/50 bg-muted/20 text-muted-foreground">
            <LockClosedIcon className="mr-1 h-3.5 w-3.5" />
            {t.notAvailable}
          </Badge>
        )}
      </div>
    </div>
  );
}

function WelcomeBonusCard({
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
  const item = t.items.WELCOME_BONUS;

  return (
    <div
      className={cn(
        'mission-welcome lunar-card p-5 sm:p-7',
        mission.completed && 'opacity-80'
      )}
    >
      <div className="relative z-[1] flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-theme-accent/30 bg-theme-accent/15">
            {mission.completed ? (
              <CheckCircleIcon className="h-7 w-7 text-theme-success" />
            ) : (
              <GiftIcon className="h-7 w-7 text-theme-accent" />
            )}
          </div>
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge className="mission-glass-badge text-[11px] uppercase tracking-wider">
                {t.welcomeBadge}
              </Badge>
              <Badge variant="outline" className="border-border/50 bg-background/30 text-[11px] text-muted-foreground">
                {t.welcomeOnce}
              </Badge>
            </div>
            <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              {item.label}
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
          <FragmentAmount
            amount={mission.rewardFragments}
            prefix="+"
            size="md"
            className="justify-center text-3xl font-bold text-theme-accent sm:justify-end"
          />
          {mission.completed ? (
            <Badge
              variant="outline"
              className="self-stretch justify-center bg-muted/30 px-4 py-2 text-muted-foreground border-border/60 sm:self-end"
            >
              <CheckCircleIcon className="mr-1.5 h-4 w-4 text-theme-success" />
              {t.claimed}
            </Badge>
          ) : (
            <Button
              size="lg"
              variant="cta"
              disabled={isPending || !mission.eligible}
              onClick={() => onClaim(mission.key)}
              className="min-w-[11rem]"
            >
              <GiftIcon className="h-4 w-4" />
              {t.claim}
            </Button>
          )}
        </div>
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
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');

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

  const missions = data?.missions ?? [];
  const welcomeMission = useMemo(
    () => (data?.missions ?? []).find((m) => m.key === WELCOME_BONUS_MISSION_KEY),
    [data?.missions]
  );
  const listedMissions = useMemo(
    () => (data?.missions ?? []).filter((m) => m.key !== WELCOME_BONUS_MISSION_KEY),
    [data?.missions]
  );
  const visibleCategories = useMemo(
    () =>
      CATEGORY_ORDER.filter((cat) =>
        categoryFilter === 'ALL' ? true : cat === categoryFilter
      ),
    [categoryFilter]
  );

  const totalClaimable = missions
    .filter((m) => m.eligible && !m.completed)
    .reduce((s, m) => s + m.rewardFragments, 0);
  const totalCompleted = missions.filter((m) => m.completed).length;
  const totalMissions = missions.length;

  if (authLoading) {
    return (
      <PageLoading variant="compact" message={t.loading} className="min-h-[50vh]" />
    );
  }

  if (!user) {
    if (isTourMode) return <MissionsTourDemo />;
    return (
      <LoginRequiredBlock
        icon={<SparklesIcon className="h-16 w-16" />}
        title={t.loginTitle}
        description={t.loginSubtitle}
      />
    );
  }

  return (
    <div className="container relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 -top-10 h-64 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-56 w-[36rem] -translate-x-1/2 rounded-full bg-theme-accent/12 blur-3xl" />
      </div>

      <AnimatePresence>
        {animatingFragments && (
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
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
              <p className="bg-gradient-to-br from-white via-[#e8e8f0] to-[#c0c0c0] bg-clip-text text-2xl font-bold tabular-nums text-transparent">
                +{claimedFragments} {t.celebrationFragments}
              </p>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#7a7a8c]">
                {t.celebrationComplete}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="relative z-[1] mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-theme-accent">
            CS2 · {messages.nav.missions}
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {messages.nav.missions}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {t.pageSubtitle}
          </p>
        </div>
        <Link href="/giveaways">
          <Button variant="outline" className="gap-2">
            {messages.giveaways.title}
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </Link>
      </header>

      <div className="relative z-[1] space-y-8">
        {isLoading ? (
          <div className="h-36 animate-pulse rounded-2xl bg-muted/40" />
        ) : welcomeMission ? (
          <WelcomeBonusCard
            mission={welcomeMission}
            onClaim={(key) => claim.mutate(key)}
            isPending={claim.isPending}
            t={t}
          />
        ) : null}

        <div data-tour="missions-stats" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="lunar-card border-border/60 bg-card/40">
            <CardContent className="p-4 text-center">
              <p className="mb-1 text-xs text-muted-foreground">{t.statsFragments}</p>
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
              <p className="mb-1 text-xs text-muted-foreground">{t.statsToClaim}</p>
              <FragmentAmount
                amount={totalClaimable}
                prefix="+"
                size="sm"
                className="justify-center text-2xl font-bold text-theme-accent"
              />
            </CardContent>
          </Card>
          <Card className="lunar-card border-border/60 bg-card/40">
            <CardContent className="p-4 text-center">
              <p className="mb-1 text-xs text-muted-foreground">{t.statsCompleted}</p>
              <p className="text-2xl font-bold tabular-nums text-theme-accent">
                {totalCompleted}/{totalMissions || '—'}
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
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted/40" />
            ))}
          </div>
        ) : (
          <div data-tour="missions-categories" className="space-y-6">
            <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {FILTER_ORDER.map((filter) => {
                const label =
                  filter === 'ALL' ? t.filterAll : t.categories[filter].label;
                return (
                  <button
                    key={filter}
                    type="button"
                    className="mission-filter-chip shrink-0"
                    aria-pressed={categoryFilter === filter}
                    onClick={() => setCategoryFilter(filter)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {visibleCategories.map((cat) => {
              const catMissions = listedMissions.filter((m) => m.category === cat);
              if (catMissions.length === 0) return null;
              const CatIcon = CATEGORY_STYLE[cat].icon;
              const catCopy = t.categories[cat];
              const catCompleted = catMissions.filter((m) => m.completed).length;
              const catClaimable = catMissions
                .filter((m) => m.eligible && !m.completed)
                .reduce((s, m) => s + m.rewardFragments, 0);

              return (
                <section key={cat} className="space-y-3">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                        <CatIcon className={cn('h-5 w-5', MISSION_ICON_ACCENT)} />
                        {catCopy.label}
                      </h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">{catCopy.description}</p>
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
                      <span className="text-xs font-normal text-muted-foreground">
                        {catCompleted}/{catMissions.length}
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {catMissions.map((m) => (
                      <MissionCard
                        key={`${m.key}-${m.periodKey}`}
                        mission={m}
                        onClaim={(key) => claim.mutate(key)}
                        isPending={claim.isPending}
                        t={t}
                      />
                    ))}
                  </div>
                </section>
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
    </div>
  );
}
