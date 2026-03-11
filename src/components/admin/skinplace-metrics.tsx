'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Wallet, 
  TrendingUp, 
  Clock, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Activity
} from 'lucide-react';
import { useLocale } from '@/components/providers/locale-provider';

interface SkinplaceMetrics {
  balance?: {
    balance: number;
    currency: string;
    available_balance: number;
    pending_balance: number;
    last_updated: string;
  };
  recentTransactions: number;
  holdOrders?: {
    total: number;
    pending: number;
    completed: number;
  };
  apiStatus: 'online' | 'offline' | 'error';
  lastSync: string;
}

export function AdminSkinplaceMetrics() {
  const { messages } = useLocale();
  const queryClient = useQueryClient();

  const { data: metrics, isLoading, error: queryError } = useQuery({
    queryKey: queryKeys.skinplaceBalance,
    queryFn: async (): Promise<SkinplaceMetrics> => {
      const [balanceRes, historyRes, holdRes] = await Promise.all([
        fetch('/api/skinplace/balance').catch(() => null),
        fetch('/api/skinplace/history').catch(() => null),
        fetch('/api/skinplace/hold').catch(() => null)
      ]);

      const skinplaceMetrics: SkinplaceMetrics = {
        apiStatus: 'offline',
        recentTransactions: 0,
        lastSync: new Date().toISOString()
      };

      if (balanceRes?.ok) {
        const balanceData = await balanceRes.json();
        if (balanceData.success) {
          skinplaceMetrics.balance = balanceData.data;
          skinplaceMetrics.apiStatus = 'online';
        }
      }

      if (historyRes?.ok) {
        const historyData = await historyRes.json();
        if (historyData.success && historyData.data?.transactions) {
          skinplaceMetrics.recentTransactions = historyData.data.transactions.length;
        }
      }

      if (holdRes?.ok) {
        const holdData = await holdRes.json();
        if (holdData.success && holdData.data?.orders) {
          const orders = holdData.data.orders;
          skinplaceMetrics.holdOrders = {
            total: orders.length,
            pending: orders.filter((o: any) => o.status === 'pending').length,
            completed: orders.filter((o: any) => o.status === 'completed').length
          };
        }
      }

      if (!balanceRes?.ok && !historyRes?.ok && !holdRes?.ok) {
        skinplaceMetrics.apiStatus = 'error';
      }

      return skinplaceMetrics;
    },
    refetchInterval: 60_000
  });

  const error: string | null = queryError ? (queryError instanceof Error ? queryError.message : 'Erreur lors de la récupération des métriques Skinplace') : null;
  const loading = isLoading;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Métriques Skinplace
            </CardTitle>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 bg-slate-600" />
              <Skeleton className="h-4 w-16 bg-slate-600" />
              <Skeleton className="h-8 w-8 bg-slate-600" />
            </div>
          </div>
          <CardDescription className="text-slate-400">
            Chargement des données Skinplace...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Métriques principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="text-center p-4 bg-slate-900/50 rounded-lg">
                  <Skeleton className="h-4 w-24 bg-slate-600 mx-auto mb-2" />
                  <Skeleton className="h-8 w-20 bg-slate-600 mx-auto mb-1" />
                  <Skeleton className="h-3 w-16 bg-slate-600 mx-auto" />
                </div>
              ))}
            </div>

            {/* Hold Orders */}
            <div>
              <Skeleton className="h-5 w-24 bg-slate-600 mb-3" />
              <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="text-center p-3 bg-slate-900/30 rounded">
                    <Skeleton className="h-6 w-8 bg-slate-600 mx-auto mb-1" />
                    <Skeleton className="h-3 w-12 bg-slate-600 mx-auto" />
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-700">
              <Skeleton className="h-6 w-32 bg-slate-600" />
              <Skeleton className="h-6 w-24 bg-slate-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Métriques Skinplace
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusIcon(metrics?.apiStatus || 'offline')}
            <span className={`text-sm font-medium ${getStatusColor(metrics?.apiStatus || 'offline')}`}>
              {metrics?.apiStatus === 'online' ? 'En ligne' : 
               metrics?.apiStatus === 'offline' ? 'Hors ligne' : 'Erreur'}
            </span>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.skinplaceBalance })} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription className="text-slate-400">
          Intégration API Skinplace en temps réel
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-6">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-400 text-sm">{error}</p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.skinplaceBalance })} variant="outline" size="sm" className="mt-3">
              Réessayer
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Solde */}
            {metrics?.balance && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-slate-900/50 rounded-lg border-l-4 border-green-500">
                  <p className="text-sm text-slate-400 mb-1">Solde Total</p>
                  <p className="text-2xl font-bold text-green-400">
                    {metrics.balance.balance?.toFixed(2) || '0.00'} €
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Disponible</p>
                </div>

                <div className="text-center p-4 bg-slate-900/50 rounded-lg border-l-4 border-yellow-500">
                  <p className="text-sm text-slate-400 mb-1">En Hold</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {metrics.balance.pending_balance?.toFixed(2) || '0.00'} €
                  </p>
                  <p className="text-xs text-slate-500 mt-1">En attente</p>
                </div>

                <div className="text-center p-4 bg-slate-900/50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm text-slate-400 mb-1">Dépôts</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {metrics.balance.available_balance?.toFixed(2) || '0.00'} €
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    MAJ: {new Date(metrics.balance.last_updated).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            )}

            {/* Métriques supplémentaires */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-1">Transactions Récentes</p>
                <p className="text-2xl font-bold text-slate-100">
                  {metrics?.recentTransactions || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">Dernières 24h</p>
              </div>

              <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-1">Statut API</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  {getStatusIcon(metrics?.apiStatus || 'offline')}
                  <span className={`text-sm font-medium ${getStatusColor(metrics?.apiStatus || 'offline')}`}>
                    {metrics?.apiStatus === 'online' ? 'Opérationnel' : 
                     metrics?.apiStatus === 'offline' ? 'Indisponible' : 'Erreur'}
                  </span>
                </div>
              </div>
            </div>

            {/* Hold Orders */}
            {metrics?.holdOrders && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3">Hold Orders</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-slate-900/30 rounded">
                    <p className="text-lg font-bold text-slate-100">{metrics.holdOrders.total}</p>
                    <p className="text-xs text-slate-400">Total</p>
                  </div>
                  <div className="text-center p-3 bg-slate-900/30 rounded">
                    <p className="text-lg font-bold text-yellow-400">{metrics.holdOrders.pending}</p>
                    <p className="text-xs text-slate-400">En attente</p>
                  </div>
                  <div className="text-center p-3 bg-slate-900/30 rounded">
                    <p className="text-lg font-bold text-green-400">{metrics.holdOrders.completed}</p>
                    <p className="text-xs text-slate-400">Terminés</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions rapides */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-700">
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Dernière sync: {new Date(metrics?.lastSync || '').toLocaleTimeString('fr-FR')}
              </Badge>
              
              {metrics?.apiStatus === 'online' && (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  API fonctionnelle
                </Badge>
              )}
              
              {metrics?.apiStatus === 'error' && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Problème de connexion
                </Badge>
              )}
            </div>

            {/* Liens utiles */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" asChild>
                <a href="https://skin.place" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Dashboard Skinplace
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
