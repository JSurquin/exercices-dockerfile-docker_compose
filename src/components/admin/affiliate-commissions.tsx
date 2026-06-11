'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import { useLocale } from '@/components/providers/locale-provider';

interface CommissionData {
  id: string;
  amountCents: number;
  status: 'PENDING' | 'APPROVED' | 'CREDITED' | 'PAID' | 'CANCELLED';
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
  const { messages } = useLocale();
  const t = messages.admin.affiliateCommissions;

  const [statusFilter, setStatusFilter] = useState('CREDITED');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setPage(1);
  }, [limit]);

  const { data, isLoading: loading } = useQuery({
    queryKey: ['admin', 'affiliate-commissions', { page, statusFilter, limit }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), status: statusFilter });
      const response = await fetch(`/api/admin/affiliates/commissions?${params}`);
      const json = await response.json();
      return json.success ? json.data : null;
    },
  });
  const commissions = data?.commissions ?? [];
  const totalPages = data?.pagination?.pages ?? 1;
  const statusTotals: StatusTotals = data?.statusTotals ?? {};

  const handleCommissionAction = async (action: 'reject') => {
    if (selectedCommissions.length === 0) {
      toast({
        title: t.errorTitle,
        description: t.errorNoSelection,
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
          title: t.successTitle,
          description: t.successActionRejected.replace('{count}', String(selectedCommissions.length)),
        });
        queryClient.invalidateQueries({ queryKey: ['admin', 'affiliate-commissions'] });
        setSelectedCommissions([]);
      } else {
        toast({
          title: t.errorTitle,
          description: data.error || t.errorAction,
          variant: 'destructive'
        });
      }
    } catch {
      toast({
        title: t.errorTitle,
        description: t.errorConnection,
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: t.statusPending,
      APPROVED: t.statusApproved,
      CREDITED: t.statusCredited,
      PAID: t.statusPaid,
      CANCELLED: t.statusCancelled,
    };
    return labels[status] ?? status;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: { variant: 'secondary' as const, icon: Clock },
      APPROVED: { variant: 'default' as const, icon: CheckCircle },
      CREDITED: { variant: 'default' as const, icon: CheckCircle },
      PAID: { variant: 'default' as const, icon: CreditCard },
      CANCELLED: { variant: 'destructive' as const, icon: XCircle }
    };

    const config = variants[status as keyof typeof variants] || variants.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {getStatusLabel(status)}
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
      {/* Status metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(statusTotals).map(([status, data]) => (
          <Card key={status}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {getStatusLabel(status)}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.total)}</div>
              <p className="text-xs text-muted-foreground">
                {data.count > 1
                  ? t.commissionCountPlural.replace('{count}', String(data.count))
                  : t.commissionCount.replace('{count}', String(data.count))}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Commission management */}
      <Card>
        <CardHeader>
          <CardTitle>{t.managementTitle}</CardTitle>
          <CardDescription>
            {t.managementDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder={t.filterStatus} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CREDITED">{t.statusCredited}</SelectItem>
                <SelectItem value="PENDING">{t.statusPending}</SelectItem>
                <SelectItem value="APPROVED">{t.statusApproved}</SelectItem>
                <SelectItem value="PAID">{t.statusPaid}</SelectItem>
                <SelectItem value="CANCELLED">{t.statusCancelled}</SelectItem>
              </SelectContent>
            </Select>

            {selectedCommissions.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => handleCommissionAction('reject')}
                  disabled={processing}
                  size="sm"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {t.rejectBtn.replace('{count}', String(selectedCommissions.length))}
                </Button>
              </div>
            )}
          </div>

          {/* Commissions table */}
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
                  <TableHead>{t.colAffiliate}</TableHead>
                  <TableHead>{t.colAmount}</TableHead>
                  <TableHead>{t.colReferral}</TableHead>
                  <TableHead>{t.colTrade}</TableHead>
                  <TableHead>{t.colDate}</TableHead>
                  <TableHead>{t.colStatus}</TableHead>
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
                            {commission.affiliate.user.steamUsername || t.defaultUser}
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
                            {commission.referral.referredUser.steamUsername || t.defaultUser}
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
                            {t.paidAt.replace('{date}', formatDate(commission.paidAt))}
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
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-slate-300 text-sm">{t.perPage || 'Par page'}:</Label>
              <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
                <SelectTrigger className="w-24">
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
              <p className="text-sm text-muted-foreground">
                {t.page.replace('{page}', String(page)).replace('{total}', String(totalPages))}
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  {t.previous}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  {t.next}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
