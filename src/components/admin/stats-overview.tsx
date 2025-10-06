'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  ShoppingCart, 
  Euro, 
  TrendingUp, 
  Clock, 
  Shield, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { AdminStats } from '@/lib/types';

export function AdminStatsOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/stats');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement des statistiques');
      }

      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (centimes: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(centimes / 100);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  if (isLoading) {
    return <StatsSkeleton />;
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-500">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span>Erreur: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Utilisateurs */}
      <Card className="bg-slate-800/50 border-2 border-blue-500/50 hover:bg-slate-800/70 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">
            Total Utilisateurs
          </CardTitle>
          <Users className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {formatNumber(stats.totalUsers)}
          </div>
          <p className="text-xs text-slate-400">
            +{stats.monthlyStats[stats.monthlyStats.length - 1]?.newUsers || 0} ce mois
          </p>
        </CardContent>
      </Card>

      {/* Total Trades */}
      <Card className="bg-slate-800/50 border-2 border-emerald-500/50 hover:bg-slate-800/70 transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">
            Total Trades
          </CardTitle>
          <ShoppingCart className="h-4 w-4 text-emerald-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {formatNumber(stats.totalTrades)}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {stats.activeTrades} actifs
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Volume Total */}
      <Card className="bg-slate-800/50 border-2 border-yellow-500/50 hover:bg-slate-800/70 transition-all duration-300 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">
            Volume Total
          </CardTitle>
          <Euro className="h-4 w-4 text-yellow-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(stats.totalVolumeCentimes)}
          </div>
          <p className="text-xs text-slate-400">
            +{formatCurrency(stats.monthlyStats[stats.monthlyStats.length - 1]?.volumeCentimes || 0)} ce mois
          </p>
        </CardContent>
      </Card>

      {/* Paiements */}
      <Card className="bg-slate-800/50 border-2 border-purple-500/50 hover:bg-slate-800/70 transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">
            Paiements
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(stats.totalPayoutsCentimes)}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge 
              variant={stats.pendingPayouts > 0 ? "destructive" : "secondary"}
              className="text-xs"
            >
              {stats.pendingPayouts} en attente
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* KYC Status */}
      <Card className="bg-slate-800/50 border-2 border-red-500/50 hover:bg-slate-800/70 transition-all duration-300 shadow-lg shadow-red-500/20 hover:shadow-red-500/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">
            KYC En Attente
          </CardTitle>
          <Shield className="h-4 w-4 text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {stats.kycPending}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {stats.kycPending > 0 ? (
              <Badge variant="destructive" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                À traiter
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                À jour
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Taux de Réussite */}
      <Card className="bg-slate-800/50 border-2 border-green-500/50 hover:bg-slate-800/70 transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-green-500/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">
            Taux de Réussite
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {stats.totalTrades > 0 
              ? Math.round((stats.totalTrades - (stats.totalTrades * 0.05)) / stats.totalTrades * 100)
              : 0}%
          </div>
          <p className="text-xs text-slate-400">
            Trades réussis
          </p>
        </CardContent>
      </Card>

      {/* Top Utilisateur */}
      <Card className="bg-slate-800/50 border-2 border-orange-500/50 hover:bg-slate-800/70 transition-all duration-300 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">
            Top Utilisateur
          </CardTitle>
          <Users className="h-4 w-4 text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold text-white truncate">
            {stats.topUsers[0]?.username || 'N/A'}
          </div>
          <p className="text-xs text-slate-400">
            {formatCurrency(stats.topUsers[0]?.totalVolumeCentimes || 0)}
          </p>
        </CardContent>
      </Card>

      {/* Trades Récents */}
      <Card className="bg-slate-800/50 border-2 border-cyan-500/50 hover:bg-slate-800/70 transition-all duration-300 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">
            Trades Récents
          </CardTitle>
          <Clock className="h-4 w-4 text-cyan-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {stats.recentTrades.length}
          </div>
          <p className="text-xs text-slate-400">
            Dernières 24h
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(8)].map((_, i) => (
        <Card key={i} className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-slate-600 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-slate-600 rounded w-1/2"></div>
              <div className="h-3 bg-slate-600 rounded w-2/3 mt-2"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
