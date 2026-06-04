'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ChartBarIcon,
  UsersIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { queryKeys } from '@/lib/query-keys';
import { CHART_COLORS, RECHARTS_TOOLTIP_STYLE } from '@/lib/chart-colors';

const ADMIN_CHART_BRAND = CHART_COLORS.moonskin;
import { useLocale } from '@/components/providers/locale-provider';
import { ConvertedPrice } from '@/components/ui/converted-price';
import { adminGlassCard, adminIconAccent, panelListRow } from '@/lib/admin-ui';
import { cn } from '@/lib/utils';

interface AdminStats {
  recentTrades: any[];
  monthlyStats: any[];
}

const getStatusColor = (status: string) => {
  const colors = {
    'créé': 'bg-blue-500',
    'accepté_par_bot': 'bg-indigo-500',
    'en_trade_hold': 'bg-yellow-500',
    'disponible': 'bg-green-500',
    'paiement_en_cours': 'bg-theme-accent/80',
    'payé': 'bg-emerald-500',
    'échoué': 'bg-red-500',
  };
  return colors[status as keyof typeof colors] || 'bg-gray-500';
};

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

      {/* Activité récente */}
      <Card className={cn(adminGlassCard, 'transition-all duration-300')}>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2 text-base md:text-lg">
            <ClockIcon className={cn('h-5 w-5', adminIconAccent)} />
            {messages.adminDashboard.overview.recentActivity}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentTrades.slice(0, 5).map((trade) => (
              <div 
                key={trade.id} 
                className={cn(panelListRow, 'sm:flex-row sm:items-center sm:justify-between')}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                    <AvatarImage src={trade.userAvatar || ''} />
                    <AvatarFallback className="bg-cta-gradient-br text-xs font-bold text-white">
                      {trade.userName ? trade.userName.slice(0, 2).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground sm:text-base">
                      {trade.userName || `User #${trade.userId.slice(0, 8)}`}
                    </p>
                    <p className="text-xs text-muted-foreground sm:text-sm">{trade.ticketId}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <p className="text-sm font-bold text-foreground sm:text-base">
                    <ConvertedPrice
                      usdCents={trade.netCentimes}
                      fromCurrency="USD"
                      showOriginal
                      className="text-foreground"
                    />
                  </p>
                  <Badge className={`${getStatusColor(trade.status)} text-white text-xs`}>
                    {trade.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
