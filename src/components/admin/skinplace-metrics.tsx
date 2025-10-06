'use client';

import { useState, useEffect } from 'react';
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

interface SkinplaceMetrics {
  balance?: {
    balance: number;
    currency: string;
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
  const [metrics, setMetrics] = useState<SkinplaceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer les données Skinplace
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

      // Balance
      if (balanceRes?.ok) {
        const balanceData = await balanceRes.json();
        if (balanceData.success) {
          skinplaceMetrics.balance = balanceData.data;
          skinplaceMetrics.apiStatus = 'online';
        }
      }

      // Historique récent
      if (historyRes?.ok) {
        const historyData = await historyRes.json();
        if (historyData.success && historyData.data?.transactions) {
          skinplaceMetrics.recentTransactions = historyData.data.transactions.length;
        }
      }

      // Hold orders
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

      // Si aucune API n'a répondu, marquer comme erreur
      if (!balanceRes?.ok && !historyRes?.ok && !holdRes?.ok) {
        skinplaceMetrics.apiStatus = 'error';
      }

      setMetrics(skinplaceMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération des métriques Skinplace');
      setMetrics({
        apiStatus: 'error',
        recentTransactions: 0,
        lastSync: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Refresh toutes les minutes
    return () => clearInterval(interval);
  }, []);

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
            <Button onClick={fetchMetrics} variant="outline" size="sm">
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
            <Button onClick={fetchMetrics} variant="outline" size="sm" className="mt-3">
              Réessayer
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Solde */}
            {metrics?.balance && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-sm text-slate-400 mb-1">Solde Disponible</p>
                  <p className="text-2xl font-bold text-slate-100">
                    {metrics.balance.balance.toFixed(2)} {metrics.balance.currency}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    MAJ: {new Date(metrics.balance.last_updated).toLocaleString('fr-FR')}
                  </p>
                </div>

                <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-sm text-slate-400 mb-1">Transactions Récentes</p>
                  <p className="text-2xl font-bold text-slate-100">
                    {metrics.recentTransactions}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Dernières 24h</p>
                </div>

                <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-sm text-slate-400 mb-1">Statut API</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {getStatusIcon(metrics.apiStatus)}
                    <span className={`text-sm font-medium ${getStatusColor(metrics.apiStatus)}`}>
                      {metrics.apiStatus === 'online' ? 'Opérationnel' : 
                       metrics.apiStatus === 'offline' ? 'Indisponible' : 'Erreur'}
                    </span>
                  </div>
                </div>
              </div>
            )}

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
                <a href="https://skinplace.com" target="_blank" rel="noopener noreferrer">
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
