'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
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
  User,
  FileText
} from 'lucide-react';
import { KYCDocument, AdminFilters } from '@/lib/types';
import { useLocale } from '@/components/providers/locale-provider';

export function AdminKYCManagement() {
  const { messages } = useLocale();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<AdminFilters>({
    page: 1,
    limit: 20,
  });
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.adminKyc({ ...filters, search: searchTerm }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString());
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/kyc?${params}`);
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Erreur lors du chargement des documents KYC');
      return json;
    },
  });

  const kycDocuments: KYCDocument[] = data?.documents ?? [];

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

  const handleApprove = async (documentId: string) => {
    try {
      const response = await fetch(`/api/admin/kyc/${documentId}/approve`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Erreur lors de l\'approbation');
      queryClient.invalidateQueries({ queryKey: queryKeys.adminKyc({ ...filters, search: searchTerm }) });
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const handleReject = async (documentId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/kyc/${documentId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Erreur lors du rejet');
      queryClient.invalidateQueries({ queryKey: queryKeys.adminKyc({ ...filters, search: searchTerm }) });
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { variant: 'secondary' as const, icon: Clock, text: 'En attente' },
      'approved': { variant: 'default' as const, icon: CheckCircle, text: 'Approuvé' },
      'rejected': { variant: 'destructive' as const, icon: XCircle, text: 'Rejeté' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['pending'];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const getDocumentTypeLabel = (type: string) => {
    const typeConfig = {
      'id_card': 'Carte d\'identité',
      'passport': 'Passeport',
      'selfie': 'Selfie',
      'proof_of_address': 'Justificatif de domicile',
    };

    return typeConfig[type as keyof typeof typeConfig] || type;
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'id_card':
      case 'passport':
        return <FileText className="h-4 w-4" />;
      case 'selfie':
        return <User className="h-4 w-4" />;
      case 'proof_of_address':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  /** Libellé affiché pour l’utilisateur (pseudo Steam en priorité, puis nom, email, sinon userId) */
  const getUserDisplayLabel = (doc: KYCDocument) => {
    const u = doc.user;
    if (u?.steamUsername) return u.steamUsername;
    if (u?.name) return u.name;
    if (u?.email) return u.email;
    return doc.userId;
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

  const exportKYCDocuments = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString());
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/kyc/export?${params}`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kyc-documents-${new Date().toISOString().split('T')[0]}.csv`;
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
            <span>Erreur: {error.message}</span>
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
              placeholder="Rechercher par pseudo Steam, email, ID..."
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
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="approved">Approuvé</SelectItem>
              <SelectItem value="rejected">Rejeté</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.adminKyc({ ...filters, search: searchTerm }) })}
            variant="outline"
            size="sm"
            className="border-slate-600 text-white hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>

          <Button 
            onClick={exportKYCDocuments}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Exporter</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="bg-slate-800/30 border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700">
              <TableHead className="text-slate-300 whitespace-nowrap">Utilisateur</TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">Type</TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">Statut</TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">Uploadé le</TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">Révisé le</TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kycDocuments.map((doc) => (
              <TableRow key={doc.id} className="border-slate-700 hover:bg-slate-800/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={doc.user?.steamAvatar ?? undefined} alt={getUserDisplayLabel(doc)} />
                      <AvatarFallback className="bg-slate-600 text-slate-300">
                        {(doc.user?.steamUsername || doc.user?.name || doc.user?.email || doc.userId).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-white">{getUserDisplayLabel(doc)}</div>
                      <div className="text-xs text-slate-400">
                        {doc.user?.steamId && <span>Steam: {doc.user.steamId}</span>}
                        {doc.user?.steamId && doc.user?.email && ' · '}
                        {doc.user?.email && <span>{doc.user.email}</span>}
                        {!doc.user?.steamId && !doc.user?.email && `ID: ${doc.id}`}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getDocumentIcon(doc.type)}
                    <span className="text-slate-300">
                      {getDocumentTypeLabel(doc.type)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(doc.status)}
                </TableCell>
                <TableCell className="text-slate-300">
                  {formatDate(doc.uploadedAt)}
                </TableCell>
                <TableCell className="text-slate-300">
                  {doc.reviewedAt ? formatDate(doc.reviewedAt) : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-white hover:bg-slate-700"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {doc.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(doc.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleReject(doc.id, 'Document non conforme')}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </Card>

      {kycDocuments.length === 0 && (
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="p-8 text-center">
            <p className="text-slate-300">Aucun document KYC trouvé</p>
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
