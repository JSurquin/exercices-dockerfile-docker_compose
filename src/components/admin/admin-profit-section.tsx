'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLocale } from '@/components/providers/locale-provider';
import { queryKeys } from '@/lib/query-keys';
import { ConvertedPrice } from '@/components/ui/converted-price';
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
import type { AdminProfitMetrics } from '@/lib/admin-profit';
import { TrendingUp, AlertTriangle, Percent, Calendar, CalendarDays } from 'lucide-react';

function formatTradeDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function ProfitStatCard({
  title,
  icon: Icon,
  children,
  footer,
}: {
  title: string;
  icon: typeof TrendingUp;
  children: React.ReactNode;
  footer?: React.ReactNode;
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

export function AdminProfitSection() {
  const { messages } = useLocale();
  const t = messages.adminNav.profitSection;

  const { data, isLoading, error } = useQuery<AdminProfitMetrics>({
    queryKey: queryKeys.adminProfit,
    queryFn: async () => {
      const response = await fetch('/api/admin/profit');
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || t.loadError);
      }
      return payload;
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Card className={adminGlassCard}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
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

  if (!data) return null;

  return (
    <div className="space-y-4" data-testid="admin-profit-section">
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className={cn('h-5 w-5', adminIconAccent)} />
          {t.title}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ProfitStatCard title={t.totalProfit} icon={TrendingUp}>
          <ConvertedPrice
            usdCents={data.totalProfitCentimes}
            fromCurrency="USD"
            className="text-2xl font-bold text-foreground"
          />
        </ProfitStatCard>

        <ProfitStatCard title={t.todayProfit} icon={Calendar}>
          <ConvertedPrice
            usdCents={data.todayProfitCentimes}
            fromCurrency="USD"
            className="text-2xl font-bold text-foreground"
          />
        </ProfitStatCard>

        <ProfitStatCard title={t.monthProfit} icon={CalendarDays}>
          <ConvertedPrice
            usdCents={data.monthProfitCentimes}
            fromCurrency="USD"
            className="text-2xl font-bold text-foreground"
          />
        </ProfitStatCard>

        <ProfitStatCard
          title={t.avgMargin}
          icon={Percent}
          footer={
            <Badge variant="outline" className={adminBadgeStatus}>
              {t.matchedTrades
                .replace('{matched}', String(data.matchedTrades))
                .replace('{total}', String(data.totalTrades))}
            </Badge>
          }
        >
          {data.avgMarginPercent}%
        </ProfitStatCard>
      </div>

      <Card className={adminGlassCard}>
        <CardHeader>
          <CardTitle className="text-foreground text-base md:text-lg">{t.recentTradesTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.recentTradesSub}</p>
        </CardHeader>
        <CardContent>
          {data.recentTrades.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">{t.recentTradesEmpty}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className={adminTableRow}>
                  <TableHead className={adminTableHead}>{t.colUser}</TableHead>
                  <TableHead className={adminTableHead}>{t.colPaid}</TableHead>
                  <TableHead className={adminTableHead}>{t.colBonus}</TableHead>
                  <TableHead className={adminTableHead}>{t.colSkinplace}</TableHead>
                  <TableHead className={adminTableHead}>{t.colProfit}</TableHead>
                  <TableHead className={adminTableHead}>{t.colMargin}</TableHead>
                  <TableHead className={adminTableHead}>{t.colDate}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentTrades.map((trade) => (
                  <TableRow key={trade.tradeId} className={adminTableRow}>
                    <TableCell className={adminTableCell}>{trade.userName}</TableCell>
                    <TableCell className={adminTableCell}>
                      <ConvertedPrice
                        usdCents={trade.paidToUserCentimes}
                        fromCurrency="USD"
                        className="text-foreground"
                      />
                    </TableCell>
                    <TableCell className={adminTableCell}>
                      {trade.bonusCentimes > 0 ? (
                        <ConvertedPrice
                          usdCents={trade.bonusCentimes}
                          fromCurrency="USD"
                          className="text-amber-500"
                        />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className={adminTableCell}>
                      <ConvertedPrice
                        usdCents={trade.skinplaceCentimes}
                        fromCurrency="USD"
                        className="text-foreground"
                      />
                    </TableCell>
                    <TableCell className={adminTableCell}>
                      <ConvertedPrice
                        usdCents={trade.profitCentimes}
                        fromCurrency="USD"
                        className={cn(
                          'font-medium',
                          trade.profitCentimes >= 0 ? 'text-emerald-500' : 'text-destructive',
                        )}
                      />
                    </TableCell>
                    <TableCell className={adminTableCell}>{trade.marginPercent}%</TableCell>
                    <TableCell className={cn(adminTableCell, 'text-muted-foreground text-sm')}>
                      {formatTradeDate(trade.createdAt)}
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
