'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConvertedPrice } from '@/components/ui/converted-price';
import { TradeItemsGallery } from '@/components/trade/trade-items-gallery';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Download, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { Trade, AdminFilters } from '@/lib/types';
import { useLocale } from '@/components/providers/locale-provider';
import { queryKeys } from '@/lib/query-keys';
import { AdminUserLink } from '@/components/admin/admin-user-link';

// Statuts pour lesquels le polling Skinplace a du sens
const SYNCABLE_STATUSES = ['créé', 'accepté_par_bot', 'en_trade_hold', 'disponible'];

export function AdminTradesTable() {
  const { messages } = useLocale();
  const t = messages.components.admin.trades;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<AdminFilters>({
    page: 1,
    limit: 20,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [limit, setLimit] = useState(20);
  const [syncingTradeIds, setSyncingTradeIds] = useState<Set<string>>(new Set());
  const [detailTrade, setDetailTrade] = useState<Trade | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setFilters(prev => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: queryKeys.adminTrades({ ...filters, search: debouncedSearch }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString());
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (debouncedSearch) params.append('search', debouncedSearch);

      const response = await fetch(`/api/admin/trades?${params}`);
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || t.loadError);
      }
      return json;
    },
    placeholderData: keepPreviousData,
  });

  const trades: Trade[] = data?.trades ?? [];

  useEffect(() => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  }, [limit]);

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ 
      ...prev, 
      status: status === 'all' ? undefined : status,
      page: 1 
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'créé': { variant: 'secondary' as const, icon: Clock, text: t.created },
      'accepté_par_bot': { variant: 'default' as const, icon: CheckCircle, text: t.accepted },
      'en_trade_hold': { variant: 'default' as const, icon: Clock, text: t.tradeHold },
      'disponible': { variant: 'default' as const, icon: CheckCircle, text: t.available },
      'paiement_en_cours': { variant: 'default' as const, icon: Clock, text: t.payment },
      'payé': { variant: 'default' as const, icon: CheckCircle, text: t.paid },
      'échoué': { variant: 'destructive' as const, icon: XCircle, text: t.failed },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['créé'];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const syncTrade = async (tradeId: string) => {
    setSyncingTradeIds(prev => new Set(prev).add(tradeId));
    try {
      const response = await fetch(`/api/admin/trades/${tradeId}/sync-skinplace`, {
        method: 'POST',
      });
      const json = await response.json();

      if (!response.ok) {
        toast({
          title: t.syncError,
          description: json.error || t.syncErrorDesc,
          variant: 'destructive',
        });
        return;
      }

      if (json.synced) {
        toast({
          title: t.syncUpdated,
          description: json.message,
        });
        queryClient.invalidateQueries({ queryKey: ['admin', 'trades'] });
      } else {
        toast({
          title: t.syncNoChange,
          description: json.message,
        });
      }
    } catch {
      toast({
        title: t.networkError,
        description: t.networkErrorDesc,
        variant: 'destructive',
      });
    } finally {
      setSyncingTradeIds(prev => {
        const next = new Set(prev);
        next.delete(tradeId);
        return next;
      });
    }
  };

  const exportTrades = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString());
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/trades/export?${params}`);
      if (!response.ok) {
        let message = `Erreur ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson?.message) message = errJson.message;
          else if (errJson?.error) message = errJson.error;
        } catch {
          /* ignore */
        }
        toast({
          title: t.exportError,
          description: message,
          variant: 'destructive',
        });
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trades-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: t.exportDone,
        description: t.exportDoneDesc,
      });
    } catch (err) {
      console.error('export error:', err);
      toast({
        title: t.exportError,
        description: err instanceof Error ? err.message : t.networkError,
        variant: 'destructive',
      });
    }
  };

  if (isLoading && !data) {
    return <TableSkeleton />;
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-500">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span>{error.message}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 bg-slate-700 border-slate-600 text-white"
            />
            {isFetching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
            )}
          </div>
          
          <Select onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder={t.allStatuses} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allStatuses}</SelectItem>
              <SelectItem value="créé">{t.created}</SelectItem>
              <SelectItem value="accepté_par_bot">{t.accepted}</SelectItem>
              <SelectItem value="en_trade_hold">{t.tradeHold}</SelectItem>
              <SelectItem value="disponible">{t.available}</SelectItem>
              <SelectItem value="paiement_en_cours">{t.payment}</SelectItem>
              <SelectItem value="payé">{t.paid}</SelectItem>
              <SelectItem value="échoué">{t.failed}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'trades'] })}
            variant="outline"
            size="sm"
            className="border-slate-600 text-white hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t.refresh}</span>
          </Button>

          <Button 
            onClick={exportTrades}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t.export}</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="bg-slate-800/30 border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700">
              <TableHead className="text-slate-300 whitespace-nowrap">{t.colTicket}</TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">{t.colUser}</TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">{t.colStatus}</TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">
                {t.colAmount}
                <span className="block text-[10px] font-normal text-slate-500">{t.colAmountSub}</span>
              </TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">{t.colItems}</TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">{t.colCreatedAt}</TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">{t.colActions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => (
              <TableRow key={trade.id} className="border-slate-700 hover:bg-slate-800/50">
                <TableCell className="font-mono text-sm text-white">
                  {trade.ticketId}
                </TableCell>
                <TableCell className="text-slate-300">
                  <AdminUserLink
                    userId={trade.userId}
                    name={trade.userName}
                    avatar={trade.userAvatar}
                    email={trade.userEmail}
                    showEmail
                    showUserId
                    avatarSize="sm"
                  />
                </TableCell>
                <TableCell>
                  {getStatusBadge(trade.status)}
                </TableCell>
                <TableCell className="text-white">
                  <div>
                    <div className="font-medium">
                      <ConvertedPrice
                        usdCents={trade.netCentimes}
                        fromCurrency="USD"
                        showOriginal
                        className="text-white"
                      />
                    </div>
                    <div className="text-xs text-slate-400">
                      {t.labelGross}:{' '}
                      <ConvertedPrice
                        usdCents={trade.brutCentimes}
                        fromCurrency="USD"
                        showOriginal
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-slate-300">
                  {trade.items.length} item(s)
                </TableCell>
                <TableCell className="text-slate-300">
                  {formatDate(trade.créédLe)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-white hover:bg-slate-700"
                      type="button"
                      aria-label={t.viewTradeAriaLabel}
                      onClick={() => setDetailTrade(trade)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {SYNCABLE_STATUSES.includes(trade.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={syncingTradeIds.has(trade.id)}
                        onClick={() => syncTrade(trade.id)}
                        className="border-primary text-theme-highlight hover:bg-theme-accent/15"
                        title={t.syncTooltip}
                      >
                        <RotateCcw className={`h-4 w-4 ${syncingTradeIds.has(trade.id) ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </Card>

      {trades.length === 0 && (
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="p-8 text-center">
            <p className="text-slate-300">{t.noTrades}</p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {data && data.pagination && data.pagination.total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-2">
            <Label className="text-slate-300 text-sm">{t.perPage || 'Par page'}:</Label>
            <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
              <SelectTrigger className="w-24 bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              {t.page || 'Page'} {data.pagination.page} / {data.pagination.pages} ({data.pagination.total} {t.total || 'total'})
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
                disabled={!data.pagination.page || data.pagination.page <= 1}
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                {t.previous || 'Previous'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                disabled={!data.pagination.pages || data.pagination.page >= data.pagination.pages}
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                {t.next || 'Suivant'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={detailTrade !== null} onOpenChange={(open) => !open && setDetailTrade(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-slate-700 bg-slate-900 text-slate-100">
          {detailTrade && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">Trade {detailTrade.ticketId}</DialogTitle>
                <DialogDescription className="text-slate-400">
                  {t.detailDescAmounts}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(detailTrade.status)}
                </div>

                <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4 text-sm">
                  <AdminUserLink
                    userId={detailTrade.userId}
                    name={detailTrade.userName}
                    avatar={detailTrade.userAvatar}
                    email={detailTrade.userEmail}
                    showEmail
                    showUserId
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
                    <p className="text-xs text-slate-400">{t.labelNet}</p>
                    <p className="text-lg font-semibold text-white">
                      <ConvertedPrice
                        usdCents={detailTrade.netCentimes}
                        fromCurrency="USD"
                        showOriginal
                      />
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
                    <p className="text-xs text-slate-400">{t.labelGross}</p>
                    <p className="text-lg font-semibold text-white">
                      <ConvertedPrice
                        usdCents={detailTrade.brutCentimes}
                        fromCurrency="USD"
                        showOriginal
                      />
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 sm:col-span-2">
                    <p className="text-xs text-slate-400">{t.labelFees}</p>
                    <p className="text-sm text-slate-200">
                      {t.labelCashout} :{' '}
                      <ConvertedPrice
                        usdCents={detailTrade.frais.cashout}
                        fromCurrency="USD"
                        showOriginal
                      />
                      {' · '}
                      {t.labelNetwork} :{' '}
                      {detailTrade.frais.réseau > 0 ? (
                        <ConvertedPrice
                          usdCents={detailTrade.frais.réseau}
                          fromCurrency="USD"
                          showOriginal
                        />
                      ) : (
                        <span className="text-slate-400">{t.labelAtWithdrawal}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 text-sm text-slate-300">
                  <p>
                    <span className="text-slate-500">{t.labelCreatedAt} :</span>{' '}
                    {formatDate(detailTrade.créédLe)}
                  </p>
                  {detailTrade.tradeAcceptéLe && (
                    <p>
                      <span className="text-slate-500">{t.labelAcceptedAt} :</span>{' '}
                      {formatDate(detailTrade.tradeAcceptéLe)}
                    </p>
                  )}
                  {detailTrade.disponibleLe && (
                    <p>
                      <span className="text-slate-500">{t.labelAvailableAt} :</span>{' '}
                      {formatDate(detailTrade.disponibleLe)}
                    </p>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    {t.labelItemsCount} ({detailTrade.items.length})
                  </p>
                  <TradeItemsGallery items={detailTrade.items} />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="h-10 bg-slate-600 rounded w-1/3 animate-pulse"></div>
        <div className="h-10 bg-slate-600 rounded w-32 animate-pulse"></div>
        <div className="h-10 bg-slate-600 rounded w-24 animate-pulse"></div>
      </div>
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-600 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}
