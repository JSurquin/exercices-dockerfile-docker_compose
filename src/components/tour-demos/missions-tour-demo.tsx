'use client';

import { Button } from '@/components/ui/button';
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
import { getSocialMissionIcon } from '@/components/ui/social-brand-icons';
import { formatMissionEur, formatMissionTitle } from '@/lib/mission-presentation';
import type { Messages } from '~/utils/types';

type MissionKey = keyof Messages['missions']['items'];

const DEMO_TODAY: Array<{ key: MissionKey; reward: number; completed: boolean }> = [
  { key: 'BONUS_DAILY_SURPRISE', reward: 35, completed: true },
  { key: 'DAILY_CLAIM', reward: 10, completed: false },
  { key: 'DAILY_VISIT', reward: 5, completed: true },
];

const DEMO_SECTIONS: Array<{
  id: 'TODAY' | 'WEEKLY' | 'MONTHLY' | 'SOCIAL';
  claimable: number;
  reset: 'day' | 'week' | 'month' | 'once';
  missions: Array<{
    key: MissionKey;
    reward: number;
    completed: boolean;
    eligible: boolean;
    progressCurrent?: number;
    progressTarget?: number;
    thresholdCents?: number;
    kind: 'sell' | 'giveaway' | 'social' | 'daily';
    action?: 'sell' | 'giveaway' | 'visit';
  }>;
}> = [
  {
    id: 'TODAY',
    claimable: 1,
    reset: 'day',
    missions: [
      {
        key: 'DAILY_SELL_SKIN',
        reward: 15,
        completed: false,
        eligible: false,
        progressCurrent: 0,
        progressTarget: 1,
        kind: 'sell',
        action: 'sell',
      },
    ],
  },
  {
    id: 'WEEKLY',
    claimable: 0,
    reset: 'week',
    missions: [
      {
        key: 'WEEKLY_SELL_500',
        reward: 50,
        completed: false,
        eligible: false,
        progressCurrent: 34_000,
        progressTarget: 50_000,
        thresholdCents: 50_000,
        kind: 'sell',
        action: 'sell',
      },
      {
        key: 'WEEKLY_SELL_1000',
        reward: 100,
        completed: false,
        eligible: false,
        progressCurrent: 34_000,
        progressTarget: 100_000,
        thresholdCents: 100_000,
        kind: 'sell',
        action: 'sell',
      },
    ],
  },
  {
    id: 'MONTHLY',
    claimable: 0,
    reset: 'month',
    missions: [
      {
        key: 'MONTHLY_SELL_5000',
        reward: 200,
        completed: false,
        eligible: false,
        progressCurrent: 120_000,
        progressTarget: 500_000,
        thresholdCents: 500_000,
        kind: 'sell',
        action: 'sell',
      },
    ],
  },
  {
    id: 'SOCIAL',
    claimable: 1,
    reset: 'once',
    missions: [
      { key: 'SOCIAL_DISCORD', reward: 25, completed: true, eligible: false, kind: 'social' },
      { key: 'SOCIAL_INSTAGRAM', reward: 15, completed: false, eligible: true, kind: 'social' },
      {
        key: 'SOCIAL_TELEGRAM',
        reward: 20,
        completed: false,
        eligible: false,
        kind: 'social',
        action: 'visit',
      },
    ],
  },
];

function DemoIcon({ missionKey }: { missionKey: MissionKey }) {
  const SocialIcon = getSocialMissionIcon(missionKey);
  if (SocialIcon) return <SocialIcon className="h-5 w-5" />;
  if (missionKey === 'BONUS_DAILY_SURPRISE') return <StarIcon className="h-5 w-5" />;
  if (missionKey === 'DAILY_VISIT') return <ClockIcon className="h-5 w-5" />;
  if (missionKey === 'DAILY_CLAIM') return <SparklesIcon className="h-5 w-5" />;
  if (missionKey.includes('GIVEAWAY')) return <GiftIcon className="h-5 w-5" />;
  return <ChartBarIcon className="h-5 w-5" />;
}

export function MissionsTourDemo() {
  const { messages, locale } = useLocale();
  const t = messages.missions;
  const resetExample = t.resetIn.replace('{duration}', `5${t.durationHours} 12${t.durationMinutes}`);

  return (
    <div className="container relative mx-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <GiveawayStarfield />
      <div className="relative z-[1] mx-auto w-full max-w-[1440px]">
        <TourDemoBanner />

        <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <SparklesIcon className="h-6 w-6 shrink-0 text-theme-accent" />
              <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {messages.nav.missions}
              </h1>
            </div>
            <p className="mt-1 max-w-2xl text-[13px] leading-snug text-foreground/80">{t.pageSubtitle}</p>
          </div>
          <div data-tour="missions-stats" className="flex shrink-0 flex-wrap items-center gap-3">
            <div className="mission-balance-pill">
              <FragmentAmount amount={85} size="xs" className="font-display text-base font-semibold text-theme-accent" />
              <span className="text-[13px] text-foreground/80">{t.statsClaimableToday}</span>
            </div>
            <Link
              href="/giveaways"
              className="inline-flex items-center gap-1 text-sm font-semibold text-theme-accent hover:underline"
            >
              {messages.nav.giveaways}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <div className="mission-stack">
          <div className="mission-welcome lunar-card px-4 py-4 sm:px-6 sm:py-5">
            <div className="relative z-[1] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-theme-accent/30 bg-theme-accent/15">
                  <GiftIcon className="h-6 w-6 text-theme-accent" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
                    {t.items.WELCOME_BONUS.label}
                  </h2>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end">
                <FragmentAmount amount={1000} prefix="+" size="sm" className="mission-quest__reward text-2xl" />
                <Button size="lg" className="mission-quest__claim min-w-[9.5rem]" disabled>
                  {t.claimReward.replace('{n}', '1000')}
                </Button>
              </div>
            </div>
          </div>

          {DEMO_SECTIONS.map((section) => {
            const resetLabel = section.reset === 'once' ? t.uniqueMissions : resetExample;
            const active = section.missions.filter((m) => !m.completed);
            const claimed = section.missions.filter((m) => m.completed);
            const isToday = section.id === 'TODAY';

            return (
              <section
                key={section.id}
                className="mission-section"
                data-tour={isToday ? 'missions-categories' : undefined}
              >
                <div className="mission-section__head">
                  <div className="mission-section__head-main">
                    <h2 className="mission-section__title">{t.sections[section.id]}</h2>
                    <p className="mission-section__meta" data-countdown>
                      {resetLabel}
                    </p>
                  </div>
                  {section.claimable > 0 ? (
                    <span className="mission-section__badge">
                      {t.claimableBadge.replace('{n}', String(section.claimable))}
                    </span>
                  ) : null}
                </div>

                {isToday ? (
                  <div className="mission-today-row">
                    {DEMO_TODAY.map((m) => (
                      <div key={m.key} data-type="daily" data-kind="daily" className="mission-today-tile">
                        <div className="mission-quest__icon shrink-0">
                          <DemoIcon missionKey={m.key} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="mission-quest__title truncate">{t.items[m.key].label}</p>
                          <FragmentAmount amount={m.reward} prefix="+" size="xs" className="mission-quest__reward mt-0.5" />
                        </div>
                        {m.completed ? (
                          <p className="mission-today-tile__status">
                            <CheckCircleIcon className="h-4 w-4 text-theme-success" />
                            {t.returnsInShort.replace('{duration}', `5${t.durationHours} 12${t.durationMinutes}`)}
                          </p>
                        ) : (
                          <Button size="sm" className="mission-quest__claim shrink-0" disabled>
                            {t.claimReward.replace('{n}', String(m.reward))}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}

                {active.length > 0 ? (
                  <div className="mission-quest-grid">
                    {active.map((m, i) => (
                      <div
                        key={`${section.id}-${i}`}
                        data-type={m.kind}
                        data-kind={m.kind}
                        data-completed="false"
                        className="mission-quest"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="mission-quest__icon">
                              <DemoIcon missionKey={m.key} />
                            </div>
                            <p className="mission-quest__title">
                              {formatMissionTitle(t.items[m.key].label, { thresholdCents: m.thresholdCents }, locale)}
                            </p>
                          </div>
                          <FragmentAmount amount={m.reward} prefix="+" size="xs" className="mission-quest__reward" />
                        </div>
                        {m.progressTarget != null && m.progressCurrent != null ? (
                          <div className="mission-quest__progress">
                            <p className="mission-quest__meta tabular-nums">
                              {m.thresholdCents != null
                                ? `${formatMissionEur(m.progressCurrent, locale)} / ${formatMissionEur(m.progressTarget, locale)}`
                                : `${m.progressCurrent} / ${m.progressTarget}`}
                            </p>
                          </div>
                        ) : null}
                        <div className="mt-auto">
                          {m.eligible ? (
                            <Button size="sm" className="mission-quest__claim w-full" disabled>
                              {t.claimReward.replace('{n}', String(m.reward))}
                            </Button>
                          ) : (
                            <Button size="sm" className="mission-quest__claim w-full" asChild>
                              <Link href={m.action === 'giveaway' ? '/giveaways' : m.action === 'visit' ? '/giveaways' : '/sell'}>
                                {m.action === 'giveaway'
                                  ? t.actionParticipate
                                  : m.action === 'visit'
                                    ? t.actionVisit
                                    : t.actionSell}
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {claimed.length > 0 ? (
                  <div className="mission-quest-compact-grid">
                    {claimed.map((m) => (
                      <div
                        key={m.key}
                        data-type={m.kind}
                        data-kind={m.kind}
                        data-completed="true"
                        className="mission-quest-compact"
                      >
                        <div className="mission-quest__icon">
                          <DemoIcon missionKey={m.key} />
                          <span className="mission-quest__icon-badge" aria-hidden>
                            <CheckCircleIcon className="h-3.5 w-3.5" />
                          </span>
                        </div>
                        <p className="mission-quest-compact__title truncate">
                          {formatMissionTitle(t.items[m.key].label, { thresholdCents: m.thresholdCents }, locale)}
                        </p>
                        <FragmentAmount amount={m.reward} prefix="+" size="xs" className="mission-quest__reward shrink-0" />
                        <span className="mission-quest-compact__claimed">
                          <CheckCircleIcon className="h-4 w-4 text-theme-success" />
                          {t.claimed}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
