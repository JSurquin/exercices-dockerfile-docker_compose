'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocale } from '@/components/providers/locale-provider';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  TrophyIcon,
  StarIcon,
  BanknotesIcon,
  GiftIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TourDemoBanner } from './tour-demo-banner';
import { FragmentAmount, FragmentBadge } from '@/components/ui/level-badge';

const BALANCE_HISTORY = [
  { date: '20/04', solde: 42 },
  { date: '25/04', solde: 95 },
  { date: '30/04', solde: 87 },
  { date: '05/05', solde: 140 },
  { date: '10/05', solde: 118 },
  { date: '15/05', solde: 175 },
  { date: '19/05', solde: 210 },
];

const DEMO_TRADES = [
  { status: 'PAID', ticket: 'TICK-20250501-0012', brut: '€ 85.40', net: '€ 82.97', date: '01/05/2025' },
  { status: 'IN_TRADE_HOLD', ticket: 'TICK-20250515-0031', brut: '€ 45.20', net: '€ 43.97', date: '15/05/2025' },
];

export function DashboardTourDemo() {
  const { messages } = useLocale();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto">
        <TourDemoBanner />

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 sm:space-x-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-cta-gradient-br flex items-center justify-center text-white text-2xl font-bold">
              🎮
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {messages.dashboard.welcome}, CS_Player
              </h1>
              <p className="text-muted-foreground">{messages.dashboard.subtitle}</p>
            </div>
          </div>

          {/* XP Card */}
          <Card data-tour="dashboard-xp">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <TrophyIcon className="w-6 h-6 text-yellow-500" />
                  <div>
                    <h3 className="font-semibold">{messages.dashboard.currentLevel} 5</h3>
                    <p className="text-sm text-muted-foreground">2 400 / 5 000 XP</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">7 400 XP</p>
                  <p className="text-sm text-muted-foreground">2 600 XP for level 6</p>
                </div>
              </div>
              <Progress value={48} className="h-3" />
            </CardContent>
          </Card>
        </div>

        {/* Balance Card */}
        <div
          data-tour="dashboard-balance"
          className="mb-6 sm:mb-8"
        >
          <Card className="overflow-hidden border-theme-highlight/20 bg-gradient-to-br from-theme-highlight/5 via-background to-theme-accent/5 py-0 gap-0">
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/50">
                <div className="p-4 sm:p-5 flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-theme-accent/10 flex items-center justify-center">
                        <BanknotesIcon className="w-4 h-4 text-theme-accent" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        {messages.dashboard.balance.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                      <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
                      +19.4%
                      <span className="text-muted-foreground font-normal ml-0.5">7d</span>
                    </div>
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                    210.00 €
                  </p>
                  <p className="text-sm text-theme-stat">+35.00 € vs last week</p>
                </div>
                <div className="p-4 sm:p-5 flex flex-col gap-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {messages.dashboard.balance.chart30days}
                  </p>
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={BALANCE_HISTORY} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="demoGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--theme-accent)" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="var(--theme-accent)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'currentColor' }} tickLine={false} axisLine={false} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`${v.toFixed(2)} €`, 'Solde']} />
                      <Area type="monotone" dataKey="solde" stroke="var(--theme-accent)" strokeWidth={2} fill="url(#demoGradient)" dot={false} activeDot={{ r: 4, fill: 'var(--theme-accent)' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div
          data-tour="dashboard-stats"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-5"
        >
          <Card className="py-0 gap-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{messages.dashboard.volume}</p>
                  <p className="text-xl font-bold">1 240.00 €</p>
                </div>
                <CurrencyDollarIcon className="w-6 h-6 text-theme-accent/70" />
              </div>
            </CardContent>
          </Card>
          <Card className="py-0 gap-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{messages.dashboard.trades}</p>
                  <p className="text-xl font-bold">18</p>
                </div>
                <ChartBarIcon className="w-6 h-6 text-theme-accent/70" />
              </div>
            </CardContent>
          </Card>
          <Card className="py-0 gap-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{messages.dashboard.level}</p>
                  <p className="text-xl font-bold">5</p>
                </div>
                <StarIcon className="w-6 h-6 text-theme-accent/70" />
              </div>
            </CardContent>
          </Card>
          <Card className="py-0 gap-0 border-theme-highlight/25 dark:border-theme-highlight/35">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{messages.dashboard.fragmentsLabel}</p>
                  <FragmentAmount amount={340} size="sm" className="text-xl font-bold text-theme-stat" />
                </div>
                <FragmentBadge size="md" />
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-full py-0 gap-0 border-theme-accent/20 dark:border-theme-accent/30">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <GiftIcon className="w-6 h-6 text-theme-accent/70 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{messages.dashboard.giveawaysLabel}</p>
                  <p className="text-sm font-medium text-theme-accent">{messages.dashboard.participateGiveaway}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="trades" data-tour="dashboard-trades">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-0">
            <TabsTrigger value="trades" className="text-xs sm:text-sm px-2">{messages.dashboard.tabs.trades}</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm px-2">{messages.dashboard.tabs.analytics}</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs sm:text-sm px-2">{messages.dashboard.tabs.payments}</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm px-2">{messages.dashboard.tabs.settings}</TabsTrigger>
          </TabsList>
          <TabsContent value="trades">
            <Card>
              <CardHeader>
                <CardTitle>{messages.dashboard.tradeHistory.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {DEMO_TRADES.map((t, i) => (
                  <div key={i} className="border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className={`${t.status === 'PAID' ? 'bg-emerald-500' : 'bg-yellow-500'} text-white`}>
                        {t.status === 'PAID' ? '✓ Payé' : '⏳ En cours'}
                      </Badge>
                      <span className="font-mono text-sm text-muted-foreground">{t.ticket}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{t.brut}</p>
                      <p className="text-xs text-green-600">{t.net}</p>
                      <p className="text-xs text-muted-foreground">{t.date}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="analytics">
            <Card><CardContent className="p-8 text-center text-muted-foreground">Analytics — demo</CardContent></Card>
          </TabsContent>
          <TabsContent value="payments">
            <Card><CardContent className="p-8 text-center text-muted-foreground">Paiements — demo</CardContent></Card>
          </TabsContent>
          <TabsContent value="settings">
            <Card><CardContent className="p-8 text-center text-muted-foreground">Paramètres — demo</CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
