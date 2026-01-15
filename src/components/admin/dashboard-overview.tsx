'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ChartBarIcon,
  UsersIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface AdminStats {
  recentTrades: any[];
  monthlyStats: any[];
}

const formatPrice = (centimes: number) => {
  return (centimes / 100).toFixed(2) + '€';
};

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
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>Erreur lors du chargement des statistiques</p>
      </div>
    );
  }

  // Préparer les données pour le graphique de volume
  const volumeData = stats.monthlyStats.map(stat => ({
    date: new Date(stat.month).toLocaleDateString('fr-FR', { month: 'short' }),
    volume: stat.volumeCentimes,
  }));

  // Préparer les données pour le graphique de statuts
  const statusData = [
    { status: 'Payés', count: stats.recentTrades.filter(t => t.status === 'payé').length, color: '#10B981' },
    { status: 'En cours', count: stats.recentTrades.filter(t => t.status === 'paiement_en_cours').length, color: '#F59E0B' },
    { status: 'Hold', count: stats.recentTrades.filter(t => t.status === 'en_trade_hold').length, color: '#EF4444' },
    { status: 'Créés', count: stats.recentTrades.filter(t => t.status === 'créé').length, color: '#3B82F6' }
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
              Volume des Trades (7 derniers jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="volume" 
                    stroke="#F97316" 
                    strokeWidth={2}
                    dot={{ fill: '#F97316', strokeWidth: 2, r: 4 }}
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
              Répartition des Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="status" 
                    stroke="#9CA3AF"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#F97316" 
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
            Activité Récente
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
                  <p className="text-sm font-bold text-white sm:text-base">{formatPrice(trade.netCentimes)}</p>
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

