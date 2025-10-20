'use client';

import { useState, useEffect, useCallback } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { Trade, AdminFilters } from '@/lib/types';
import { useLocale } from '@/components/providers/locale-provider';

export function AdminTradesTable() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { messages } = useLocale();
  const [filters, setFilters] = useState<AdminFilters>({
    page: 1,
    limit: 20,
  });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTrades = useCallback(async () => {
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

      const response = await fetch(`/api/admin/trades?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement des trades');
      }

      setTrades(data.trades || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchTerm]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

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
      'créé': { variant: 'secondary' as const, icon: Clock, text: 'Créé' },
      'accepté_par_bot': { variant: 'default' as const, icon: CheckCircle, text: 'Accepté' },
      'en_trade_hold': { variant: 'default' as const, icon: Clock, text: 'Trade Hold' },
      'disponible': { variant: 'default' as const, icon: CheckCircle, text: 'Disponible' },
      'paiement_en_cours': { variant: 'default' as const, icon: Clock, text: 'Paiement' },
      'payé': { variant: 'default' as const, icon: CheckCircle, text: 'Payé' },
      'échoué': { variant: 'destructive' as const, icon: XCircle, text: 'Échoué' },
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

  const exportTrades = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString());
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/trades/export?${params}`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trades-${new Date().toISOString().split('T')[0]}.csv`;
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
            placeholder="Rechercher par ticket ID, utilisateur..."
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
            <SelectItem value="créé">{messages.components.admin.trades.created}</SelectItem>
            <SelectItem value="accepté_par_bot">{messages.components.admin.trades.accepted}</SelectItem>
            <SelectItem value="en_trade_hold">Trade Hold</SelectItem>
            <SelectItem value="disponible">Disponible</SelectItem>
            <SelectItem value="paiement_en_cours">Paiement</SelectItem>
            <SelectItem value="payé">{messages.components.admin.trades.paid}</SelectItem>
            <SelectItem value="échoué">{messages.components.admin.trades.failed}</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          onClick={fetchTrades}
          variant="outline"
          className="border-slate-600 text-white hover:bg-slate-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>

        <Button 
          onClick={exportTrades}
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
              <TableHead className="text-slate-300">Ticket ID</TableHead>
              <TableHead className="text-slate-300">Utilisateur</TableHead>
              <TableHead className="text-slate-300">Statut</TableHead>
              <TableHead className="text-slate-300">Montant</TableHead>
              <TableHead className="text-slate-300">Items</TableHead>
              <TableHead className="text-slate-300">Créé le</TableHead>
              <TableHead className="text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => (
              <TableRow key={trade.id} className="border-slate-700 hover:bg-slate-800/50">
                <TableCell className="font-mono text-sm text-white">
                  {trade.ticketId}
                </TableCell>
                <TableCell className="text-slate-300">
                  <div>
                    <div className="font-medium">{trade.userId}</div>
                    <div className="text-xs text-slate-400">ID: {trade.id}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(trade.status)}
                </TableCell>
                <TableCell className="text-white">
                  <div>
                    <div className="font-medium">{formatCurrency(trade.netCentimes)}</div>
                    <div className="text-xs text-slate-400">
                      Brut: {formatCurrency(trade.brutCentimes)}
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-white hover:bg-slate-700"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {trades.length === 0 && (
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="p-8 text-center">
            <p className="text-slate-300">Aucun trade trouvé</p>
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
