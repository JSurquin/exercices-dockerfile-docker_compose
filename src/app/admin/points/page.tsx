'use client';

import { useState } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  StarIcon,
  TicketIcon,
  TrophyIcon,
  UserGroupIcon,
  BoltIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowTrendingUpIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { useLocale } from '@/components/providers/locale-provider';
import type { PointsConfig } from '@/lib/points-config';
import { DEFAULT_FRAGMENT_DROP, DEFAULT_GIVEAWAY_COSTS } from '@/lib/points-config';

interface Metrics {
  totals: { points: number; tickets: number };
  bySource: {
    tradeSale: { points: number; tickets: number; count: number };
    dailyLogin: { points: number; count: number };
  };
  byType: Array<{ type: string; _sum: { points: number | null; tickets: number | null }; _count: number }>;
  topUsers: Array<{
    id: string;
    steamUsername: string | null;
    steamAvatar: string | null;
    xp: number;
    tickets: number;
    level: number;
  }>;
  recentTransactions: Array<{
    id: string;
    type: string;
    points: number;
    tickets: number;
    reason: string | null;
    createdAt: string;
    user: { id: string; steamUsername: string | null; steamAvatar: string | null };
  }>;
  streakStats: { maxStreak: number; avgStreak: number };
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  TRADE_SALE: 'bg-green-500/20 text-green-400 border-green-500/30',
  DAILY_LOGIN: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  LEVEL_UP: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  ADMIN_ADJUSTMENT: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  GIVEAWAY_ENTRY: 'bg-theme-accent/20 text-theme-highlight border-theme-accent/30',
  REFERRAL_BONUS: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

export default function AdminPointsPage() {
  const { messages } = useLocale();
  const t = messages.admin.points;

  const queryClient = useQueryClient();
  const [savingConfig, setSavingConfig] = useState(false);
  const [editConfig, setEditConfig] = useState<PointsConfig | null>(null);

  const [metricsQuery, configQuery] = useQueries({
    queries: [
      {
        queryKey: ['admin', 'points', 'metrics'],
        queryFn: async () => {
          const res = await fetch('/api/admin/points?view=metrics');
          if (!res.ok) throw new Error('metrics error');
          return res.json() as Promise<Metrics>;
        },
      },
      {
        queryKey: ['admin', 'points', 'config'],
        queryFn: async () => {
          const res = await fetch('/api/admin/points');
          if (!res.ok) throw new Error('config error');
          const data = await res.json() as PointsConfig;
          setEditConfig((prev) => prev ?? data);
          return data;
        },
      },
    ],
  });

  const metrics = metricsQuery.data ?? null;
  const config = configQuery.data ?? null;
  const loadingMetrics = metricsQuery.isLoading || configQuery.isLoading;

  const fetchMetrics = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'points'] });
  };

  const handleSaveConfig = async () => {
    if (!editConfig) return;
    setSavingConfig(true);
    try {
      const res = await fetch('/api/admin/points', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editConfig),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      queryClient.setQueryData(['admin', 'points', 'config'], updated);
      setEditConfig(updated);
      toast.success(t.configSaved);
    } catch {
      toast.error(t.configSaveError);
    } finally {
      setSavingConfig(false);
    }
  };

  const updateField = (key: keyof PointsConfig, value: number) => {
    setEditConfig(prev => prev ? { ...prev, [key]: value } : prev);
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-white flex items-center gap-2">
                <StarIcon className="w-7 h-7 text-yellow-400 shrink-0" />
                {t.title}
              </h1>
              <p className="text-slate-400">
                {t.description}
              </p>
            </div>
            <Button onClick={fetchMetrics} variant="outline" disabled={loadingMetrics}>
              {loadingMetrics ? t.loading : t.refresh}
            </Button>
          </div>
        </motion.div>

        {/* Quick stats */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-5">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <StarIcon className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{t.totalPoints}</p>
                    <p className="text-xl font-bold text-white">
                      {(metrics.totals.points ?? 0).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-5">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <TicketIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{t.totalFragments}</p>
                    <p className="text-xl font-bold text-white">
                      {(metrics.totals.tickets ?? 0).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-5">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <BoltIcon className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{t.viaSales}</p>
                    <p className="text-xl font-bold text-white">
                      {(metrics.bySource.tradeSale.count ?? 0).toLocaleString('fr-FR')}
                    </p>
                    <p className="text-xs text-slate-500">{t.transactions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-5">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-theme-accent/20 rounded-lg">
                    <FireIcon className="w-5 h-5 text-theme-highlight" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{t.streakMax}</p>
                    <p className="text-xl font-bold text-white">
                      {metrics.streakStats.maxStreak}{t.streakDays}
                    </p>
                    <p className="text-xs text-slate-500">{t.streakAvg} {metrics.streakStats.avgStreak}{t.streakDays}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="metrics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border-slate-700">
            <TabsTrigger value="metrics" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <ChartBarIcon className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t.tabMetrics}</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <TrophyIcon className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t.tabLeaderboard}</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Cog6ToothIcon className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t.tabConfig}</span>
            </TabsTrigger>
          </TabsList>

          {/* Metrics tab */}
          <TabsContent value="metrics" className="space-y-6">
            {loadingMetrics ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-8 text-center">
                  <p className="text-slate-400">{t.loadingMetrics}</p>
                </CardContent>
              </Card>
            ) : metrics ? (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white text-base flex items-center">
                        <BoltIcon className="w-5 h-5 mr-2 text-green-400" />
                        {t.eventTypeTitle}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {metrics.byType.map((item) => (
                          <div key={item.type} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant="outline"
                                className={`text-xs ${EVENT_TYPE_COLORS[item.type] ?? 'bg-slate-700 text-slate-300'}`}
                              >
                                {t.eventTypes[item.type as keyof typeof t.eventTypes] ?? item.type}
                              </Badge>
                              <span className="text-xs text-slate-500">{item._count} {t.times}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-yellow-400">
                                {(item._sum.points ?? 0).toLocaleString('fr-FR')} {t.pts}
                              </p>
                              {(item._sum.tickets ?? 0) > 0 && (
                                <p className="text-xs text-purple-400">
                                  +{item._sum.tickets} {t.fragments}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                        {metrics.byType.length === 0 && (
                          <p className="text-sm text-slate-500 text-center py-4">
                            {t.noTransactions}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white text-base flex items-center">
                        <CalendarDaysIcon className="w-5 h-5 mr-2 text-blue-400" />
                        {t.dailyLoginTitle}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-blue-400">
                              {(metrics.bySource.dailyLogin.count ?? 0).toLocaleString('fr-FR')}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">{t.totalLogins}</p>
                          </div>
                          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-yellow-400">
                              {(metrics.bySource.dailyLogin.points ?? 0).toLocaleString('fr-FR')}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">{t.pointsDistributed}</p>
                          </div>
                          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-theme-highlight">
                              {metrics.streakStats.maxStreak}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">{t.streakRecord}</p>
                          </div>
                          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-green-400">
                              {metrics.streakStats.avgStreak}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">{t.streakAverage}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-base flex items-center">
                      <FireIcon className="w-5 h-5 mr-2 text-theme-highlight" />
                      {t.randomDropsTitle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const dropTx = metrics.byType.filter((tx) => String(tx.type) === 'GENERATED_DROP');
                      const saleTx = metrics.byType.filter((tx) => String(tx.type) === 'GENERATED_SALE');
                      const dropCount = dropTx.reduce((s, tx) => s + tx._count, 0);
                      const dropTotal = dropTx.reduce((s, tx) => s + (tx._sum.points ?? 0), 0);
                      const saleCount = saleTx.reduce((s, tx) => s + tx._count, 0);
                      const dropRate = saleCount > 0 ? ((dropCount / saleCount) * 100).toFixed(1) : '0';
                      return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-theme-stat/10 border border-theme-highlight/20 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-theme-highlight">{dropCount.toLocaleString('fr-FR')}</p>
                            <p className="text-xs text-slate-400 mt-1">{t.dropsTriggered}</p>
                          </div>
                          <div className="bg-theme-stat/10 border border-theme-highlight/20 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-theme-highlight">{dropTotal.toLocaleString('fr-FR')}</p>
                            <p className="text-xs text-slate-400 mt-1">{t.fragmentsDistributed}</p>
                          </div>
                          <div className="bg-theme-stat/10 border border-theme-highlight/20 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-theme-highlight">{dropRate}%</p>
                            <p className="text-xs text-slate-400 mt-1">{t.realDropRate}</p>
                          </div>
                          <div className="bg-theme-stat/10 border border-theme-highlight/20 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-theme-highlight">
                              {dropCount > 0 ? Math.round(dropTotal / dropCount) : 0}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">{t.avgFragmentsPerDrop}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <ArrowTrendingUpIcon className="w-5 h-5 mr-2 text-theme-highlight" />
                      {t.recentTransactionsTitle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {metrics.recentTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={tx.user.steamAvatar ?? undefined} />
                              <AvatarFallback className="text-xs">
                                {(tx.user.steamUsername ?? '?').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-white">
                                {tx.user.steamUsername ?? t.anonymousPlayer}
                              </p>
                              <p className="text-xs text-slate-400">{tx.reason ?? t.eventTypes[tx.type as keyof typeof t.eventTypes]}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge
                              variant="outline"
                              className={`text-xs ${EVENT_TYPE_COLORS[tx.type] ?? ''}`}
                            >
                              {t.eventTypes[tx.type as keyof typeof t.eventTypes] ?? tx.type}
                            </Badge>
                            <div className="text-right">
                              <p className="text-sm font-bold text-yellow-400">+{tx.points} {t.pts}</p>
                              {tx.tickets > 0 && (
                                <p className="text-xs text-purple-400">+{tx.tickets} {t.fragments}</p>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 w-20 text-right">
                              {new Date(tx.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      ))}
                      {metrics.recentTransactions.length === 0 && (
                        <p className="text-sm text-slate-500 text-center py-6">
                          {t.noTransactionsYet}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>

          {/* Leaderboard tab */}
          <TabsContent value="leaderboard">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrophyIcon className="w-5 h-5 mr-2 text-yellow-400" />
                  {t.leaderboardTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMetrics ? (
                  <p className="text-slate-400 text-center py-8">{t.loadingLeaderboard}</p>
                ) : (
                  <div className="space-y-3">
                    {metrics?.topUsers.map((user, index) => (
                      <div
                        key={user.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          index === 0
                            ? 'bg-yellow-500/10 border-yellow-500/30'
                            : index === 1
                            ? 'bg-slate-300/5 border-slate-400/30'
                            : index === 2
                            ? 'bg-theme-accent/10 border-theme-accent/20'
                            : 'bg-slate-700/30 border-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-yellow-500 text-black' :
                            index === 1 ? 'bg-slate-400 text-black' :
                            index === 2 ? 'bg-primary text-primary-foreground' :
                            'bg-slate-700 text-slate-300'
                          }`}>
                            {index + 1}
                          </div>
                          <Avatar className="w-9 h-9">
                            <AvatarImage src={user.steamAvatar ?? undefined} />
                            <AvatarFallback className="text-xs">
                              {(user.steamUsername ?? '?').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {user.steamUsername ?? t.anonymousPlayer}
                            </p>
                            <p className="text-xs text-slate-400">{t.level} {user.level}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-bold text-yellow-400">
                              {(user.xp ?? 0).toLocaleString('fr-FR')} XP
                            </p>
                            <p className="text-xs text-purple-400">{user.tickets} {t.fragments}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!metrics?.topUsers || metrics.topUsers.length === 0) && (
                      <p className="text-center text-slate-500 py-8">
                        {t.noPlayersYet}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Config tab */}
          <TabsContent value="config">
            {editConfig && (
              <div className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <BoltIcon className="w-5 h-5 mr-2 text-green-400" />
                      {t.configSalesTitle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-slate-300">{t.pointsPerEuroLabel}</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={editConfig.pointsPerEuro}
                          onChange={(e) => updateField('pointsPerEuro', parseFloat(e.target.value) || 0)}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        <p className="text-xs text-slate-500">{t.pointsPerEuroHelp}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">{t.fragmentsPerEuroSaleLabel}</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editConfig.ticketsPerEuro}
                          onChange={(e) => updateField('ticketsPerEuro', parseFloat(e.target.value) || 0)}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        <p className="text-xs text-slate-500">{t.fragmentsPerEuroSaleHelp}</p>
                      </div>
                    </div>

                    <Separator className="my-4 bg-slate-700" />

                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <p className="text-sm text-slate-300 font-medium mb-2">{t.simulationTitle}</p>
                      <p className="text-xs text-slate-400">
                        {t.simulationText}
                        {' '}<span className="text-yellow-400 font-semibold">{Math.floor(100 * editConfig.pointsPerEuro)} {t.pts}</span>
                        {' '}{t.fragments === 'fragments' ? 'et' : '和'} <span className="text-purple-400 font-semibold">{Math.floor(100 * editConfig.ticketsPerEuro)} {t.fragments}</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <CalendarDaysIcon className="w-5 h-5 mr-2 text-blue-400" />
                      {t.configDailyTitle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-slate-300">{t.pointsPerLoginLabel}</Label>
                        <Input
                          type="number"
                          min="0"
                          value={editConfig.dailyLoginPoints}
                          onChange={(e) => updateField('dailyLoginPoints', parseInt(e.target.value) || 0)}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        <p className="text-xs text-slate-500">{t.pointsPerLoginHelp}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">{t.fragmentsPerLoginLabel}</Label>
                        <Input
                          type="number"
                          min="0"
                          value={editConfig.dailyLoginTickets}
                          onChange={(e) => updateField('dailyLoginTickets', parseInt(e.target.value) || 0)}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        <p className="text-xs text-slate-500">{t.fragmentsPerLoginHelp}</p>
                      </div>
                    </div>

                    <Separator className="my-4 bg-slate-700" />

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-slate-300">{t.streakMultiplierLabel}</Label>
                        <Input
                          type="number"
                          min="1"
                          step="0.05"
                          value={editConfig.streakMultiplier}
                          onChange={(e) => updateField('streakMultiplier', parseFloat(e.target.value) || 1)}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        <p className="text-xs text-slate-500">{t.streakMultiplierHelp}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">{t.streakMaxDaysLabel}</Label>
                        <Input
                          type="number"
                          min="1"
                          value={editConfig.streakMaxDays}
                          onChange={(e) => updateField('streakMaxDays', parseInt(e.target.value) || 1)}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        <p className="text-xs text-slate-500">{t.streakMaxDaysHelp}</p>
                      </div>
                    </div>

                    <Separator className="my-4 bg-slate-700" />

                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <p className="text-sm text-slate-300 font-medium mb-2">{t.streakSimulationTitle}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {[1, 3, 7, editConfig.streakMaxDays].map((day) => {
                          const eff = Math.min(day, editConfig.streakMaxDays);
                          const mult = 1 + (eff - 1) * (editConfig.streakMultiplier - 1);
                          const pts = Math.round(editConfig.dailyLoginPoints * mult);
                          return (
                            <div key={day} className="bg-slate-700/50 rounded p-2 text-center">
                              <p className="text-slate-400">{t.day} {day}</p>
                              <p className="text-yellow-400 font-bold">{pts} {t.pts}</p>
                              <p className="text-slate-500">×{mult.toFixed(2)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <TrophyIcon className="w-5 h-5 mr-2 text-purple-400" />
                      {t.configLevelTitle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-slate-300">{t.levelUpBonusLabel}</Label>
                        <Input
                          type="number"
                          min="0"
                          value={editConfig.levelUpBonusPoints}
                          onChange={(e) => updateField('levelUpBonusPoints', parseInt(e.target.value) || 0)}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        <p className="text-xs text-slate-500">{t.levelUpBonusHelp}</p>
                      </div>
                      <div className="bg-slate-700/30 rounded-lg p-4 flex items-center">
                        <div>
                          <p className="text-sm text-slate-300 font-medium mb-1">{t.levelFormulaTitle}</p>
                          <p className="text-xs text-slate-400 font-mono">{t.levelFormula}</p>
                          <p className="text-xs text-slate-500 mt-2">{t.levelFormulaDesc}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <FireIcon className="w-5 h-5 mr-2 text-theme-highlight" />
                      {t.configFragmentsTitle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-slate-300">{t.fragmentsPerEuroLabel}</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editConfig.fragmentsPerEuro}
                        onChange={(e) => updateField('fragmentsPerEuro', parseFloat(e.target.value) || 0)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                      <p className="text-xs text-slate-500">{t.fragmentsPerEuroHelp}</p>
                    </div>

                    <Separator className="bg-slate-700" />

                    <div>
                      <p className="text-sm text-slate-300 font-medium mb-4">{t.randomDropsConfigTitle}</p>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-slate-300">{t.dropChanceLabel}</Label>
                          <Input
                            type="number"
                            min="0"
                            max="1"
                            step="0.01"
                            value={editConfig.fragmentDrop?.dropChance ?? DEFAULT_FRAGMENT_DROP.dropChance}
                            onChange={(e) => {
                              const v = Math.min(1, Math.max(0, parseFloat(e.target.value) || 0));
                              setEditConfig((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      fragmentDrop: {
                                        ...(prev.fragmentDrop ?? DEFAULT_FRAGMENT_DROP),
                                        dropChance: v,
                                      },
                                    }
                                  : prev
                              );
                            }}
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                          <p className="text-xs text-slate-500">{t.dropChanceHelp}</p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-400 mb-3">{t.tierRangesTitle}</p>
                          <div className="space-y-3">
                            {(editConfig.fragmentDrop?.tiers ?? DEFAULT_FRAGMENT_DROP.tiers).map((tier, i) => (
                              <div key={i} className="grid grid-cols-3 gap-3 bg-slate-700/30 rounded-lg p-3">
                                <div className="space-y-1">
                                  <Label className="text-xs text-slate-400">{t.tierProbabilityLabel}</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={tier.probability}
                                    onChange={(e) => {
                                      const tiers = [...(editConfig.fragmentDrop?.tiers ?? DEFAULT_FRAGMENT_DROP.tiers)];
                                      tiers[i] = { ...tiers[i], probability: parseFloat(e.target.value) || 0 };
                                      setEditConfig((prev) =>
                                        prev
                                          ? { ...prev, fragmentDrop: { ...(prev.fragmentDrop ?? DEFAULT_FRAGMENT_DROP), tiers } }
                                          : prev
                                      );
                                    }}
                                    className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-slate-400">{t.tierMinLabel}</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={tier.minFragments}
                                    onChange={(e) => {
                                      const tiers = [...(editConfig.fragmentDrop?.tiers ?? DEFAULT_FRAGMENT_DROP.tiers)];
                                      tiers[i] = { ...tiers[i], minFragments: parseInt(e.target.value) || 1 };
                                      setEditConfig((prev) =>
                                        prev
                                          ? { ...prev, fragmentDrop: { ...(prev.fragmentDrop ?? DEFAULT_FRAGMENT_DROP), tiers } }
                                          : prev
                                      );
                                    }}
                                    className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-slate-400">{t.tierMaxLabel}</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={tier.maxFragments}
                                    onChange={(e) => {
                                      const tiers = [...(editConfig.fragmentDrop?.tiers ?? DEFAULT_FRAGMENT_DROP.tiers)];
                                      tiers[i] = { ...tiers[i], maxFragments: parseInt(e.target.value) || 1 };
                                      setEditConfig((prev) =>
                                        prev
                                          ? { ...prev, fragmentDrop: { ...(prev.fragmentDrop ?? DEFAULT_FRAGMENT_DROP), tiers } }
                                          : prev
                                      );
                                    }}
                                    className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <TicketIcon className="w-5 h-5 mr-2 text-purple-400" />
                      {t.configGiveawayTitle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM'] as const).map((type) => {
                        const labels: Record<string, string> = {
                          DAILY: 'Daily (50)',
                          WEEKLY: 'Weekly (150)',
                          MONTHLY: 'Monthly (400)',
                          YEARLY: 'Yearly (2000)',
                          CUSTOM: 'Custom (50)',
                        };
                        return (
                          <div key={type} className="space-y-2">
                            <Label className="text-slate-300 text-xs">{labels[type]}</Label>
                            <Input
                              type="number"
                              min="1"
                              value={(editConfig.giveawayCosts ?? DEFAULT_GIVEAWAY_COSTS)[type]}
                              onChange={(e) => {
                                const v = parseInt(e.target.value) || 1;
                                setEditConfig((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        giveawayCosts: {
                                          ...(prev.giveawayCosts ?? DEFAULT_GIVEAWAY_COSTS),
                                          [type]: v,
                                        },
                                      }
                                    : prev
                                );
                              }}
                              className="bg-slate-700 border-slate-600 text-white"
                            />
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-500 mt-3">{t.giveawayNote}</p>
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setEditConfig(config)}
                    disabled={savingConfig}
                  >
                    {t.cancelButton}
                  </Button>
                  <Button
                    onClick={handleSaveConfig}
                    disabled={savingConfig}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {savingConfig ? t.saving : t.saveButton}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
    </div>
  );
}
