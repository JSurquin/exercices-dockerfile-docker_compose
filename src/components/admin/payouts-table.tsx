'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Download, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Euro,
  CreditCard,
  Ban
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Payout, AdminFilters } from '@/lib/types';
import { useLocale } from '@/components/providers/locale-provider';

const CANCELLABLE_STATUSES = ['en_attente', 'vérification_requise', 'vérifié', 'planifié'];

export function AdminPayoutsTable() {
  const { messages } = useLocale();
  const { toast } = useToast();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdminFilters>({
    page: 1,
    limit: 20,
  });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPayouts = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString());
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/payouts?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement des paiements');
      }

      setPayouts(data.payouts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchTerm]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

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
      'en_attente': { variant: 'secondary' as const, icon: Clock, text: 'En attente' },
      'vérification_requise': { variant: 'default' as const, icon: AlertTriangle, text: 'Vérification requise' },
      'vérifié': { variant: 'default' as const, icon: CheckCircle, text: 'Vérifié' },
      'planifié': { variant: 'default' as const, icon: Clock, text: 'Planifié' },
      'exécuté': { variant: 'default' as const, icon: CheckCircle, text: 'Exécuté' },
      'payé': { variant: 'default' as const, icon: CheckCircle, text: 'Payé' },
      'échoué': { variant: 'destructive' as const, icon: XCircle, text: 'Échoué' },
      'annulé': { variant: 'outline' as const, icon: Ban, text: 'Annulé' },
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
      toast({ title: 'Payout annulé' });
      fetchPayouts();
    } catch (e) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : 'Impossible d\'annuler le payout',
        variant: 'destructive',
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
            <span>Erreur: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={messages.components.admin.payouts.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 bg-slate-700 border-slate-600 text-white"
          />
        </div>
        
        <Select onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-slate-700 border-slate-600 text-white">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="vérification_requise">{messages.components.admin.payouts.verificationRequired}</SelectItem>
            <SelectItem value="vérifié">{messages.components.admin.payouts.verified}</SelectItem>
            <SelectItem value="planifié">{messages.components.admin.payouts.scheduled}</SelectItem>
            <SelectItem value="exécuté">{messages.components.admin.payouts.executed}</SelectItem>
            <SelectItem value="payé">{messages.components.admin.payouts.paid}</SelectItem>
            <SelectItem value="échoué">{messages.components.admin.payouts.failed}</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          onClick={fetchPayouts}
          variant="outline"
          className="border-slate-600 text-white hover:bg-slate-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>

        <Button 
          onClick={exportPayouts}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* Table */}
      <Card className="bg-slate-800/30 border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700">
              <TableHead className="text-slate-300">ID</TableHead>
              <TableHead className="text-slate-300">Utilisateur</TableHead>
              <TableHead className="text-slate-300">Statut</TableHead>
              <TableHead className="text-slate-300">Montant</TableHead>
              <TableHead className="text-slate-300">Méthode</TableHead>
              <TableHead className="text-slate-300">Référence</TableHead>
              <TableHead className="text-slate-300">Créé le</TableHead>
              <TableHead className="text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.map((payout) => (
              <TableRow key={payout.id} className="border-slate-700 hover:bg-slate-800/50">
                <TableCell className="font-mono text-sm text-white">
                  {payout.id}
                </TableCell>
                <TableCell className="text-slate-300">
                  <div>
                    <div className="font-medium">{payout.userId}</div>
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
      </Card>

      {payouts.length === 0 && (
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="p-8 text-center">
            <p className="text-slate-300">Aucun paiement trouvé</p>
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
