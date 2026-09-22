'use client';

import { useMemo, useState } from 'react';
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
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { queryKeys } from '@/lib/query-keys';
import { FragmentAmount, FragmentBadge } from '@/components/ui/level-badge';
import { GiveawayStarfield } from '@/components/giveaway/giveaway-starfield';
import { GiveawayPageReveal } from '@/components/giveaway/giveaway-motion-surface';
import { useLiveNow } from '@/components/giveaway/giveaway-countdown';
import { MissionCard } from '@/components/missions/mission-card';
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
  nextMissionResetAt,
  pickDefaultMissionTab,
  type CompactDurationLabels,
  type MissionPeriodTab,
  type MissionRow,
} from '@/lib/mission-presentation';

const WELCOME_BONUS_MISSION_KEY = 'WELCOME_BONUS';

export default function MissionsPage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const { messages, locale } = useLocale();
  const { isTourMode } = useTourMode();
  const t = messages.missions;
  const queryClient = useQueryClient();
  const [animatingFragments, setAnimatingFragments] = useState(false);
  const [claimedFragments, setClaimedFragments] = useState(0);
  const [tabOverride, setTabOverride] = useState<MissionPeriodTab | null>(null);
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
    return byTab;
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
    <div className="container relative mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <GiveawayStarfield />

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

      <div className="relative z-[1] mx-auto w-full max-w-[1280px]">
        <GiveawayPageReveal as="header" index={0} className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <SparklesIcon className="h-6 w-6 shrink-0 text-theme-accent" />
                <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                  {messages.nav.missions}
                </h1>
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-snug text-foreground/70">
                {t.pageSubtitle}
              </p>
            </div>
            <div data-tour="missions-stats" className="flex shrink-0 flex-wrap items-center gap-3">
              <div className="mission-balance-pill">
                <FragmentAmount
                  amount={user.fragments ?? 0}
                  size="xs"
                  className="font-display text-base font-semibold text-theme-accent"
                />
                <span className="text-xs text-foreground/70">{t.statsFragments}</span>
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

        <div className="space-y-8">
          {isLoading ? (
            <div className="h-24 animate-pulse rounded-2xl bg-muted/40" />
          ) : welcomeMission && !welcomeMission.completed ? (
            <GiveawayPageReveal as="section" index={1}>
              <MissionWelcomeBanner
                mission={welcomeMission}
                onClaim={(key) => claim.mutate(key)}
                isPending={claim.isPending}
                t={t}
              />
            </GiveawayPageReveal>
          ) : null}

          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/40" />
              ))}
            </div>
          ) : todayMissions.length > 0 ? (
            <GiveawayPageReveal as="section" index={2}>
              <h2 className="mb-3 font-display text-lg font-semibold">{t.todayTitle}</h2>
              <p className="sr-only">{t.todaySubtitle}</p>
              <div className="mission-today-row">
                {todayMissions.map((mission) => (
                  <MissionTodayTile
                    key={`${mission.key}-${mission.periodKey}`}
                    mission={mission}
                    onClaim={(key) => claim.mutate(key)}
                    isPending={claim.isPending}
                    returnsLabel={todayReturnsLabel}
                    t={t}
                  />
                ))}
              </div>
            </GiveawayPageReveal>
          ) : null}

          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
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
                <TabsList className="mission-tabs h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
                  {MISSION_PERIOD_TABS.map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="mission-tab flex-1 data-[state=active]:bg-theme-accent/15 data-[state=active]:text-theme-highlight data-[state=active]:shadow-none"
                    >
                      {t.tabs[tab]}
                      {claimableByTab[tab] > 0 ? (
                        <span className="mission-tab-badge">{claimableByTab[tab]}</span>
                      ) : null}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <p className="mt-3 text-sm text-muted-foreground" data-countdown>
                  {tabResetLabel}
                </p>
                {MISSION_PERIOD_TABS.map((tab) => (
                  <TabsContent key={tab} value={tab} className="mt-4">
                    {tabMissions[tab].length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t.noMissionsInCategory}</p>
                    ) : (
                      <div className="mission-quest-grid">
                        {tabMissions[tab].map((mission) => (
                          <MissionCard
                            key={`${mission.key}-${mission.periodKey}`}
                            mission={mission}
                            onClaim={(key) => claim.mutate(key)}
                            isPending={claim.isPending}
                            t={t}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </GiveawayPageReveal>
          )}

          {claim.isError && (
            <p className="text-sm text-destructive">{(claim.error as Error)?.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
