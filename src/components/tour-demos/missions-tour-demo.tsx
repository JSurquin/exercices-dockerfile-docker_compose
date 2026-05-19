'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLocale } from '@/components/providers/locale-provider';
import {
  SparklesIcon,
  ClockIcon,
  ChartBarIcon,
  GiftIcon,
  GlobeAltIcon,
  StarIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { TourDemoBanner } from './tour-demo-banner';
import Link from 'next/link';

const DEMO_CATEGORIES = [
  {
    id: 'BONUS',
    label: 'Bonus',
    icon: StarIcon,
    color: 'text-yellow-400',
    missions: [
      { label: '🎁 Surprise du jour', reward: 5, completed: true, eligible: false },
    ],
  },
  {
    id: 'DAILY',
    label: 'Quotidien',
    icon: ClockIcon,
    color: 'text-amber-500',
    missions: [
      { label: '👋 Visite quotidienne', reward: 2, completed: true, eligible: false },
      { label: '💰 Vendre un skin aujourd\'hui', reward: 10, completed: false, eligible: true },
    ],
  },
  {
    id: 'WEEKLY',
    label: 'Hebdomadaire',
    icon: CalendarDaysIcon,
    color: 'text-emerald-500',
    missions: [
      { label: '📈 Volume 500 € sur 7 jours', reward: 30, completed: false, eligible: false, progress: 68 },
      { label: '📊 Volume 1 000 € sur 7 jours', reward: 60, completed: false, eligible: false, progress: 34 },
    ],
  },
  {
    id: 'MONTHLY',
    label: 'Mensuel',
    icon: ChartBarIcon,
    color: 'text-orange-500',
    missions: [
      { label: '🏆 Volume 5 000 € ce mois', reward: 150, completed: false, eligible: false, progress: 24 },
    ],
  },
  {
    id: 'SOCIAL',
    label: 'Social',
    icon: GlobeAltIcon,
    color: 'text-purple-500',
    missions: [
      { label: '💬 Rejoindre le Discord', reward: 20, completed: true, eligible: false },
      { label: '📱 Suivre sur Instagram', reward: 15, completed: false, eligible: true },
      { label: '✈️ Rejoindre le Telegram', reward: 15, completed: false, eligible: false },
    ],
  },
];

export function MissionsTourDemo() {
  const { messages } = useLocale();

  const totalCompleted = DEMO_CATEGORIES.flatMap((c) => c.missions).filter((m) => m.completed).length;
  const totalMissions = DEMO_CATEGORIES.flatMap((c) => c.missions).length;
  const totalClaimable = DEMO_CATEGORIES.flatMap((c) => c.missions)
    .filter((m) => m.eligible && !m.completed)
    .reduce((s, m) => s + m.reward, 0);

  return (
    <div className="container max-w-3xl mx-auto px-4 py-10 space-y-8">
      <TourDemoBanner />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <SparklesIcon className="w-8 h-8 text-amber-500" />
            {messages.nav.missions}
          </h1>
          <p className="text-muted-foreground mt-1">
            {messages.missions?.pageSubtitle ?? 'Complétez des missions pour gagner des fragments'}
          </p>
        </div>
        <Link href="/giveaways">
          <Button variant="outline">{messages.giveaways.title}</Button>
        </Link>
      </div>

      {/* Stats counters */}
      <div data-tour="missions-stats" className="grid md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">
              {messages.missions?.statsFragments ?? 'Fragments accumulés'}
            </p>
            <p className="text-2xl font-bold text-amber-600">340 💠</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">
              {messages.missions?.statsToClaim ?? 'À réclamer'}
            </p>
            <p className="text-2xl font-bold text-orange-500">+{totalClaimable}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">
              {messages.missions?.statsCompleted ?? 'Complétées'}
            </p>
            <p className="text-2xl font-bold text-green-500">
              {totalCompleted}/{totalMissions}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Global progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progression globale</span>
          <span className="font-medium">{Math.round((totalCompleted / totalMissions) * 100)}%</span>
        </div>
        <Progress value={(totalCompleted / totalMissions) * 100} className="h-2" />
      </div>

      {/* Mission categories */}
      <div data-tour="missions-categories" className="space-y-8">
        {DEMO_CATEGORIES.map((cat) => {
          const CatIcon = cat.icon;
          const catCompleted = cat.missions.filter((m) => m.completed).length;

          return (
            <Card key={cat.id}>
              <CardHeader className="pb-3">
                <CardTitle className={`flex items-center justify-between text-base ${cat.color}`}>
                  <div className="flex items-center gap-2">
                    <CatIcon className="w-5 h-5" />
                    {cat.label}
                  </div>
                  <span className="text-sm text-muted-foreground font-normal">
                    {catCompleted}/{cat.missions.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cat.missions.map((m, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
                      m.completed
                        ? 'border-green-500/20 bg-green-500/5'
                        : m.eligible
                        ? 'border-orange-500/20 bg-orange-500/5'
                        : 'border-border bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {m.completed ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-500 shrink-0" />
                      ) : (
                        <LockClosedIcon className="w-5 h-5 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{m.label}</p>
                        {'progress' in m && m.progress !== undefined && (
                          <div className="mt-1 space-y-0.5">
                            <Progress value={m.progress} className="h-1" />
                            <p className="text-[10px] text-muted-foreground">{m.progress}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-amber-600 border-amber-500/30 text-xs">
                        +{m.reward} 💠
                      </Badge>
                      {m.eligible && !m.completed && (
                        <Button size="sm" className="h-7 text-xs bg-orange-500 hover:bg-orange-600" disabled>
                          Réclamer
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
