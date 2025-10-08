'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocale } from '@/components/providers/locale-provider';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalTrades: number;
    totalVolumeCents: number;
    totalPayouts: number;
    pendingKyc: number;
    activeGiveaways: number;
    recentUsers: number;
    recentTrades: number;
    userGrowth: number;
    tradeGrowth: number;
    volumeGrowth: number;
  };
  charts: {
    dailyVolume: Array<{ date: string; volume: number; trades: number }>;
    dailyUsers: Array<{ date: string; users: number }>;
    tradeStatus: Array<{ status: string; count: number; percentage: number }>;
    paymentMethods: Array<{ type: string; count: number }>;
  };
  topUsers: Array<{ id: string; name: string; volume: number; trades: number }>;
  skinplace: any;
  period: number;
  generatedAt: string;
}

interface MetricsData {
  realtime: {
    activeSessions: number;
    pendingTrades: number;
    processingPayouts: number;
    failedPayouts: number;
    pendingKyc: number;
    rejectedKyc: number;
  };
  last24h: {
    trades: number;
    users: number;
    volume: number;
  };
  last7d: {
    trades: number;
    users: number;
    volume: number;
  };
  hourly: Array<{ hour: string; trades: number; volume: number; users: number }>;
  skinplace: any;
  alerts: Array<{ type: string; message: string; priority: string }>;
  timestamp: string;
}

// Composant pour graphique en barres horizontal (style RosenCharts)
function HorizontalBarChart({ 
  data, 
  width = 400, 
  height = 300, 
  title 
}: { 
  data: Array<{ label: string; value: number; color?: string }>; 
  width?: number; 
  height?: number; 
  title: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 100 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 0])
      .range([0, innerWidth]);

    const yScale = d3.scaleBand()
      .domain(data.map(d => d.label))
      .range([0, innerHeight])
      .padding(0.1);

    // Barres
    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => yScale(d.label) || 0)
      .attr('width', 0)
      .attr('height', yScale.bandwidth())
      .attr('fill', d => d.color || '#f97316')
      .attr('rx', 4)
      .transition()
      .duration(800)
      .attr('width', d => xScale(d.value));

    // Labels des valeurs
    g.selectAll('.value-label')
      .data(data)
      .enter().append('text')
      .attr('class', 'value-label')
      .attr('x', d => xScale(d.value) + 5)
      .attr('y', d => (yScale(d.label) || 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('fill', '#e2e8f0')
      .text(d => d.value.toLocaleString());

    // Axe Y (labels)
    g.append('g')
      .selectAll('.y-label')
      .data(data)
      .enter().append('text')
      .attr('class', 'y-label')
      .attr('x', -10)
      .attr('y', d => (yScale(d.label) || 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('text-anchor', 'end')
      .style('font-size', '12px')
      .style('fill', '#cbd5e1')
      .text(d => d.label);

  }, [data, width, height]);

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">{title}</h3>
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
    </div>
  );
}

// Composant pour graphique en aires (style RosenCharts)
function AreaChart({ 
  data, 
  width = 600, 
  height = 300, 
  title,
  valueKey = 'value',
  dateKey = 'date'
}: { 
  data: Array<any>; 
  width?: number; 
  height?: number; 
  title: string;
  valueKey?: string;
  dateKey?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
      .domain(data.map(d => d[dateKey]))
      .range([0, innerWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d[valueKey]) || 0])
      .range([innerHeight, 0]);

    // Gradient pour l'aire
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', innerHeight)
      .attr('x2', 0).attr('y2', 0);

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#f97316')
      .attr('stop-opacity', 0.1);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#f97316')
      .attr('stop-opacity', 0.8);

    // Ligne
    const line = d3.line<any>()
      .x(d => (xScale(d[dateKey]) || 0) + xScale.bandwidth() / 2)
      .y(d => yScale(d[valueKey]))
      .curve(d3.curveCardinal);

    // Aire
    const area = d3.area<any>()
      .x(d => (xScale(d[dateKey]) || 0) + xScale.bandwidth() / 2)
      .y0(innerHeight)
      .y1(d => yScale(d[valueKey]))
      .curve(d3.curveCardinal);

    // Dessiner l'aire
    g.append('path')
      .datum(data)
      .attr('fill', 'url(#area-gradient)')
      .attr('d', area);

    // Dessiner la ligne
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#f97316')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Points
    g.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => (xScale(d[dateKey]) || 0) + xScale.bandwidth() / 2)
      .attr('cy', d => yScale(d[valueKey]))
      .attr('r', 0)
      .attr('fill', '#f97316')
      .transition()
      .duration(800)
      .attr('r', 4);

    // Axe X
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('fill', '#cbd5e1')
      .style('font-size', '12px');

    // Axe Y
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .selectAll('text')
      .style('fill', '#cbd5e1')
      .style('font-size', '12px');

    // Styling des axes
    g.selectAll('.domain, .tick line')
      .style('stroke', '#475569');

  }, [data, width, height, valueKey, dateKey]);

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">{title}</h3>
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
    </div>
  );
}

// Composant pour graphique en donut (style RosenCharts)
function DonutChart({ 
  data, 
  width = 300, 
  height = 300, 
  title 
}: { 
  data: Array<{ label: string; value: number; color?: string }>; 
  width?: number; 
  height?: number; 
  title: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const radius = Math.min(width, height) / 2 - 20;
    const innerRadius = radius * 0.6;

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.label))
      .range(['#f97316', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']);

    const pie = d3.pie<any>()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc<any>()
      .innerRadius(innerRadius)
      .outerRadius(radius);

    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter().append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', (d, i) => data[i].color || color(data[i].label) as string)
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 2)
      .transition()
      .duration(800)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function(t) {
          const interpolated = interpolate(t);
          return arc(interpolated) || '';
        };
      });

    // Labels
    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('dy', '0.35em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#fff')
      .style('font-weight', 'bold')
      .text(d => d.data.value);

  }, [data, width, height]);

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-slate-100 mb-4 text-center">{title}</h3>
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
    </div>
  );
}

// Composant principal des analytics
export function AdminAnalyticsCharts() {
  const { messages } = useLocale();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, metricsRes] = await Promise.all([
        fetch(`/api/admin/analytics?period=${period}`),
        fetch('/api/admin/metrics')
      ]);

      if (analyticsRes.ok && metricsRes.ok) {
        const analytics = await analyticsRes.json();
        const metrics = await metricsRes.json();
        
        if (analytics.success) setAnalyticsData(analytics.data);
        if (metrics.success) setMetricsData(metrics.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh toutes les 30s
    return () => clearInterval(interval);
  }, [period, fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* KPIs Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4 bg-slate-600" />
                  <Skeleton className="h-8 w-1/2 bg-slate-600" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 bg-slate-600" />
                    <Skeleton className="h-4 w-16 bg-slate-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Graphiques Skeletons */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-48 bg-slate-600" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20 bg-slate-600" />
              <Skeleton className="h-9 w-9 bg-slate-600" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <Skeleton className="h-6 w-48 bg-slate-600" />
                  <Skeleton className="h-4 w-64 bg-slate-600" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full bg-slate-600" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData || !metricsData) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <TrendingUp className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">
                Données indisponibles
              </h3>
              <p className="text-slate-400 mb-4">
                Impossible de charger les analytics. Vérifiez votre connexion.
              </p>
              <Button onClick={fetchData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(cents / 100);
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-slate-400" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-500';
    if (growth < 0) return 'text-red-500';
    return 'text-slate-400';
  };

  return (
    <div className="space-y-6">
      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Utilisateurs Total</p>
                <p className="text-2xl font-bold text-slate-100">
                  {analyticsData.overview.totalUsers.toLocaleString()}
                </p>
                <div className="flex items-center mt-1">
                  {getGrowthIcon(analyticsData.overview.userGrowth)}
                  <span className={`text-sm ml-1 ${getGrowthColor(analyticsData.overview.userGrowth)}`}>
                    {analyticsData.overview.userGrowth > 0 ? '+' : ''}{analyticsData.overview.userGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Volume Total</p>
                <p className="text-2xl font-bold text-slate-100">
                  {formatCurrency(analyticsData.overview.totalVolumeCents)}
                </p>
                <div className="flex items-center mt-1">
                  {getGrowthIcon(analyticsData.overview.volumeGrowth)}
                  <span className={`text-sm ml-1 ${getGrowthColor(analyticsData.overview.volumeGrowth)}`}>
                    {analyticsData.overview.volumeGrowth > 0 ? '+' : ''}{analyticsData.overview.volumeGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Trades Total</p>
                <p className="text-2xl font-bold text-slate-100">
                  {analyticsData.overview.totalTrades.toLocaleString()}
                </p>
                <div className="flex items-center mt-1">
                  {getGrowthIcon(analyticsData.overview.tradeGrowth)}
                  <span className={`text-sm ml-1 ${getGrowthColor(analyticsData.overview.tradeGrowth)}`}>
                    {analyticsData.overview.tradeGrowth > 0 ? '+' : ''}{analyticsData.overview.tradeGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Sessions Actives</p>
                <p className="text-2xl font-bold text-slate-100">
                  {metricsData.realtime.activeSessions}
                </p>
                <p className="text-sm text-slate-400 mt-1">En temps réel</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques principaux */}
      <Tabs defaultValue="volume" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="volume" className="data-[state=active]:bg-slate-700">
              Volume & Trades
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-slate-700">
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="status" className="data-[state=active]:bg-slate-700">
              Statuts
            </TabsTrigger>
            <TabsTrigger value="realtime" className="data-[state=active]:bg-slate-700">
              Temps Réel
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <select 
              value={period} 
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="bg-slate-800 border border-slate-600 rounded px-3 py-1 text-slate-100"
            >
              <option value={7}>7 jours</option>
              <option value={30}>30 jours</option>
              <option value={90}>90 jours</option>
            </select>
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="volume" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">Volume Quotidien</CardTitle>
                <CardDescription className="text-slate-400">
                  Évolution du volume de trades sur {period} jours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AreaChart
                  data={analyticsData.charts.dailyVolume}
                  title=""
                  valueKey="volume"
                  dateKey="date"
                  width={500}
                  height={300}
                />
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">Top Utilisateurs</CardTitle>
                <CardDescription className="text-slate-400">
                  Classement par volume de trades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HorizontalBarChart
                  data={analyticsData.topUsers.slice(0, 5).map(user => ({
                    label: user.name,
                    value: user.volume,
                    color: '#f97316'
                  }))}
                  title=""
                  width={500}
                  height={300}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Nouveaux Utilisateurs</CardTitle>
              <CardDescription className="text-slate-400">
                Inscriptions quotidiennes sur {period} jours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AreaChart
                data={analyticsData.charts.dailyUsers}
                title=""
                valueKey="users"
                dateKey="date"
                width={800}
                height={400}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">Statuts des Trades</CardTitle>
                <CardDescription className="text-slate-400">
                  Répartition des statuts sur {period} jours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DonutChart
                  data={analyticsData.charts.tradeStatus.map(item => ({
                    label: item.status,
                    value: item.count
                  }))}
                  title=""
                  width={400}
                  height={400}
                />
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">Méthodes de Paiement</CardTitle>
                <CardDescription className="text-slate-400">
                  Répartition des méthodes configurées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DonutChart
                  data={analyticsData.charts.paymentMethods.map(item => ({
                    label: item.type,
                    value: item.count
                  }))}
                  title=""
                  width={400}
                  height={400}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">Activité par Heure</CardTitle>
                <CardDescription className="text-slate-400">
                  Dernières 24 heures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AreaChart
                  data={metricsData.hourly}
                  title=""
                  valueKey="trades"
                  dateKey="hour"
                  width={500}
                  height={300}
                />
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">Alertes Système</CardTitle>
                <CardDescription className="text-slate-400">
                  État actuel de la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metricsData.alerts.length > 0 ? (
                    metricsData.alerts.map((alert, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${
                        alert.type === 'error' ? 'bg-red-900/20 border-red-500/50 text-red-300' :
                        alert.type === 'warning' ? 'bg-yellow-900/20 border-yellow-500/50 text-yellow-300' :
                        'bg-blue-900/20 border-blue-500/50 text-blue-300'
                      }`}>
                        <p className="text-sm">{alert.message}</p>
                        <span className="text-xs opacity-75">Priorité: {alert.priority}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-400">Aucune alerte système</p>
                      <p className="text-sm text-slate-500 mt-1">Tout fonctionne normalement</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Informations Skinplace */}
      {analyticsData.skinplace && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">Statistiques Skinplace</CardTitle>
            <CardDescription className="text-slate-400">
              Intégration API Skinplace en temps réel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {analyticsData.skinplace.balance && (
                <div className="text-center">
                  <p className="text-sm text-slate-400">Solde Skinplace</p>
                  <p className="text-2xl font-bold text-slate-100">
                    {analyticsData.skinplace.balance.balance} {analyticsData.skinplace.balance.currency}
                  </p>
                </div>
              )}
              <div className="text-center">
                <p className="text-sm text-slate-400">Transactions Récentes</p>
                <p className="text-2xl font-bold text-slate-100">
                  {analyticsData.skinplace.recentTransactions?.length || 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-400">Dernière MAJ</p>
                <p className="text-sm text-slate-300">
                  {new Date(analyticsData.generatedAt).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
