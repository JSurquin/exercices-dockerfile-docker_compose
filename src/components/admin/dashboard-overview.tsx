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
import { useLocale } from '@/components/providers/locale-provider';
import { ConvertedPrice } from '@/components/ui/converted-price';

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
    'paiement_en_cours': 'bg-orange-500',
    'payé': 'bg-emerald-500',
    'échoué': 'bg-red-500',
  };
  return colors[status as keyof typeof colors] || 'bg-gray-500';
};

export function DashboardOverview() {
  const { messages } = useLocale();
  const t = messages.adminNav.dashboardOverview;

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
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
        <Card className="bg-slate-800/50 border-slate-700 shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-base md:text-lg">
              <ChartBarIcon className="h-5 w-5 text-cyan-400" />
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
                    stroke={CHART_COLORS.orange} 
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.orange, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Répartition des statuts */}
        <Card className="bg-slate-800/50 border-slate-700 shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-base md:text-lg">
              <UsersIcon className="h-5 w-5 text-purple-400" />
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
                    fill={CHART_COLORS.orange} 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activité récente */}
      <Card className="bg-slate-800/50 border-slate-700 shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-base md:text-lg">
            <ClockIcon className="h-5 w-5 text-emerald-400" />
            {messages.adminDashboard.overview.recentActivity}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentTrades.slice(0, 5).map((trade) => (
              <div 
                key={trade.id} 
                className="flex flex-col gap-2 rounded-lg border border-slate-700 bg-slate-900/50 p-3 transition-all duration-300 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10 sm:flex-row sm:items-center sm:justify-between sm:p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-xs font-bold text-white">
                      U
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-white sm:text-base">User #{trade.userId.slice(0, 8)}</p>
                    <p className="text-xs text-slate-400 sm:text-sm">{trade.ticketId}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <p className="text-sm font-bold text-white sm:text-base">
                    <ConvertedPrice
                      usdCents={trade.netCentimes}
                      fromCurrency="USD"
                      showOriginal
                      className="text-white"
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
