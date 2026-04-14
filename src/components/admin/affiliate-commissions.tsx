'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { SafeImg } from '@/components/ui/safe-image';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  CreditCard,
  Filter
} from 'lucide-react';

interface CommissionData {
  id: string;
  amountCents: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  createdAt: string;
  paidAt?: string;
  affiliate: {
    id: string;
    code: string;
    user: {
      steamUsername?: string;
      steamAvatar?: string;
      email: string;
    };
  };
  referral?: {
    referredUser: {
      steamUsername?: string;
      steamAvatar?: string;
    };
    trade?: {
      id: string;
      grossCents: number;
      createdAt: string;
    };
  };
  payout?: {
    id: string;
    status: string;
    paidAt?: string;
  };
}

interface StatusTotals {
  [key: string]: {
    count: number;
    total: number;
  };
}

export default function AffiliateCommissions() {
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading: loading } = useQuery({
    queryKey: ['admin', 'affiliate-commissions', { page, statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: '20', status: statusFilter });
      const response = await fetch(`/api/admin/affiliates/commissions?${params}`);
      const json = await response.json();
      return json.success ? json.data : null;
    },
  });
  const commissions = data?.commissions ?? [];
  const totalPages = data?.pagination?.pages ?? 1;
  const statusTotals: StatusTotals = data?.statusTotals ?? {};

  const handleCommissionAction = async (action: 'approve' | 'reject') => {
    if (selectedCommissions.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Aucune commission sélectionnée',
        variant: 'destructive'
      });
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/admin/affiliates/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          commissionIds: selectedCommissions
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Succès',
          description: `${selectedCommissions.length} commission(s) ${action === 'approve' ? 'approuvée(s)' : 'rejetée(s)'}`
        });
        queryClient.invalidateQueries({ queryKey: ['admin', 'affiliate-commissions'] });
      } else {
        toast({
          title: 'Erreur',
          description: data.error || 'Erreur lors de l\'action',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur de connexion',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const createPayout = async () => {
    if (selectedCommissions.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Aucune commission sélectionnée',
        variant: 'destructive'
      });
      return;
    }

    // TODO: Implémenter la création de payout
    toast({
      title: 'Info',
      description: 'Création de payout - À implémenter',
      variant: 'default'
    });
  };

  const toggleCommissionSelection = (commissionId: string) => {
    setSelectedCommissions(prev =>
      prev.includes(commissionId)
        ? prev.filter(id => id !== commissionId)
        : [...prev, commissionId]
    );
  };

  const toggleAllCommissions = () => {
    if (selectedCommissions.length === commissions.length) {
      setSelectedCommissions([]);
    } else {
      setSelectedCommissions(commissions.map((c: CommissionData) => c.id));
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: { variant: 'secondary' as const, icon: Clock },
      APPROVED: { variant: 'default' as const, icon: CheckCircle },
      PAID: { variant: 'default' as const, icon: CreditCard },
      CANCELLED: { variant: 'destructive' as const, icon: XCircle }
    };

    const config = variants[status as keyof typeof variants] || variants.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métriques par statut */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(statusTotals).map(([status, data]) => (
          <Card key={status}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {status === 'PENDING' && 'En Attente'}
                {status === 'APPROVED' && 'Approuvées'}
                {status === 'PAID' && 'Payées'}
                {status === 'CANCELLED' && 'Annulées'}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.total)}</div>
              <p className="text-xs text-muted-foreground">
                {data.count} commission{data.count > 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gestion des commissions */}
      <Card>
        <CardHeader>
          <CardTitle>Commissions d&apos;Affiliation</CardTitle>
          <CardDescription>
            Gérez les commissions générées par les affiliés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">En Attente</SelectItem>
                <SelectItem value="APPROVED">Approuvées</SelectItem>
                <SelectItem value="PAID">Payées</SelectItem>
                <SelectItem value="CANCELLED">Annulées</SelectItem>
              </SelectContent>
            </Select>

            {statusFilter === 'PENDING' && selectedCommissions.length > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={() => handleCommissionAction('approve')}
                  disabled={processing}
                  size="sm"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approuver ({selectedCommissions.length})
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleCommissionAction('reject')}
                  disabled={processing}
                  size="sm"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Rejeter ({selectedCommissions.length})
                </Button>
              </div>
            )}

            {statusFilter === 'APPROVED' && selectedCommissions.length > 0 && (
              <Button
                onClick={createPayout}
                disabled={processing}
                size="sm"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Créer Payout ({selectedCommissions.length})
              </Button>
            )}
          </div>

          {/* Tableau des commissions */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedCommissions.length === commissions.length && commissions.length > 0}
                      onCheckedChange={toggleAllCommissions}
                    />
                  </TableHead>
                  <TableHead>Affilié</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Référral</TableHead>
                  <TableHead>Trade</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission: CommissionData) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedCommissions.includes(commission.id)}
                        onCheckedChange={() => toggleCommissionSelection(commission.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <SafeImg
                          src={commission.affiliate.user.steamAvatar || '/images/default-avatar.png'}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full"
                          fallbackClassName="w-8 h-8 rounded-full"
                          fallbackIcon={<UserCircleIcon className="w-5 h-5" />}
                        />
                        <div>
                          <p className="font-medium">
                            {commission.affiliate.user.steamUsername || 'Utilisateur'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {commission.affiliate.code}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(commission.amountCents)}
                    </TableCell>
                    <TableCell>
                      {commission.referral ? (
                        <div className="flex items-center space-x-2">
                          <SafeImg
                            src={commission.referral.referredUser.steamAvatar || '/images/default-avatar.png'}
                            alt="Avatar"
                            className="w-6 h-6 rounded-full"
                            fallbackClassName="w-6 h-6 rounded-full"
                            fallbackIcon={<UserCircleIcon className="w-4 h-4" />}
                          />
                          <span className="text-sm">
                            {commission.referral.referredUser.steamUsername || 'Utilisateur'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {commission.referral?.trade ? (
                        <div>
                          <p className="text-sm font-medium">
                            {formatCurrency(commission.referral.trade.grossCents)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(commission.referral.trade.createdAt)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{formatDate(commission.createdAt)}</p>
                        {commission.paidAt && (
                          <p className="text-xs text-muted-foreground">
                            Payé: {formatDate(commission.paidAt)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(commission.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Page {page} sur {totalPages}
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                Suivant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}