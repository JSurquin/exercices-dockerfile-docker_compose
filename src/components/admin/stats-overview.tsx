'use client';

import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLocale } from '@/components/providers/locale-provider';
import {
  Users,
  ShoppingCart,
  Euro,
  TrendingUp,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react';
import { AdminStats, Trade } from '@/lib/types';
import { queryKeys } from '@/lib/query-keys';
import { ConvertedPrice } from '@/components/ui/converted-price';
import { formatCentsToCurrency } from '@/lib/currency-converter';
import {
  adminBadgeStatus,
  adminGlassCard,
  adminIconAccent,
  adminStatCard,
  adminTableCell,
  adminTableHead,
  adminTableRow,
} from '@/lib/admin-ui';
import { cn } from '@/lib/utils';
import { AdminUserLink } from '@/components/admin/admin-user-link';

function StatCard({
  title,
  icon: Icon,
  children,
  footer,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card className={adminStatCard}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={adminIconAccent} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{children}</div>
        {footer && <div className="mt-1">{footer}</div>}
      </CardContent>
    </Card>
  );
}

function formatTradeDate(date: Date | string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function getStatusBadgeClass(status: Trade['status']) {
  const colors: Record<Trade['status'], string> = {
    créé: 'admin-badge-status--pending',
    accepté_par_bot: 'admin-badge-status--pending',
    en_trade_hold: 'admin-badge-status--pending',
    disponible: 'admin-badge-status--success',
    paiement_en_cours: 'admin-badge-status--pending',
    payé: 'admin-badge-status--success',
    échoué: 'admin-badge-status--danger',
    annulé: 'admin-badge-status--danger',
  };
  return cn(adminBadgeStatus, colors[status] ?? '');
}

export function AdminStatsOverview() {
  const { messages } = useLocale();
  const t = messages.adminNav.statsOverview;

  const { data: stats, isLoading, error } = useQuery<AdminStats>({
    queryKey: queryKeys.adminStats,
    queryFn: async () => {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || messages.admin.errors.loadingStats);
      }
      return data;
    },
  });

  const formatEurAmount = (centimes: number) => formatCentsToCurrency(centimes, 'EUR');

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  if (isLoading) {
    return <StatsSkeleton />;
  }

  if (error) {
    return (
      <Card className={cn(adminStatCard, 'border-destructive/40')}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>
              {t.errorPrefix} {error.message}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const currentMonthStats = stats.monthlyStats[stats.monthlyStats.length - 1];
  const tradesThisMonth = currentMonthStats?.trades || 0;
  const monthlyVolumeCents = currentMonthStats?.volumeCentimes || 0;
  const volumeMonthParts = t.totalVolumeMonth.split('{amount}');

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t.totalUsers}
          icon={Users}
          footer={
            <p className="text-xs text-muted-foreground">
              {t.totalUsersMonth.replace(
                '{count}',
                String(currentMonthStats?.newUsers || 0)
              )}
            </p>
          }
        >
          {formatNumber(stats.totalUsers)}
        </StatCard>

        <StatCard
          title={t.totalTrades}
          icon={ShoppingCart}
          footer={
            <Badge variant="outline" className={adminBadgeStatus}>
              {t.tradesThisMonth.replace('{count}', String(tradesThisMonth))}
            </Badge>
          }
        >
          {formatNumber(stats.totalTrades)}
        </StatCard>

        <StatCard
          title={t.totalVolume}
          icon={Euro}
          footer={
            <p className="text-xs text-muted-foreground inline-flex items-center gap-0.5 flex-wrap">
              {volumeMonthParts[0]}
              <ConvertedPrice
                usdCents={monthlyVolumeCents}
                fromCurrency="USD"
                className="text-xs text-muted-foreground"
              />
              {volumeMonthParts[1]}
            </p>
          }
        >
          <ConvertedPrice
            usdCents={stats.totalVolumeCentimes}
            fromCurrency="USD"
            className="text-2xl font-bold text-foreground"
          />
        </StatCard>

        <StatCard
          title={t.payments}
          icon={TrendingUp}
          footer={
            <Badge
              variant="outline"
              className={cn(
                adminBadgeStatus,
                stats.pendingPayouts > 0 && 'admin-badge-status--pending'
              )}
            >
              {t.pendingPayouts.replace('{count}', String(stats.pendingPayouts))}
            </Badge>
          }
        >
          {formatEurAmount(stats.totalPayoutsCentimes)}
        </StatCard>

        <StatCard
          title={t.kycPending}
          icon={Shield}
          footer={
            stats.kycPending > 0 ? (
              <Badge variant="outline" className={cn(adminBadgeStatus, 'admin-badge-status--pending')}>
                <Clock className="h-3 w-3 mr-1" />
                {t.kycToProcess}
              </Badge>
            ) : (
              <Badge variant="outline" className={cn(adminBadgeStatus, 'admin-badge-status--success')}>
                <CheckCircle className="h-3 w-3 mr-1" />
                {t.kycUpToDate}
              </Badge>
            )
          }
        >
          {stats.kycPending}
        </StatCard>

        <StatCard
          title={t.successRate}
          icon={CheckCircle}
          footer={<p className="text-xs text-muted-foreground">{t.successRateSub}</p>}
        >
          {stats.totalTrades > 0
            ? Math.round(((stats.totalTrades - (stats.failedTrades ?? 0)) / stats.totalTrades) * 100)
            : 0}
          %
        </StatCard>

        <StatCard
          title={t.topUser}
          icon={Users}
          footer={
            <ConvertedPrice
              usdCents={stats.topUsers[0]?.totalVolumeCentimes || 0}
              fromCurrency="USD"
              className="text-xs text-muted-foreground"
            />
          }
        >
          <span className="text-lg truncate block">{stats.topUsers[0]?.username || 'N/A'}</span>
        </StatCard>
      </div>

      <Card className={adminGlassCard}>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2 text-base md:text-lg">
            <Clock className={cn('h-5 w-5', adminIconAccent)} />
            {t.recentTrades}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t.recentTradesSub}</p>
        </CardHeader>
        <CardContent>
          {stats.recentTrades.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">{t.recentTradesEmpty}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className={adminTableRow}>
                  <TableHead className={adminTableHead}>{t.recentTradesColUser}</TableHead>
                  <TableHead className={adminTableHead}>{t.recentTradesColAmount}</TableHead>
                  <TableHead className={adminTableHead}>{t.recentTradesColStatus}</TableHead>
                  <TableHead className={adminTableHead}>{t.recentTradesColDate}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentTrades.slice(0, 5).map((trade) => (
                  <TableRow key={trade.id} className={adminTableRow}>
                    <TableCell className={adminTableCell}>
                      <AdminUserLink
                        userId={trade.userId}
                        name={trade.userName || `User #${trade.userId.slice(0, 8)}`}
                        avatarSize="sm"
                      />
                    </TableCell>
                    <TableCell className={adminTableCell}>
                      <ConvertedPrice
                        usdCents={trade.netCentimes}
                        fromCurrency="USD"
                        className="text-foreground"
                      />
                    </TableCell>
                    <TableCell className={adminTableCell}>
                      <Badge variant="outline" className={getStatusBadgeClass(trade.status)}>
                        {trade.status}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn(adminTableCell, 'text-muted-foreground text-sm')}>
                      {formatTradeDate(trade.créédLe)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(7)].map((_, i) => (
        <Card key={i} className={adminStatCard}>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-8 bg-muted rounded w-1/2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
