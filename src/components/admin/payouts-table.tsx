'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Download, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  RotateCw,
  Euro,
  CreditCard,
  Ban,
  Check,
  Settings2
} from 'lucide-react';
import { toast } from 'sonner';
import { Payout, AdminFilters } from '@/lib/types';
import { useLocale } from '@/components/providers/locale-provider';

const CANCELLABLE_STATUSES = ['en_attente', 'en_attente_approbation', 'vérification_requise', 'vérifié', 'planifié'];
const APPROVABLE_STATUS = 'en_attente_approbation';

export function AdminPayoutsTable() {
  const { messages } = useLocale();
  const tp = messages.components.admin.payouts;
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdminFilters>({
    page: 1,
    limit: 20,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [resyncingId, setResyncingId] = useState<string | null>(null);
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(false);
  const [autoApproveThresholdEur, setAutoApproveThresholdEur] = useState('20');
  const [autoApproveSaving, setAutoApproveSaving] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.adminPayouts({ ...filters, search: searchTerm }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString());
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/payouts?${params}`);
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Erreur lors du chargement des paiements');
      return json;
    },
  });

  const payouts: Payout[] = data?.payouts ?? [];

  const { data: autoApproveData } = useQuery({
    queryKey: queryKeys.adminPayoutAutoApprove,
    queryFn: async () => {
      const r = await fetch('/api/admin/settings/payout-auto-approve');
      if (!r.ok) return null;
      return r.json();
    },
  });

  useEffect(() => {
    if (autoApproveData && typeof autoApproveData.enabled === 'boolean') {
      setAutoApproveEnabled(autoApproveData.enabled);
    }
    if (autoApproveData && typeof autoApproveData.thresholdCents === 'number') {
      setAutoApproveThresholdEur(String(autoApproveData.thresholdCents / 100));
    }
  }, [autoApproveData]);

  const saveAutoApproveSettings = async () => {
    setAutoApproveSaving(true);
    try {
      const thresholdCents = Math.round(parseFloat(autoApproveThresholdEur.replace(',', '.')) * 100);
      if (Number.isNaN(thresholdCents) || thresholdCents < 0) {
        toast.error(tp.invalidThreshold ?? 'Seuil invalide');
        return;
      }
      const res = await fetch('/api/admin/settings/payout-auto-approve', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: autoApproveEnabled, thresholdCents }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Erreur');
      toast.success(tp.autoApproveSaved ?? 'Paramètres enregistrés');
    } catch (e) {
      toast.error('Erreur', {
        description: e instanceof Error ? e.message : 'Impossible d\'enregistrer',
      });
    } finally {
      setAutoApproveSaving(false);
    }
  };

  const handleApprovePayout = async (payoutId: string) => {
    setApprovingId(payoutId);
    try {
      const res = await fetch(`/api/admin/payouts/${payoutId}/approve`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erreur');
      toast.success(tp.approveSuccess ?? 'Payout approuvé');
      queryClient.invalidateQueries({ queryKey: queryKeys.adminPayouts({ ...filters, search: searchTerm }) });
    } catch (e) {
      toast.error('Erreur', {
        description: e instanceof Error ? e.message : 'Impossible d\'approuver',
      });
    } finally {
      setApprovingId(null);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ 
      ...prev, 
      status: status === 'all' ? undefined : status,
      page: 1 
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'en_attente': { variant: 'secondary' as const, icon: Clock, text: tp.pending ?? 'En attente' },
      'en_attente_approbation': { variant: 'default' as const, icon: AlertTriangle, text: tp.pendingApproval ?? 'En attente d\'approbation' },
      'vérification_requise': { variant: 'default' as const, icon: AlertTriangle, text: tp.verificationRequired },
      'vérifié': { variant: 'default' as const, icon: CheckCircle, text: tp.verified },
      'planifié': { variant: 'default' as const, icon: Clock, text: tp.scheduled },
      'exécuté': { variant: 'default' as const, icon: CheckCircle, text: tp.executed },
      'payé': { variant: 'default' as const, icon: CheckCircle, text: tp.paid },
      'échoué': { variant: 'destructive' as const, icon: XCircle, text: tp.failed },
      'annulé': { variant: 'outline' as const, icon: Ban, text: tp.cancelled ?? 'Annulé' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['en_attente'];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'sepa':
        return <Euro className="h-4 w-4" />;
      case 'crypto':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const formatCurrency = (centimes: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(centimes / 100);
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

  const handleResyncFlexify = async (payoutId: string) => {
    setResyncingId(payoutId);
    try {
      const res = await fetch(`/api/admin/payouts/${payoutId}/resync-flexify`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erreur');
      toast.success(
        tp.resyncSuccess ?? 'Statut resynchronisé avec Flexify',
        { description: `${data.previousStatus} → ${data.newStatus}` }
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.adminPayouts({ ...filters, search: searchTerm }) });
    } catch (e) {
      toast.error('Erreur', {
        description: e instanceof Error ? e.message : 'Impossible de resynchroniser le statut Flexify',
      });
    } finally {
      setResyncingId(null);
    }
  };

  const handleCancelPayout = async (payoutId: string) => {
    setCancellingId(payoutId);
    try {
      const res = await fetch(`/api/admin/payouts/${payoutId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Annulé par l\'admin' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erreur');
      toast.success(tp.cancelSuccess ?? 'Payout annulé');
      queryClient.invalidateQueries({ queryKey: queryKeys.adminPayouts({ ...filters, search: searchTerm }) });
    } catch (e) {
      toast.error('Erreur', {
        description: e instanceof Error ? e.message : 'Impossible d\'annuler le payout',
      });
    } finally {
      setCancellingId(null);
    }
  };

  const exportPayouts = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString());
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/payouts/export?${params}`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payouts-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Erreur lors de l\'export:', err);
    }
  };

  if (isLoading) {
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
      {/* Auto-payout settings */}
      <Card className="bg-slate-800/30 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="auto-approve-enabled"
                checked={autoApproveEnabled}
                onChange={(e) => setAutoApproveEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-orange-500"
              />
              <label htmlFor="auto-approve-enabled" className="text-sm text-slate-300">
                {tp.autoApproveLabel ?? 'Activer le paiement automatique pour les montants sous le seuil'}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-slate-400" />
              <label htmlFor="auto-approve-threshold" className="text-sm text-slate-400">
                {tp.autoApproveThresholdLabel ?? 'Seuil (€)'}
              </label>
              <Input
                id="auto-approve-threshold"
                type="number"
                min={0}
                step={1}
                value={autoApproveThresholdEur}
                onChange={(e) => setAutoApproveThresholdEur(e.target.value)}
                className="w-24 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <Button
              size="sm"
              onClick={saveAutoApproveSettings}
              disabled={autoApproveSaving}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {autoApproveSaving ? '...' : (tp.save ?? 'Enregistrer')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={tp.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          
          <Select onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder={tp.filterByStatus ?? 'Filtrer par statut'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tp.allStatuses ?? 'Tous les statuts'}</SelectItem>
              <SelectItem value="en_attente">{tp.pending ?? 'En attente'}</SelectItem>
              <SelectItem value="en_attente_approbation">{tp.pendingApproval ?? 'En attente d\'approbation'}</SelectItem>
              <SelectItem value="vérification_requise">{tp.verificationRequired}</SelectItem>
              <SelectItem value="vérifié">{tp.verified}</SelectItem>
              <SelectItem value="planifié">{tp.scheduled}</SelectItem>
              <SelectItem value="exécuté">{tp.executed}</SelectItem>
              <SelectItem value="payé">{tp.paid}</SelectItem>
              <SelectItem value="échoué">{tp.failed}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.adminPayouts({ ...filters, search: searchTerm }) })}
            variant="outline"
            size="sm"
            className="border-slate-600 text-white hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{tp.refresh ?? 'Actualiser'}</span>
          </Button>

          <Button 
            onClick={exportPayouts}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{tp.export ?? 'Exporter'}</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="bg-slate-800/30 border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700">
              <TableHead className="text-slate-300 whitespace-nowrap">{tp.colId ?? 'ID'}</TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">{tp.colUser ?? 'Utilisateur'}</TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">{tp.colStatus ?? 'Statut'}</TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">{tp.colAmount ?? 'Montant'}</TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">{tp.colMethod ?? 'Méthode'}</TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">{tp.colReference ?? 'Référence'}</TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">{tp.colCreatedAt ?? 'Créé le'}</TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">{tp.colActions ?? 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.map((payout) => (
              <TableRow key={payout.id} className="border-slate-700 hover:bg-slate-800/50">
                <TableCell className="font-mono text-sm text-white">
                  {payout.id}
                </TableCell>
                <TableCell className="text-slate-300">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={payout.userSteamAvatar} />
                      <AvatarFallback className="bg-slate-700 text-xs text-slate-300">
                        {(payout.userSteamUsername || payout.userName || '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-medium text-white truncate max-w-[120px]">
                        {payout.userSteamUsername || payout.userName || '—'}
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-[120px]" title={payout.userId}>
                        {payout.userId.substring(0, 8)}…
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(payout.status)}
                </TableCell>
                <TableCell className="text-white font-medium">
                  {formatCurrency(payout.montantCentimes)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(payout.methodePaiement.type)}
                    <span className="text-slate-300 capitalize">
                      {payout.methodePaiement.type}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm text-slate-300">
                  {payout.referencePaiement || '-'}
                </TableCell>
                <TableCell className="text-slate-300">
                  {formatDate(payout.créédLe)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {payout.status === APPROVABLE_STATUS && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-600 text-green-400 hover:bg-green-900/30"
                        onClick={() => handleApprovePayout(payout.id)}
                        disabled={approvingId === payout.id}
                        title={tp.approve ?? 'Approuver'}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {CANCELLABLE_STATUSES.includes(payout.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-600 text-red-400 hover:bg-red-900/30"
                        onClick={() => handleCancelPayout(payout.id)}
                        disabled={cancellingId === payout.id}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                    {payout.flexifyPayoutId && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-600 text-amber-400 hover:bg-amber-900/30"
                        onClick={() => handleResyncFlexify(payout.id)}
                        disabled={resyncingId === payout.id}
                        title={tp.resyncFlexify ?? 'Resync statut Flexify'}
                      >
                        <RotateCw className={`h-4 w-4 ${resyncingId === payout.id ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-white hover:bg-slate-700"
                      asChild
                    >
                      <Link href={`/admin/users/${payout.userId}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </Card>

      {payouts.length === 0 && (
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="p-8 text-center">
            <p className="text-slate-300">{tp.noPayouts ?? 'Aucun paiement trouvé'}</p>
          </CardContent>
        </Card>
      )}
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
