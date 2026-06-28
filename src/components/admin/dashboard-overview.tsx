'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartBarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { queryKeys } from '@/lib/query-keys';
import { CHART_COLORS, RECHARTS_TOOLTIP_STYLE } from '@/lib/chart-colors';

const ADMIN_CHART_BRAND = CHART_COLORS.moonskin;
import { useLocale } from '@/components/providers/locale-provider';
import { adminGlassCard, adminIconAccent } from '@/lib/admin-ui';
import { cn } from '@/lib/utils';
interface AdminStats {
  recentTrades: any[];
  monthlyStats: any[];
}

export function DashboardOverview() {
  const { messages } = useLocale();
  const t = messages.adminNav.dashboardOverview;
  const brandChartColor = ADMIN_CHART_BRAND;

  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: queryKeys.adminStats,
    queryFn: async () => {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) throw new Error(t.loadError);
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-theme-accent border-t-transparent" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>{t.loadError}</p>
      </div>
    );
  }

  const volumeData = stats.monthlyStats.map(stat => ({
    date: new Date(stat.month).toLocaleDateString('fr-FR', { month: 'short' }),
    volume: stat.volumeCentimes,
  }));

  const statusData = [
    { status: t.statusPaid, count: stats.recentTrades.filter(tr => tr.status === 'payé').length, color: '#10B981' },
    { status: t.statusInProgress, count: stats.recentTrades.filter(tr => tr.status === 'paiement_en_cours').length, color: '#F59E0B' },
    { status: t.statusHold, count: stats.recentTrades.filter(tr => tr.status === 'en_trade_hold').length, color: '#EF4444' },
    { status: t.statusCreated, count: stats.recentTrades.filter(tr => tr.status === 'créé').length, color: '#3B82F6' },
  ];

  return (
    <div className="space-y-6">
      {/* Graphiques */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Graphique des volumes */}
        <Card className={cn(adminGlassCard, 'transition-all duration-300')}>
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2 text-base md:text-lg">
              <ChartBarIcon className={cn('h-5 w-5', adminIconAccent)} />
              {messages.adminDashboard.overview.volumeChart}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.slate700} />
                  <XAxis 
                    dataKey="date" 
                    stroke={CHART_COLORS.slate400}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke={CHART_COLORS.slate400}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={RECHARTS_TOOLTIP_STYLE}
                    labelStyle={{ color: CHART_COLORS.slate100 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="volume" 
                    stroke={brandChartColor} 
                    strokeWidth={2}
                    dot={{ fill: brandChartColor, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Répartition des statuts */}
        <Card className={cn(adminGlassCard, 'transition-all duration-300')}>
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2 text-base md:text-lg">
              <UsersIcon className={cn('h-5 w-5', adminIconAccent)} />
              {messages.adminDashboard.overview.tradeDistribution}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.slate700} />
                  <XAxis 
                    dataKey="status" 
                    stroke={CHART_COLORS.slate400}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke={CHART_COLORS.slate400}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={RECHARTS_TOOLTIP_STYLE}
                    labelStyle={{ color: CHART_COLORS.slate100 }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill={brandChartColor} 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
