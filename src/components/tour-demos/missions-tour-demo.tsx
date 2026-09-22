'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocale } from '@/components/providers/locale-provider';
import {
  SparklesIcon,
  ClockIcon,
  ChartBarIcon,
  GiftIcon,
  StarIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { TourDemoBanner } from './tour-demo-banner';
import { FragmentAmount } from '@/components/ui/level-badge';
import Link from 'next/link';
import { GiveawayStarfield } from '@/components/giveaway/giveaway-starfield';
import type { Messages } from '~/utils/types';

type MissionKey = keyof Messages['missions']['items'];

const DEMO_TODAY: Array<{ key: MissionKey; reward: number; completed: boolean }> = [
  { key: 'BONUS_DAILY_SURPRISE', reward: 35, completed: true },
  { key: 'DAILY_CLAIM', reward: 10, completed: false },
  { key: 'DAILY_VISIT', reward: 5, completed: true },
];

const DEMO_TABS: Array<{
  id: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SOCIAL';
  claimable: number;
  missions: Array<{
    key: MissionKey;
    reward: number;
    completed: boolean;
    eligible: boolean;
    progress?: string;
  }>;
}> = [
  {
    id: 'DAILY',
    claimable: 0,
    missions: [{ key: 'DAILY_SELL_SKIN', reward: 15, completed: false, eligible: false, progress: '0 / 1' }],
  },
  {
    id: 'WEEKLY',
    claimable: 0,
    missions: [
      { key: 'WEEKLY_SELL_500', reward: 50, completed: false, eligible: false, progress: '340 € / 500 €' },
      { key: 'WEEKLY_SELL_1000', reward: 100, completed: false, eligible: false, progress: '340 € / 1 000 €' },
    ],
  },
  {
    id: 'MONTHLY',
    claimable: 0,
    missions: [
      { key: 'MONTHLY_SELL_5000', reward: 200, completed: false, eligible: false, progress: '1 200 € / 5 000 €' },
    ],
  },
  {
    id: 'SOCIAL',
    claimable: 1,
    missions: [
      { key: 'SOCIAL_DISCORD', reward: 25, completed: true, eligible: false },
      { key: 'SOCIAL_INSTAGRAM', reward: 15, completed: false, eligible: true },
      { key: 'SOCIAL_TELEGRAM', reward: 20, completed: false, eligible: false },
    ],
  },
];

export function MissionsTourDemo() {
  const { messages } = useLocale();
  const t = messages.missions;
  const defaultTab =
    DEMO_TABS.reduce((best, tab) => (tab.claimable > best.claimable ? tab : best), DEMO_TABS[0]!).id;

  return (
    <div className="container relative mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <GiveawayStarfield />
      <div className="relative z-[1] mx-auto w-full max-w-[1280px]">
        <TourDemoBanner />

        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <SparklesIcon className="h-6 w-6 shrink-0 text-theme-accent" />
              <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {messages.nav.missions}
              </h1>
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-snug text-foreground/70">{t.pageSubtitle}</p>
          </div>
          <div data-tour="missions-stats" className="flex shrink-0 flex-wrap items-center gap-3">
            <div className="mission-balance-pill">
              <FragmentAmount amount={340} size="xs" className="font-display text-base font-semibold text-theme-accent" />
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
        </header>

        <div className="mission-welcome lunar-card mb-8 px-4 py-4 sm:px-6 sm:py-5">
          <div className="relative z-[1] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-theme-accent/30 bg-theme-accent/15">
                <GiftIcon className="h-6 w-6 text-theme-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-theme-accent">
                  {t.welcomeBadge}
                </p>
                <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
                  {t.items.WELCOME_BONUS.label}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{t.items.WELCOME_BONUS.description}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end">
              <FragmentAmount amount={1000} prefix="+" size="sm" className="text-2xl font-bold text-theme-accent" />
              <Button size="lg" variant="cta" disabled className="min-w-[9.5rem]">
                {t.claim}
              </Button>
            </div>
          </div>
        </div>

        <section className="mb-8">
          <h2 className="mb-3 font-display text-lg font-semibold">{t.todayTitle}</h2>
          <div className="mission-today-row">
            {DEMO_TODAY.map((m) => (
              <div key={m.key} data-type="daily" className="mission-today-tile">
                <div className="mission-quest__icon shrink-0">
                  {m.key === 'BONUS_DAILY_SURPRISE' ? (
                    <StarIcon className="h-5 w-5" />
                  ) : m.key === 'DAILY_VISIT' ? (
                    <ClockIcon className="h-5 w-5" />
                  ) : (
                    <SparklesIcon className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold">{t.items[m.key].label}</p>
                  <FragmentAmount amount={m.reward} prefix="+" size="xs" className="mt-0.5 text-sm font-bold text-theme-accent" />
                </div>
                {m.completed ? (
                  <p className="max-w-[9.5rem] text-right text-xs font-medium text-muted-foreground">
                    {t.returnsIn.replace('{duration}', `5${t.durationHours} 12${t.durationMinutes}`)}
                  </p>
                ) : (
                  <Button size="sm" variant="cta" disabled>
                    {t.claim}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>

        <Tabs defaultValue={defaultTab} data-tour="missions-categories">
          <TabsList className="mission-tabs h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
            {DEMO_TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="mission-tab flex-1 data-[state=active]:bg-theme-accent/15 data-[state=active]:text-theme-highlight data-[state=active]:shadow-none"
              >
                {t.tabs[tab.id]}
                {tab.claimable > 0 ? <span className="mission-tab-badge">{tab.claimable}</span> : null}
              </TabsTrigger>
            ))}
          </TabsList>
          <p className="mt-3 text-sm text-muted-foreground" data-countdown>
            {t.resetIn.replace('{duration}', `5${t.durationHours} 12${t.durationMinutes}`)}
          </p>
          {DEMO_TABS.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-4">
              <div className="mission-quest-grid">
                {tab.missions.map((m, i) => (
                  <div
                    key={i}
                    data-type={tab.id.toLowerCase()}
                    data-completed={m.completed ? 'true' : 'false'}
                    className={`mission-quest ${m.completed ? 'mission-quest--done' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="mission-quest__icon">
                        {m.completed ? (
                          <CheckCircleIcon className="h-5 w-5 text-theme-success" />
                        ) : tab.id === 'WEEKLY' || tab.id === 'MONTHLY' || tab.id === 'DAILY' ? (
                          <ChartBarIcon className="h-5 w-5" />
                        ) : (
                          <SparklesIcon className="h-5 w-5" />
                        )}
                      </div>
                      <FragmentAmount amount={m.reward} prefix="+" size="xs" className="text-base font-bold text-theme-accent" />
                    </div>
                    <p className="font-display text-base font-semibold">{t.items[m.key].label}</p>
                    {m.progress ? <p className="text-xs tabular-nums text-muted-foreground">{m.progress}</p> : null}
                    <div className="mt-auto pt-1">
                      {m.eligible && !m.completed ? (
                        <Button size="sm" variant="cta" className="w-full" disabled>
                          {t.claim}
                        </Button>
                      ) : m.completed ? (
                        <Button size="sm" variant="outline" disabled className="w-full">
                          {t.claimed}
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled className="w-full">
                          {m.progress ?? t.inProgress}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
