'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLocale } from '@/components/providers/locale-provider';
import {
  SparklesIcon,
  ClockIcon,
  ChartBarIcon,
  GiftIcon,
  StarIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  LockClosedIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { TourDemoBanner } from './tour-demo-banner';
import { FragmentAmount } from '@/components/ui/level-badge';
import Link from 'next/link';
import type { Messages } from '~/utils/types';

type MissionKey = keyof Messages['missions']['items'];
type CategoryId = keyof Messages['missions']['categories'];

const DEMO_CATEGORIES: Array<{
  id: CategoryId;
  icon: typeof StarIcon;
  missions: Array<{
    key: MissionKey;
    reward: number;
    completed: boolean;
    eligible: boolean;
    progress?: number;
  }>;
}> = [
  {
    id: 'BONUS',
    icon: StarIcon,
    missions: [
      { key: 'BONUS_DAILY_SURPRISE', reward: 35, completed: true, eligible: false },
    ],
  },
  {
    id: 'DAILY',
    icon: ClockIcon,
    missions: [
      { key: 'DAILY_VISIT', reward: 5, completed: true, eligible: false },
      { key: 'DAILY_SELL_SKIN', reward: 15, completed: false, eligible: true },
    ],
  },
  {
    id: 'WEEKLY',
    icon: CalendarDaysIcon,
    missions: [
      { key: 'WEEKLY_SELL_500', reward: 50, completed: false, eligible: false, progress: 68 },
      { key: 'WEEKLY_SELL_1000', reward: 100, completed: false, eligible: false, progress: 34 },
    ],
  },
  {
    id: 'MONTHLY',
    icon: ChartBarIcon,
    missions: [
      { key: 'MONTHLY_SELL_5000', reward: 200, completed: false, eligible: false, progress: 24 },
    ],
  },
  {
    id: 'SOCIAL',
    icon: SparklesIcon,
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

  const listedMissions = DEMO_CATEGORIES.flatMap((c) => c.missions);
  const totalCompleted = listedMissions.filter((m) => m.completed).length;
  const totalMissions = listedMissions.length + 1;
  const totalClaimable =
    listedMissions.filter((m) => m.eligible && !m.completed).reduce((s, m) => s + m.reward, 0) + 1000;

  return (
    <div className="container relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <TourDemoBanner />

      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-theme-accent">
            CS2 · {messages.nav.missions}
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {messages.nav.missions}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{t.pageSubtitle}</p>
        </div>
        <Link href="/giveaways">
          <Button variant="outline" className="gap-2">
            {messages.giveaways.title}
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </Link>
      </header>

      <div className="mission-welcome lunar-card mb-8 p-5 sm:p-7">
        <div className="relative z-[1] flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-theme-accent/30 bg-theme-accent/15">
              <GiftIcon className="h-7 w-7 text-theme-accent" />
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
                {t.items.WELCOME_BONUS.label}
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                {t.items.WELCOME_BONUS.description}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
            <FragmentAmount
              amount={1000}
              prefix="+"
              size="md"
              className="justify-center text-3xl font-bold text-theme-accent sm:justify-end"
            />
            <Button size="lg" variant="cta" disabled className="min-w-[11rem]">
              {t.claim}
            </Button>
          </div>
        </div>
      </div>

      <div data-tour="missions-stats" className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="lunar-card border-border/60 bg-card/40">
          <CardContent className="p-4 text-center">
            <p className="mb-1 text-xs text-muted-foreground">{t.statsFragments}</p>
            <FragmentAmount amount={340} size="sm" className="justify-center text-2xl font-bold text-theme-accent" />
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
              {totalCompleted}/{totalMissions}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t.globalProgress}</span>
          <span className="font-medium">{Math.round((totalCompleted / totalMissions) * 100)}%</span>
        </div>
        <Progress value={(totalCompleted / totalMissions) * 100} className="mission-progress h-2" />
      </div>

      <div data-tour="missions-categories" className="space-y-6">
        {DEMO_CATEGORIES.map((cat) => {
          const CatIcon = cat.icon;
          const catCopy = t.categories[cat.id];
          const catCompleted = cat.missions.filter((m) => m.completed).length;

          return (
            <section key={cat.id} className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <CatIcon className="h-5 w-5 text-theme-accent" />
                  {catCopy.label}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {catCompleted}/{cat.missions.length}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {cat.missions.map((m, i) => (
                  <div
                    key={i}
                    className={`mission-quest ${
                      m.completed
                        ? 'border border-border/50 bg-muted/20 opacity-80'
                        : m.eligible
                          ? 'lunar-card !rounded-2xl'
                          : 'border border-border/40 bg-card/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {m.completed ? (
                        <CheckCircleIcon className="h-5 w-5 shrink-0 text-theme-success" />
                      ) : (
                        <LockClosedIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                      )}
                      <FragmentAmount amount={m.reward} prefix="+" size="xs" className="text-sm font-bold text-theme-accent" />
                    </div>
                    <p className="text-sm font-medium">{t.items[m.key].label}</p>
                    {'progress' in m && m.progress !== undefined && (
                      <div className="space-y-0.5">
                        <Progress value={m.progress} className="mission-progress h-1.5" />
                        <p className="text-[10px] text-muted-foreground">{m.progress}%</p>
                      </div>
                    )}
                    <div className="mt-auto flex justify-end">
                      {m.eligible && !m.completed && (
                        <Button size="sm" variant="cta" className="h-7 text-xs" disabled>
                          {t.claim}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
