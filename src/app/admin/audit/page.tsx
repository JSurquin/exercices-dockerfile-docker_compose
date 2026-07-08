'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Shield, Users, Activity, Clock, Filter, Download, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS, zhCN } from 'date-fns/locale';
import { useLocale } from '@/components/providers/locale-provider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { formatAuditLogDetails } from '@/lib/audit-log-formatter';
import { PageLoading } from '@/components/ui/page-loading';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

interface SecurityMetrics {
  totalLogs: number;
  criticalAlerts: number;
  suspiciousActivities: number;
  failedLogins: number;
  adminActions: number;
  paymentActions: number;
  tradeActions: number;
  recentActivity: AuditLog[];
  topIPs: Array<{ ip: string; count: number }>;
  topUsers: Array<{ userId: string; count: number }>;
  activitySpikes: {
    isSpike: boolean;
    currentActivity: number;
    averageActivity: number;
    threshold: number;
  };
  fraudTrend: number;
  timeframe: string;
  since: string;
  generatedAt: string;
}

interface DashboardResponse {
  logs: AuditLog[];
  totalLogs: number;
  metrics: SecurityMetrics;
}

const severityColors = {
  low: 'bg-green-500/20 text-green-400 border-green-500/50',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  high: 'bg-theme-accent/20 text-theme-highlight border-theme-accent/50',
  critical: 'bg-red-500/20 text-red-400 border-red-500/50',
};

export default function AuditPage() {
  const { locale, messages } = useLocale();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    action: 'all',
    severity: 'all',
    userId: '',
    timeframe: '24h',
  });

  const { data: dashboardData, isLoading: loading } = useQuery({
    queryKey: [...queryKeys.adminAuditDashboard, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.action !== 'all') params.append('action', filters.action);
      if (filters.severity !== 'all') params.append('severity', filters.severity);
      if (filters.userId) params.append('userId', filters.userId);
      params.append('timeframe', filters.timeframe);

      const response = await fetch(`/api/admin/audit/dashboard?${params}`);
      if (!response.ok) throw new Error('Erreur lors du chargement');
      return response.json() as Promise<DashboardResponse>;
    },
  });
  const metrics = dashboardData?.metrics ?? null;
  const logs = dashboardData?.logs ?? [];

  const auditMessages = messages.admin.audit;

  // Helper pour obtenir la locale date-fns
  const getDateFnsLocale = () => {
    switch (locale) {
      case 'en': return enUS;
      case 'cn': return zhCN;
      default: return fr;
    }
  };

  // Helper pour traduire les actions
  const formatActionName = (action: string) => {
    return auditMessages.actions[action as keyof typeof auditMessages.actions] || action;
  };

  const formatLogDetails = (log: AuditLog) => {
    return formatAuditLogDetails(log.details, auditMessages.detailLabels);
  };

  // Helper pour obtenir le badge de sévérité traduit
  const getSeverityBadge = (details: Record<string, any>) => {
    const severity = details.severity || 'low';
    const translatedSeverity = auditMessages.severity[severity as keyof typeof auditMessages.severity] || severity.toUpperCase();
    return (
      <Badge variant="outline" className={severityColors[severity as keyof typeof severityColors]}>
        {translatedSeverity}
      </Badge>
    );
  };

  const exportLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.action && filters.action !== 'all') params.append('action', filters.action);
      if (filters.severity && filters.severity !== 'all') params.append('severity', filters.severity);
      if (filters.userId) params.append('userId', filters.userId);
      params.append('timeframe', filters.timeframe);
      params.append('export', 'true');

      const response = await fetch(`/api/admin/audit/logs?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    }
  };

  if (loading) {
    return (
      <PageLoading variant="compact" message={auditMessages.loading} className="min-h-[50vh]" />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{auditMessages.title}</h1>
          <p className="text-slate-400">
            {auditMessages.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.adminAuditDashboard })} variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{auditMessages.refresh}</span>
          </Button>
          <Button onClick={exportLogs} variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{auditMessages.export}</span>
          </Button>
        </div>
      </div>

      {/* Métriques de sécurité */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">{auditMessages.metrics.totalLogs}</CardTitle>
            <Activity className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics?.totalLogs || 0}</div>
            <p className="text-xs text-slate-400">
              {auditMessages.metrics.last24h}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">{auditMessages.metrics.criticalAlerts}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{metrics?.criticalAlerts || 0}</div>
            <p className="text-xs text-slate-400">
              {auditMessages.metrics.needsAttention}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">{auditMessages.metrics.suspiciousActivities}</CardTitle>
            <Shield className="h-4 w-4 text-theme-highlight" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-theme-highlight">{metrics?.suspiciousActivities || 0}</div>
            <p className="text-xs text-slate-400">
              {auditMessages.metrics.detectedAutomatically}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">{auditMessages.metrics.failedLogins}</CardTitle>
            <Users className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{metrics?.failedLogins || 0}</div>
            <p className="text-xs text-slate-400">
              {auditMessages.metrics.failedAttempts}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border-slate-700 h-auto">
          <TabsTrigger value="logs" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white">
            <Activity className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{auditMessages.tabs.logs}</span>
            <span className="sm:hidden text-[10px]">Logs</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white">
            <Shield className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{auditMessages.tabs.analytics}</span>
            <span className="sm:hidden text-[10px]">Analyses</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{auditMessages.tabs.alerts}</span>
            <span className="sm:hidden text-[10px]">Alertes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Filtres */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Filter className="h-4 w-4 mr-2" />
                {auditMessages.filters.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300">{auditMessages.filters.action}</label>
                  <Select value={filters.action} onValueChange={(value) => setFilters({...filters, action: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder={auditMessages.filters.allActions} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{auditMessages.filters.allActions}</SelectItem>
                      <SelectItem value="user.login">{auditMessages.actions['user.login']}</SelectItem>
                      <SelectItem value="trade.created">{auditMessages.actions['trade.created']}</SelectItem>
                      <SelectItem value="payout.requested">{auditMessages.actions['payout.requested']}</SelectItem>
                      <SelectItem value="webhook.whitepay.call">{auditMessages.actions['webhook.whitepay.call']}</SelectItem>
                      <SelectItem value="admin.action">{auditMessages.actions['admin.action']}</SelectItem>
                      <SelectItem value="security.suspicious_activity">{auditMessages.actions['security.suspicious_activity']}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300">{auditMessages.filters.severity}</label>
                  <Select value={filters.severity} onValueChange={(value) => setFilters({...filters, severity: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder={auditMessages.filters.allSeverities} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{auditMessages.filters.allSeverities}</SelectItem>
                      <SelectItem value="low">{auditMessages.severity.low}</SelectItem>
                      <SelectItem value="medium">{auditMessages.severity.medium}</SelectItem>
                      <SelectItem value="high">{auditMessages.severity.high}</SelectItem>
                      <SelectItem value="critical">{auditMessages.severity.critical}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300">{auditMessages.filters.user}</label>
                  <Input
                    placeholder={auditMessages.filters.userIdPlaceholder}
                    value={filters.userId}
                    onChange={(e) => setFilters({...filters, userId: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300">{auditMessages.filters.period}</label>
                  <Select value={filters.timeframe} onValueChange={(value) => setFilters({...filters, timeframe: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">{auditMessages.filters.lastHour}</SelectItem>
                      <SelectItem value="24h">{auditMessages.filters.last24h}</SelectItem>
                      <SelectItem value="7d">{auditMessages.filters.last7days}</SelectItem>
                      <SelectItem value="30d">{auditMessages.filters.last30days}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table des logs */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">{auditMessages.tabs.logs}</CardTitle>
              <CardDescription className="text-slate-400">
                {logs.length} {auditMessages.table.entriesFound}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">{auditMessages.table.date}</TableHead>
                      <TableHead className="min-w-[120px]">{auditMessages.table.user}</TableHead>
                      <TableHead className="min-w-[100px]">{auditMessages.table.action}</TableHead>
                      <TableHead className="min-w-[80px]">{auditMessages.table.severity}</TableHead>
                      <TableHead className="min-w-[100px]">{auditMessages.table.ip}</TableHead>
                      <TableHead className="min-w-[200px]">{auditMessages.table.details}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                          <Activity className="h-10 w-10 mx-auto mb-3 opacity-40" />
                          <p className="text-sm">{auditMessages.noLogsInPeriod}</p>
                        </TableCell>
                      </TableRow>
                    ) : logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="min-w-[140px]">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1 text-muted-foreground shrink-0" />
                            <span className="text-xs">
                              {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm', { locale: getDateFnsLocale() })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[120px]">
                          <div className="font-medium text-sm truncate max-w-[100px]">
                            {log.userId || auditMessages.table.system}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[100px]">
                            ID: {log.userId}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          <Badge variant="outline" className="text-xs">
                            {formatActionName(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell className="min-w-[80px]">
                          {getSeverityBadge(log.details)}
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          <code className="text-xs bg-muted px-1 py-0.5 rounded block truncate max-w-[90px]">
                            {log.ipAddress || 'N/A'}
                          </code>
                        </TableCell>
                        <TableCell className="min-w-[200px]">
                          <div className="max-w-[280px] text-xs text-muted-foreground leading-relaxed">
                            {formatLogDetails(log)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">{auditMessages.analytics.title}</CardTitle>
              <CardDescription className="text-slate-400">
                {auditMessages.analytics.subtitle}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {/* Top IPs Card */}
                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-white">{auditMessages.analytics.topIPs}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {metrics.topIPs?.slice(0, 5).map((item) => (
                        <div key={item.ip} className="flex justify-between items-center">
                          <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[120px]">
                            {item.ip}
                          </code>
                          <Badge variant="outline" className="text-xs">
                            {item.count} {auditMessages.analytics.requests}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Top Users Card */}
                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-white">{auditMessages.analytics.activeUsers}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {metrics.topUsers?.slice(0, 5).map((item) => (
                        <div key={item.userId} className="flex justify-between items-center">
                          <span className="text-sm font-mono truncate max-w-[120px]">
                            {item.userId.substring(0, 8)}...
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {item.count} {auditMessages.analytics.actions}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Fraud Trend Card */}
                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-white">{auditMessages.analytics.fraudTrend}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`p-3 rounded-lg ${metrics.fraudTrend > 0 ? 'bg-red-500/20 border border-red-500/50' : 'bg-green-500/20 border border-green-500/50'}`}>
                        <span className={`font-medium text-lg ${metrics.fraudTrend > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {metrics.fraudTrend > 0 ? '+' : ''}{metrics.fraudTrend.toFixed(1)}%
                        </span>
                        <p className="text-xs text-slate-400 mt-1">
                          {auditMessages.analytics.vsPreviousPeriod}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Activity Spikes Card - Prend toute la largeur si détecté */}
                  {metrics.activitySpikes?.isSpike && (
                    <Card className="md:col-span-2 xl:col-span-3 bg-slate-900/50 border-slate-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center text-white">
                          <AlertTriangle className="h-4 w-4 text-theme-highlight mr-2" />
                          {auditMessages.analytics.activitySpike}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="p-4 bg-theme-accent/20 border border-theme-accent/50 rounded-lg">
                          <p className="text-sm text-theme-highlight">
                            <strong>{auditMessages.analytics.currentActivity}:</strong> {metrics.activitySpikes.currentActivity} 
                            <span className="ml-2 text-slate-400">
                              ({auditMessages.analytics.threshold}: {metrics.activitySpikes.threshold})
                            </span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">{auditMessages.alerts.title}</CardTitle>
              <CardDescription className="text-slate-400">
                {auditMessages.alerts.subtitle}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-400">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{auditMessages.alerts.inDevelopment}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
