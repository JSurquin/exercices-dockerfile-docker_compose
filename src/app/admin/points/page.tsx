'use client';

import { useState, useEffect, useCallback } from 'react';
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
import type { PointsConfig, DEFAULT_POINTS_CONFIG } from '@/lib/points-service';

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

const EVENT_TYPE_LABELS: Record<string, string> = {
  TRADE_SALE: 'Vente de skins',
  DAILY_LOGIN: 'Connexion quotidienne',
  LEVEL_UP: 'Passage de niveau',
  ADMIN_ADJUSTMENT: 'Ajustement admin',
  GIVEAWAY_ENTRY: 'Participation giveaway',
  REFERRAL_BONUS: 'Bonus parrainage',
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  TRADE_SALE: 'bg-green-500/20 text-green-400 border-green-500/30',
  DAILY_LOGIN: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  LEVEL_UP: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  ADMIN_ADJUSTMENT: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  GIVEAWAY_ENTRY: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  REFERRAL_BONUS: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

export default function AdminPointsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [config, setConfig] = useState<PointsConfig | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [editConfig, setEditConfig] = useState<PointsConfig | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const [metricsRes, configRes] = await Promise.all([
        fetch('/api/admin/points?view=metrics'),
        fetch('/api/admin/points'),
      ]);
      const metricsData = await metricsRes.json();
      const configData = await configRes.json();
      setMetrics(metricsData);
      setConfig(configData);
      setEditConfig(configData);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

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
      setConfig(updated);
      setEditConfig(updated);
      toast.success('Configuration sauvegardée');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSavingConfig(false);
    }
  };

  const updateField = (key: keyof PointsConfig, value: number) => {
    setEditConfig(prev => prev ? { ...prev, [key]: value } : prev);
  };

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-white">
                <StarIcon className="w-8 h-8 inline-block mr-2 text-yellow-400" />
                Système de Points & Gamification
              </h1>
              <p className="text-slate-400">
                Configurez les règles d&apos;attribution de points, consultez les métriques et gérez la progression des joueurs.
              </p>
            </div>
            <Button onClick={fetchMetrics} variant="outline" disabled={loadingMetrics}>
              {loadingMetrics ? 'Chargement...' : 'Actualiser'}
            </Button>
          </div>
        </motion.div>

        {/* Stats rapides */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-5">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <StarIcon className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Total Points</p>
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
                    <p className="text-xs text-slate-400">Total Tickets</p>
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
                    <p className="text-xs text-slate-400">Via Ventes</p>
                    <p className="text-xl font-bold text-white">
                      {(metrics.bySource.tradeSale.count ?? 0).toLocaleString('fr-FR')}
                    </p>
                    <p className="text-xs text-slate-500">transactions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-5">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <FireIcon className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Streak Max</p>
                    <p className="text-xl font-bold text-white">
                      {metrics.streakStats.maxStreak}j
                    </p>
                    <p className="text-xs text-slate-500">moy. {metrics.streakStats.avgStreak}j</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="metrics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border-slate-700">
            <TabsTrigger value="metrics" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <ChartBarIcon className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Métriques</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <TrophyIcon className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Classement</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Cog6ToothIcon className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Configuration</span>
            </TabsTrigger>
          </TabsList>

          {/* Métriques */}
          <TabsContent value="metrics" className="space-y-6">
            {loadingMetrics ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-8 text-center">
                  <p className="text-slate-400">Chargement des métriques...</p>
                </CardContent>
              </Card>
            ) : metrics ? (
              <>
                {/* Répartition par source */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white text-base flex items-center">
                        <BoltIcon className="w-5 h-5 mr-2 text-green-400" />
                        Points par type d&apos;événement
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
                                {EVENT_TYPE_LABELS[item.type] ?? item.type}
                              </Badge>
                              <span className="text-xs text-slate-500">{item._count} fois</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-yellow-400">
                                {(item._sum.points ?? 0).toLocaleString('fr-FR')} pts
                              </p>
                              {(item._sum.tickets ?? 0) > 0 && (
                                <p className="text-xs text-purple-400">
                                  +{item._sum.tickets} tickets
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                        {metrics.byType.length === 0 && (
                          <p className="text-sm text-slate-500 text-center py-4">
                            Aucune transaction encore
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white text-base flex items-center">
                        <CalendarDaysIcon className="w-5 h-5 mr-2 text-blue-400" />
                        Activité Daily Login
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-blue-400">
                              {(metrics.bySource.dailyLogin.count ?? 0).toLocaleString('fr-FR')}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">Connexions totales</p>
                          </div>
                          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-yellow-400">
                              {(metrics.bySource.dailyLogin.points ?? 0).toLocaleString('fr-FR')}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">Points distribués</p>
                          </div>
                          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-orange-400">
                              {metrics.streakStats.maxStreak}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">Streak record (jours)</p>
                          </div>
                          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-green-400">
                              {metrics.streakStats.avgStreak}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">Streak moyen (jours)</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Transactions récentes */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <ArrowTrendingUpIcon className="w-5 h-5 mr-2 text-orange-400" />
                      Transactions récentes
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
                                {tx.user.steamUsername ?? 'Joueur anonyme'}
                              </p>
                              <p className="text-xs text-slate-400">{tx.reason ?? EVENT_TYPE_LABELS[tx.type]}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge
                              variant="outline"
                              className={`text-xs ${EVENT_TYPE_COLORS[tx.type] ?? ''}`}
                            >
                              {EVENT_TYPE_LABELS[tx.type] ?? tx.type}
                            </Badge>
                            <div className="text-right">
                              <p className="text-sm font-bold text-yellow-400">+{tx.points} pts</p>
                              {tx.tickets > 0 && (
                                <p className="text-xs text-purple-400">+{tx.tickets} tickets</p>
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
                          Aucune transaction pour le moment
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>

          {/* Classement */}
          <TabsContent value="leaderboard">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrophyIcon className="w-5 h-5 mr-2 text-yellow-400" />
                  Top 10 Joueurs — XP & Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMetrics ? (
                  <p className="text-slate-400 text-center py-8">Chargement...</p>
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
                            ? 'bg-orange-500/10 border-orange-500/20'
                            : 'bg-slate-700/30 border-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-yellow-500 text-black' :
                            index === 1 ? 'bg-slate-400 text-black' :
                            index === 2 ? 'bg-orange-600 text-white' :
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
                              {user.steamUsername ?? 'Joueur anonyme'}
                            </p>
                            <p className="text-xs text-slate-400">Niveau {user.level}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-bold text-yellow-400">
                              {(user.xp ?? 0).toLocaleString('fr-FR')} XP
                            </p>
                            <p className="text-xs text-purple-400">{user.tickets} tickets</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!metrics?.topUsers || metrics.topUsers.length === 0) && (
                      <p className="text-center text-slate-500 py-8">
                        Aucun joueur avec des points pour le moment
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration */}
          <TabsContent value="config">
            {editConfig && (
              <div className="space-y-6">
                {/* Section ventes */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <BoltIcon className="w-5 h-5 mr-2 text-green-400" />
                      Règles — Ventes de skins
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Points par euro vendu</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={editConfig.pointsPerEuro}
                          onChange={(e) => updateField('pointsPerEuro', parseFloat(e.target.value) || 0)}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        <p className="text-xs text-slate-500">
                          Ex: 100 = 100 pts par euro. Vente de 50€ → 5 000 pts
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Tickets par euro vendu</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editConfig.ticketsPerEuro}
                          onChange={(e) => updateField('ticketsPerEuro', parseFloat(e.target.value) || 0)}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        <p className="text-xs text-slate-500">
                          Ex: 0.1 = 1 ticket par 10€. Vente de 50€ → 5 tickets
                        </p>
                      </div>
                    </div>

                    <Separator className="my-4 bg-slate-700" />

                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <p className="text-sm text-slate-300 font-medium mb-2">Simulation</p>
                      <p className="text-xs text-slate-400">
                        Pour une vente de <span className="text-white font-semibold">100€</span> :
                        {' '}<span className="text-yellow-400 font-semibold">{Math.floor(100 * editConfig.pointsPerEuro)} pts</span>
                        {' '}et <span className="text-purple-400 font-semibold">{Math.floor(100 * editConfig.ticketsPerEuro)} tickets</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Section daily login */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <CalendarDaysIcon className="w-5 h-5 mr-2 text-blue-400" />
                      Règles — Connexion quotidienne
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Points par connexion</Label>
                        <Input
                          type="number"
                          min="0"
                          value={editConfig.dailyLoginPoints}
                          onChange={(e) => updateField('dailyLoginPoints', parseInt(e.target.value) || 0)}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        <p className="text-xs text-slate-500">Points de base (avant multiplicateur streak)</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Tickets par connexion</Label>
                        <Input
                          type="number"
                          min="0"
                          value={editConfig.dailyLoginTickets}
                          onChange={(e) => updateField('dailyLoginTickets', parseInt(e.target.value) || 0)}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        <p className="text-xs text-slate-500">Mettre à 0 pour ne pas donner de tickets</p>
                      </div>
                    </div>

                    <Separator className="my-4 bg-slate-700" />

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Multiplicateur streak (par jour)</Label>
                        <Input
                          type="number"
                          min="1"
                          step="0.05"
                          value={editConfig.streakMultiplier}
                          onChange={(e) => updateField('streakMultiplier', parseFloat(e.target.value) || 1)}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        <p className="text-xs text-slate-500">
                          1.1 = +10% par jour consécutif
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Streak maximum (jours)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={editConfig.streakMaxDays}
                          onChange={(e) => updateField('streakMaxDays', parseInt(e.target.value) || 1)}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        <p className="text-xs text-slate-500">Le multiplicateur est plafonné à ce nombre de jours</p>
                      </div>
                    </div>

                    <Separator className="my-4 bg-slate-700" />

                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <p className="text-sm text-slate-300 font-medium mb-2">Simulation du streak</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {[1, 3, 7, editConfig.streakMaxDays].map((day) => {
                          const eff = Math.min(day, editConfig.streakMaxDays);
                          const mult = 1 + (eff - 1) * (editConfig.streakMultiplier - 1);
                          const pts = Math.round(editConfig.dailyLoginPoints * mult);
                          return (
                            <div key={day} className="bg-slate-700/50 rounded p-2 text-center">
                              <p className="text-slate-400">Jour {day}</p>
                              <p className="text-yellow-400 font-bold">{pts} pts</p>
                              <p className="text-slate-500">×{mult.toFixed(2)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Section niveau */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <TrophyIcon className="w-5 h-5 mr-2 text-purple-400" />
                      Règles — Progression de niveau
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Bonus points passage de niveau</Label>
                        <Input
                          type="number"
                          min="0"
                          value={editConfig.levelUpBonusPoints}
                          onChange={(e) => updateField('levelUpBonusPoints', parseInt(e.target.value) || 0)}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        <p className="text-xs text-slate-500">
                          Points bonus accordés automatiquement à chaque passage de niveau
                        </p>
                      </div>
                      <div className="bg-slate-700/30 rounded-lg p-4 flex items-center">
                        <div>
                          <p className="text-sm text-slate-300 font-medium mb-1">Formule de niveau</p>
                          <p className="text-xs text-slate-400 font-mono">
                            niveau = √(XP / 100) + 1
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            Niveau 2 = 100 XP · Niveau 5 = 1 600 XP · Niveau 10 = 8 100 XP
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setEditConfig(config)}
                    disabled={savingConfig}
                  >
                    Annuler les modifications
                  </Button>
                  <Button
                    onClick={handleSaveConfig}
                    disabled={savingConfig}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {savingConfig ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
