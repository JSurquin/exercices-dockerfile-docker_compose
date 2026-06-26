'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { ADMIN_SKINPLACE_REFETCH_INTERVAL_MS } from '@/lib/admin-constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Wallet,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Activity,
} from 'lucide-react';
import { useLocale } from '@/components/providers/locale-provider';
import { formatCentsToCurrency } from '@/lib/currency-converter';
import {
  adminBadgeStatus,
  adminBtnOutline,
  adminGlassCard,
  adminIconAccentLg,
  adminStatCard,
} from '@/lib/admin-ui';
import { cn } from '@/lib/utils';

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

type SyncFeedback = 'idle' | 'syncing' | 'success' | 'error';

function MetricTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className={cn(adminStatCard, 'p-4')}>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export function AdminSkinplaceMetrics() {
  const { messages } = useLocale();
  const t = messages.adminNav.skinplaceMetrics;
  const queryClient = useQueryClient();
  const [syncFeedback, setSyncFeedback] = useState<SyncFeedback>('idle');

  const { data: platformConfig } = useQuery({
    queryKey: queryKeys.adminPlatformConfig,
    queryFn: () => fetch('/api/admin/platform-config').then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const skinplaceDashboardUrl: string =
    platformConfig?.config?.skinplaceDashboardUrl ?? 'https://skin.place';

  const {
    data: metrics,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: queryKeys.skinplaceBalance,
    queryFn: async (): Promise<SkinplaceMetrics> => {
      const [balanceRes, historyRes, holdRes] = await Promise.all([
        fetch('/api/skinplace/balance').catch(() => null),
        fetch('/api/skinplace/history').catch(() => null),
        fetch('/api/skinplace/hold').catch(() => null),
      ]);

      const skinplaceMetrics: SkinplaceMetrics = {
        apiStatus: 'offline',
        recentTransactions: 0,
        lastSync: new Date().toISOString(),
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
            pending: orders.filter((o: { status: string }) => o.status === 'pending').length,
            completed: orders.filter((o: { status: string }) => o.status === 'completed').length,
          };
        }
      }

      if (!balanceRes?.ok && !historyRes?.ok && !holdRes?.ok) {
        skinplaceMetrics.apiStatus = 'error';
      }

      return skinplaceMetrics;
    },
    refetchInterval: ADMIN_SKINPLACE_REFETCH_INTERVAL_MS,
  });

  const error: string | null = queryError
    ? queryError instanceof Error ? queryError.message : t.fetchError
    : null;

  const formatEuro = (centimes: number) => formatCentsToCurrency(Math.round(centimes), 'EUR');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-theme-success';
      case 'offline':
        return 'text-muted-foreground';
      case 'error':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-theme-success" />;
      case 'offline':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online':
        return t.statusOnline;
      case 'offline':
        return t.statusOffline;
      case 'error':
        return t.statusError;
      default:
        return t.statusOffline;
    }
  };

  const getStatusOperationalLabel = (status: string) => {
    switch (status) {
      case 'online':
        return t.statusOperational;
      case 'offline':
        return t.statusUnavailable;
      case 'error':
        return t.statusError;
      default:
        return t.statusUnavailable;
    }
  };

  const handleRefresh = async () => {
    setSyncFeedback('syncing');
    try {
      await queryClient.refetchQueries({ queryKey: queryKeys.skinplaceBalance });
      setSyncFeedback('success');
      window.setTimeout(() => setSyncFeedback('idle'), 2500);
    } catch {
      setSyncFeedback('error');
      window.setTimeout(() => setSyncFeedback('idle'), 3000);
    }
  };

  const isSyncing = syncFeedback === 'syncing';

  if (isLoading) {
    return (
      <Card className={adminGlassCard}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Wallet className={adminIconAccentLg} />
              {t.title}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
          <CardDescription className="text-muted-foreground">{t.loadingDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={adminGlassCard}>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-foreground flex items-center gap-2">
            <Wallet className={adminIconAccentLg} />
            {t.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusIcon(metrics?.apiStatus || 'offline')}
            <span className={`text-sm font-medium ${getStatusColor(metrics?.apiStatus || 'offline')}`}>
              {getStatusLabel(metrics?.apiStatus || 'offline')}
            </span>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isSyncing}
              className={cn(
                adminBtnOutline,
                syncFeedback === 'success' && 'border-theme-success/40 text-theme-success',
                syncFeedback === 'error' && 'border-destructive/40 text-destructive'
              )}
            >
              <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
              <span className="sr-only">{t.syncing}</span>
            </Button>
          </div>
        </div>
        <CardDescription className="text-muted-foreground">
          {syncFeedback === 'success'
            ? t.syncSuccess
            : syncFeedback === 'error'
              ? t.syncError
              : isSyncing
                ? t.syncing
                : t.realtimeDesc}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-6">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-destructive text-sm">{error}</p>
            <Button onClick={handleRefresh} variant="outline" size="sm" className={cn('mt-3', adminBtnOutline)}>
              {t.retry}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {metrics?.balance && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricTile
                  label={t.totalBalance}
                  value={formatEuro(metrics.balance.balance ?? 0)}
                  sub={t.balanceAvailable}
                />
                <MetricTile
                  label={t.holdBalance}
                  value={formatEuro(metrics.balance.pending_balance ?? 0)}
                  sub={t.holdBalanceSub}
                />
                <MetricTile
                  label={t.deposits}
                  value={formatEuro(metrics.balance.available_balance ?? 0)}
                  sub={`${t.depositsUpdated} ${new Date(metrics.balance.last_updated).toLocaleString('fr-FR')}`}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricTile
                label={t.recentTransactions}
                value={String(metrics?.recentTransactions || 0)}
                sub={t.recentTransactionsSub}
              />
              <div className={cn(adminStatCard, 'p-4')}>
                <p className="text-sm text-muted-foreground mb-2">{t.apiStatus}</p>
                <div className="flex items-center gap-2">
                  {getStatusIcon(metrics?.apiStatus || 'offline')}
                  <span className={`text-sm font-medium ${getStatusColor(metrics?.apiStatus || 'offline')}`}>
                    {getStatusOperationalLabel(metrics?.apiStatus || 'offline')}
                  </span>
                </div>
              </div>
            </div>

            {metrics?.holdOrders && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">{t.holdOrdersTitle}</h4>
                <div className="grid grid-cols-3 gap-4">
                  <MetricTile label={t.holdTotal} value={String(metrics.holdOrders.total)} />
                  <MetricTile label={t.holdPending} value={String(metrics.holdOrders.pending)} />
                  <MetricTile label={t.holdCompleted} value={String(metrics.holdOrders.completed)} />
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-4 border-t border-border/40">
              <Badge variant="outline" className={adminBadgeStatus}>
                <Clock className="h-3 w-3 mr-1" />
                {t.lastSync} {new Date(metrics?.lastSync || '').toLocaleTimeString('fr-FR')}
              </Badge>

              {metrics?.apiStatus === 'online' && (
                <Badge variant="outline" className={cn(adminBadgeStatus, 'admin-badge-status--success')}>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {t.apiFunctional}
                </Badge>
              )}

              {metrics?.apiStatus === 'error' && (
                <Badge variant="outline" className={cn(adminBadgeStatus, 'admin-badge-status--danger')}>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {t.connectionIssue}
                </Badge>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" asChild className={adminBtnOutline}>
                <a href={skinplaceDashboardUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t.dashboardLink}
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
