'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/auth-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { useTourMode } from '@/components/providers/tour-provider';
import { MissionsTourDemo } from '@/components/tour-demos/missions-tour-demo';
import Link from 'next/link';
import { LoginRequiredBlock } from '@/components/auth/require-auth';
import { PageLoading } from '@/components/ui/page-loading';
import { toast } from 'sonner';
import { SparklesIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { queryKeys } from '@/lib/query-keys';
import { FragmentAmount } from '@/components/ui/level-badge';
import { GiveawayStarfield } from '@/components/giveaway/giveaway-starfield';
import { GiveawayPageReveal } from '@/components/giveaway/giveaway-motion-surface';
import { useLiveNow } from '@/components/giveaway/giveaway-countdown';
import { MissionCard, MissionClaimedRow } from '@/components/missions/mission-card';
import { MissionClaimFly, type MissionClaimFlyPoint } from '@/components/missions/mission-claim-fly';
import { MissionWelcomeBanner } from '@/components/missions/mission-welcome';
import { MissionTodayTile } from '@/components/missions/mission-today';
import { MissionSection } from '@/components/missions/mission-section';
import {
  SECTION_RESET_PERIOD,
  areAllMissionsClaimed,
  countClaimable,
  formatMissionDuration,
  formatMissionResetLine,
  groupMissionsForPage,
  mapMissionClaimError,
  nextMissionResetAt,
  partitionMissionsByClaimed,
  type CompactDurationLabels,
  type MissionRow,
} from '@/lib/mission-presentation';

function pointFromRect(rect: DOMRect, at: 'center' | 'top'): MissionClaimFlyPoint {
  return {
    x: rect.left + rect.width / 2,
    y: at === 'top' ? rect.top : rect.top + rect.height / 2,
  };
}

function MissionCardGrid({
  missions,
  onClaim,
  claimingKey,
  returnsLabel,
  t,
}: {
  missions: MissionRow[];
  onClaim: (missionKey: string, origin?: HTMLElement | null) => void;
  claimingKey: string | null;
  returnsLabel: string | null;
  t: Parameters<typeof MissionCard>[0]['t'];
}) {
  if (missions.length === 0) return null;
  return (
    <div className="mission-quest-grid">
      {missions.map((mission) => (
        <MissionCard
          key={`${mission.key}-${mission.periodKey}`}
          mission={mission}
          onClaim={onClaim}
          claimingKey={claimingKey}
          returnsLabel={returnsLabel}
          t={t}
        />
      ))}
      <div className="mission-quest-grid__filler" aria-hidden />
      <div className="mission-quest-grid__filler" aria-hidden />
      <div className="mission-quest-grid__filler" aria-hidden />
    </div>
  );
}

function MissionClaimedGrid({
  missions,
  t,
}: {
  missions: MissionRow[];
  t: Parameters<typeof MissionClaimedRow>[0]['t'];
}) {
  if (missions.length === 0) return null;
  return (
    <div className="mission-quest-compact-grid">
      {missions.map((mission) => (
        <MissionClaimedRow key={`${mission.key}-${mission.periodKey}`} mission={mission} t={t} />
      ))}
    </div>
  );
}

export default function MissionsPage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const { messages, locale } = useLocale();
  const { isTourMode } = useTourMode();
  const t = messages.missions;
  const queryClient = useQueryClient();
  const [fly, setFly] = useState<{
    id: number;
    amount: number;
    from: MissionClaimFlyPoint;
    to: MissionClaimFlyPoint;
  } | null>(null);
  const balanceRef = useRef<HTMLDivElement>(null);
  const claimOriginRef = useRef<HTMLElement | null>(null);
  const now = useLiveNow(15_000);

  const durationLabels: CompactDurationLabels = {
    days: t.durationDays,
    hours: t.durationHours,
    minutes: t.durationMinutes,
    seconds: t.durationSeconds,
  };

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
      const fromRect = claimOriginRef.current?.getBoundingClientRect();
      const toRect = balanceRef.current?.getBoundingClientRect();
      if (fromRect && toRect && earned > 0) {
        setFly({
          id: Date.now(),
          amount: earned,
          from: pointFromRect(fromRect, 'top'),
          to: pointFromRect(toRect, 'center'),
        });
      }

      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.userDashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.userBalanceHistory });

      await refreshUser();

      toast.success(t.toastEarnedTitle.replace('{amount}', String(earned)), {
        description: t.toastEarnedDescription,
        duration: 3000,
      });
    },
    onError: (e) =>
      toast.error(
        mapMissionClaimError(e instanceof Error ? e.message : t.genericError, t)
      ),
  });

  const handleClaim = useCallback((missionKey: string, origin?: HTMLElement | null) => {
    claimOriginRef.current = origin ?? null;
    claim.mutate(missionKey);
  }, [claim]);

  const clearFly = useCallback(() => setFly(null), []);

  const missions = useMemo(() => data?.missions ?? [], [data?.missions]);
  const grouped = useMemo(() => groupMissionsForPage(missions), [missions]);
  const dailyActions = useMemo(
    () => partitionMissionsByClaimed(grouped.dailyActions),
    [grouped.dailyActions]
  );
  const weekly = useMemo(() => partitionMissionsByClaimed(grouped.weekly), [grouped.weekly]);
  const monthly = useMemo(() => partitionMissionsByClaimed(grouped.monthly), [grouped.monthly]);
  const social = useMemo(() => partitionMissionsByClaimed(grouped.social), [grouped.social]);

  const todayAll = useMemo(
    () => [...grouped.todayTiles, ...grouped.dailyActions],
    [grouped.todayTiles, grouped.dailyActions]
  );
  const todayClaimable = countClaimable(todayAll);
  const weekClaimable = countClaimable(grouped.weekly);
  const monthClaimable = countClaimable(grouped.monthly);
  const socialClaimable = countClaimable(grouped.social);

  const dailyResetAt = nextMissionResetAt(SECTION_RESET_PERIOD.TODAY, new Date(now));
  const weekResetAt = nextMissionResetAt(SECTION_RESET_PERIOD.WEEKLY, new Date(now));
  const monthResetAt = nextMissionResetAt(SECTION_RESET_PERIOD.MONTHLY, new Date(now));
  const todayResetLabel = formatMissionResetLine(t.resetIn, dailyResetAt, durationLabels, t.uniqueMissions, now);
  const weekResetLabel = formatMissionResetLine(t.resetIn, weekResetAt, durationLabels, t.uniqueMissions, now);
  const monthResetLabel = formatMissionResetLine(t.resetIn, monthResetAt, durationLabels, t.uniqueMissions, now);
  const socialResetLabel = t.uniqueMissions;
  const todayReturnsLabel = dailyResetAt
    ? t.returnsIn.replace('{duration}', formatMissionDuration(dailyResetAt, durationLabels, now))
    : t.claimed;
  const weekReturnsLabel = weekResetAt
    ? t.returnsIn.replace('{duration}', formatMissionDuration(weekResetAt, durationLabels, now))
    : null;
  const monthReturnsLabel = monthResetAt
    ? t.returnsIn.replace('{duration}', formatMissionDuration(monthResetAt, durationLabels, now))
    : null;

  const claimingKey = claim.isPending ? (claim.variables ?? null) : null;
  const claimError = claim.isError
    ? mapMissionClaimError((claim.error as Error)?.message ?? t.genericError, t)
    : null;
  const showWelcome = Boolean(grouped.welcome && !grouped.welcome.completed);

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
    <div className="container relative mx-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <GiveawayStarfield />

      {fly ? (
        <MissionClaimFly
          key={fly.id}
          amount={fly.amount}
          from={fly.from}
          to={fly.to}
          onDone={clearFly}
        />
      ) : null}

      <div className="relative z-[1] mx-auto w-full max-w-[1440px]">
        <GiveawayPageReveal as="header" index={0} className="mb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <SparklesIcon className="h-6 w-6 shrink-0 text-theme-accent" />
                <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                  {messages.nav.missions}
                </h1>
              </div>
              <p className="mt-1 max-w-2xl text-[13px] leading-snug text-foreground/80 sm:text-sm">
                {t.pageSubtitle}
              </p>
            </div>
            <div data-tour="missions-stats" className="flex shrink-0 flex-wrap items-center gap-3">
              <div ref={balanceRef} id="mission-balance-pill" className="mission-balance-pill">
                <FragmentAmount
                  amount={user.fragments ?? 0}
                  size="xs"
                  className="font-display text-base font-semibold text-theme-accent"
                />
                <span className="text-[13px] text-foreground/80">{t.statsFragments}</span>
              </div>
              <Link
                href="/giveaways"
                className="inline-flex items-center gap-1 text-sm font-semibold text-theme-accent hover:underline"
              >
                {messages.giveaways.title}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </GiveawayPageReveal>

        <div className="mission-stack">
          {isLoading ? (
            <div className="h-20 animate-pulse rounded-2xl bg-muted/40" />
          ) : showWelcome && grouped.welcome ? (
            <GiveawayPageReveal as="section" index={1}>
              <MissionWelcomeBanner
                mission={grouped.welcome}
                onClaim={handleClaim}
                claimingKey={claimingKey}
                t={t}
              />
            </GiveawayPageReveal>
          ) : null}

          {isLoading ? (
            <div className="mission-today-row">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/40" />
              ))}
            </div>
          ) : todayAll.length > 0 ? (
            <GiveawayPageReveal as="div" index={2}>
              <MissionSection
                title={t.sections.TODAY}
                resetLabel={todayResetLabel}
                claimable={todayClaimable}
                allClaimed={areAllMissionsClaimed(todayAll)}
                tourTarget
                t={t}
              >
                {grouped.todayTiles.length > 0 ? (
                  <>
                    <p className="sr-only">{t.todaySubtitle}</p>
                    <div className="mission-today-row">
                      {grouped.todayTiles.map((mission) => (
                        <MissionTodayTile
                          key={`${mission.key}-${mission.periodKey}`}
                          mission={mission}
                          onClaim={handleClaim}
                          claimingKey={claimingKey}
                          returnsLabel={todayReturnsLabel}
                          t={t}
                        />
                      ))}
                    </div>
                  </>
                ) : null}
                <MissionCardGrid
                  missions={dailyActions.active}
                  onClaim={handleClaim}
                  claimingKey={claimingKey}
                  returnsLabel={todayReturnsLabel}
                  t={t}
                />
                <MissionClaimedGrid missions={dailyActions.claimed} t={t} />
              </MissionSection>
            </GiveawayPageReveal>
          ) : null}

          {isLoading ? (
            <div className="mission-quest-grid">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted/40" />
              ))}
            </div>
          ) : (
            <>
              {grouped.weekly.length > 0 ? (
                <GiveawayPageReveal as="div" index={3}>
                  <MissionSection
                    title={t.sections.WEEKLY}
                    resetLabel={weekResetLabel}
                    claimable={weekClaimable}
                    allClaimed={areAllMissionsClaimed(grouped.weekly)}
                    t={t}
                  >
                    <MissionCardGrid
                      missions={weekly.active}
                      onClaim={handleClaim}
                      claimingKey={claimingKey}
                      returnsLabel={weekReturnsLabel}
                      t={t}
                    />
                    <MissionClaimedGrid missions={weekly.claimed} t={t} />
                  </MissionSection>
                </GiveawayPageReveal>
              ) : null}

              {grouped.monthly.length > 0 ? (
                <GiveawayPageReveal as="div" index={4}>
                  <MissionSection
                    title={t.sections.MONTHLY}
                    resetLabel={monthResetLabel}
                    claimable={monthClaimable}
                    allClaimed={areAllMissionsClaimed(grouped.monthly)}
                    t={t}
                  >
                    <MissionCardGrid
                      missions={monthly.active}
                      onClaim={handleClaim}
                      claimingKey={claimingKey}
                      returnsLabel={monthReturnsLabel}
                      t={t}
                    />
                    <MissionClaimedGrid missions={monthly.claimed} t={t} />
                  </MissionSection>
                </GiveawayPageReveal>
              ) : null}

              {grouped.social.length > 0 ? (
                <GiveawayPageReveal as="div" index={5}>
                  <MissionSection
                    title={t.sections.SOCIAL}
                    resetLabel={socialResetLabel}
                    claimable={socialClaimable}
                    allClaimed={areAllMissionsClaimed(grouped.social)}
                    t={t}
                  >
                    <MissionCardGrid
                      missions={social.active}
                      onClaim={handleClaim}
                      claimingKey={claimingKey}
                      returnsLabel={null}
                      t={t}
                    />
                    <MissionClaimedGrid missions={social.claimed} t={t} />
                  </MissionSection>
                </GiveawayPageReveal>
              ) : null}
            </>
          )}

          {claimError ? (
            <p className="text-[13px] text-destructive" role="alert">
              {claimError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
