'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { MissionCard } from '@/components/missions/mission-card';
import { MissionClaimFly, type MissionClaimFlyPoint } from '@/components/missions/mission-claim-fly';
import { MissionWelcomeBanner } from '@/components/missions/mission-welcome';
import { MissionTodayTile } from '@/components/missions/mission-today';
import {
  TODAY_MISSION_KEYS,
  MISSION_PERIOD_TABS,
  TAB_RESET_PERIOD,
  countClaimable,
  formatMissionDuration,
  formatMissionResetLine,
  isTodayMissionKey,
  mapMissionClaimError,
  nextMissionResetAt,
  pickDefaultMissionTab,
  sortMissionsByStatus,
  type CompactDurationLabels,
  type MissionPeriodTab,
  type MissionRow,
} from '@/lib/mission-presentation';

const WELCOME_BONUS_MISSION_KEY = 'WELCOME_BONUS';

function pointFromRect(rect: DOMRect, at: 'center' | 'top'): MissionClaimFlyPoint {
  return {
    x: rect.left + rect.width / 2,
    y: at === 'top' ? rect.top : rect.top + rect.height / 2,
  };
}

export default function MissionsPage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const { messages, locale } = useLocale();
  const { isTourMode } = useTourMode();
  const t = messages.missions;
  const queryClient = useQueryClient();
  const [tabOverride, setTabOverride] = useState<MissionPeriodTab | null>(null);
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
  const welcomeMission = useMemo(
    () => missions.find((m) => m.key === WELCOME_BONUS_MISSION_KEY),
    [missions]
  );
  const todayMissions = useMemo(
    () =>
      TODAY_MISSION_KEYS.map((key) => missions.find((m) => m.key === key)).filter(
        (m): m is MissionRow => Boolean(m)
      ),
    [missions]
  );
  const tabMissions = useMemo(() => {
    const byTab: Record<MissionPeriodTab, MissionRow[]> = {
      DAILY: [],
      WEEKLY: [],
      MONTHLY: [],
      SOCIAL: [],
    };
    for (const mission of missions) {
      if (mission.key === WELCOME_BONUS_MISSION_KEY || isTodayMissionKey(mission.key)) continue;
      if (mission.category === 'DAILY') byTab.DAILY.push(mission);
      else if (mission.category === 'WEEKLY') byTab.WEEKLY.push(mission);
      else if (mission.category === 'MONTHLY') byTab.MONTHLY.push(mission);
      else if (mission.category === 'SOCIAL') byTab.SOCIAL.push(mission);
    }
    return {
      DAILY: sortMissionsByStatus(byTab.DAILY),
      WEEKLY: sortMissionsByStatus(byTab.WEEKLY),
      MONTHLY: sortMissionsByStatus(byTab.MONTHLY),
      SOCIAL: sortMissionsByStatus(byTab.SOCIAL),
    };
  }, [missions]);
  const claimableByTab = useMemo(
    () => ({
      DAILY: countClaimable(tabMissions.DAILY),
      WEEKLY: countClaimable(tabMissions.WEEKLY),
      MONTHLY: countClaimable(tabMissions.MONTHLY),
      SOCIAL: countClaimable(tabMissions.SOCIAL),
    }),
    [tabMissions]
  );
  const defaultTab = useMemo(() => pickDefaultMissionTab(claimableByTab), [claimableByTab]);
  const activeTab = tabOverride ?? defaultTab;
  const dailyResetAt = nextMissionResetAt('day', new Date(now));
  const tabResetAt = nextMissionResetAt(TAB_RESET_PERIOD[activeTab], new Date(now));
  const tabResetLabel = formatMissionResetLine(
    t.resetIn,
    tabResetAt,
    durationLabels,
    t.noReset,
    now
  );
  const todayReturnsLabel = dailyResetAt
    ? t.returnsIn.replace('{duration}', formatMissionDuration(dailyResetAt, durationLabels, now))
    : t.claimed;
  const tabReturnsLabel = tabResetAt
    ? t.returnsIn.replace('{duration}', formatMissionDuration(tabResetAt, durationLabels, now))
    : null;
  const claimingKey = claim.isPending ? (claim.variables ?? null) : null;
  const claimError = claim.isError
    ? mapMissionClaimError((claim.error as Error)?.message ?? t.genericError, t)
    : null;

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

        <div className="space-y-5">
          {isLoading ? (
            <div className="h-20 animate-pulse rounded-2xl bg-muted/40" />
          ) : welcomeMission && !welcomeMission.completed ? (
            <GiveawayPageReveal as="section" index={1}>
              <MissionWelcomeBanner
                mission={welcomeMission}
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
          ) : todayMissions.length > 0 ? (
            <GiveawayPageReveal as="section" index={2}>
              <h2 className="mb-2 font-display text-lg font-semibold">{t.todayTitle}</h2>
              <p className="sr-only">{t.todaySubtitle}</p>
              <div className="mission-today-row">
                {todayMissions.map((mission) => (
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
            </GiveawayPageReveal>
          ) : null}

          {isLoading ? (
            <div className="mission-quest-grid">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted/40" />
              ))}
            </div>
          ) : (
            <GiveawayPageReveal as="section" index={3}>
              <Tabs
                value={activeTab}
                onValueChange={(value) => setTabOverride(value as MissionPeriodTab)}
                data-tour="missions-categories"
              >
                <TabsList className="mission-tabs h-auto w-full justify-start gap-2 bg-transparent p-0">
                  {MISSION_PERIOD_TABS.map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="mission-tab data-[state=active]:bg-theme-accent/15 data-[state=active]:text-theme-highlight data-[state=active]:shadow-none"
                    >
                      {t.tabs[tab]}
                      {claimableByTab[tab] > 0 ? (
                        <span className="mission-tab-badge">{claimableByTab[tab]}</span>
                      ) : null}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <p className="mt-2 text-[13px] text-foreground/80" data-countdown>
                  {tabResetLabel}
                </p>
                {MISSION_PERIOD_TABS.map((tab) => (
                  <TabsContent key={tab} value={tab} className="mt-3">
                    {tabMissions[tab].length === 0 ? (
                      <p className="text-[13px] text-foreground/80">{t.noMissionsInCategory}</p>
                    ) : (
                      <div className="mission-quest-grid">
                        {tabMissions[tab].map((mission) => (
                          <MissionCard
                            key={`${mission.key}-${mission.periodKey}`}
                            mission={mission}
                            onClaim={handleClaim}
                            claimingKey={claimingKey}
                            returnsLabel={tabReturnsLabel}
                            t={t}
                          />
                        ))}
                        <div className="mission-quest-grid__filler" aria-hidden />
                        <div className="mission-quest-grid__filler" aria-hidden />
                        <div className="mission-quest-grid__filler" aria-hidden />
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </GiveawayPageReveal>
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
