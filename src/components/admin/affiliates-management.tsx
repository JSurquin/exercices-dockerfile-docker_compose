'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SafeImg } from '@/components/ui/safe-image';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  TrendingUp,
  DollarSign,
  Search,
  Filter,
  Edit,
  ToggleLeft,
  ToggleRight,
  Eye,
  UserCheck,
  Settings,
  UserX,
  Check,
  X,
  Loader2,
  UserMinus,
  BarChart3,
} from 'lucide-react';
import AffiliateTools from './affiliate-tools';
import { CreateAffiliateDialog } from './create-affiliate-dialog';
import { AffiliateReferralsList } from './affiliate-referrals-list';
import { queryKeys } from '@/lib/query-keys';
import { useLocale } from '@/components/providers/locale-provider';

interface AffiliateData {
  id: string;
  code: string;
  totalReferrals: number;
  totalVolumeCents: number;
  totalCommissionCents: number;
  commissionRate: number;
  isActive: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    steamUsername?: string;
    steamAvatar?: string;
    createdAt: string;
    kycStatus: string;
  };
  _count: {
    referrals: number;
    commissions: number;
  };
  metrics?: {
    totalReferredUsers: number;
    churnedUsers: number;
    activeReferrals: number;
    activeSellingUsers: number;
  };
}

interface GlobalStats {
  totalAffiliates: number;
  totalReferrals: number;
  totalVolume: number;
  totalCommissions: number;
}

export default function AffiliatesManagement() {
  const { messages } = useLocale();
  const t = messages.admin.affiliatesManagement;

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string | null>(null);
  const [editingCommissionRate, setEditingCommissionRate] = useState(false);
  const [newCommissionRate, setNewCommissionRate] = useState(0);
  const [editingCode, setEditingCode] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const affiliateToRemoveRef = useRef<AffiliateData | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [limit]);

  const defaultGlobalStats: GlobalStats = {
    totalAffiliates: 0,
    totalReferrals: 0,
    totalVolume: 0,
    totalCommissions: 0,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.adminAffiliates({ page, search: debouncedSearch, status: statusFilter, limit }),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: debouncedSearch,
        status: statusFilter,
      });
      const response = await fetch(`/api/admin/affiliates?${params}`);
      return response.json();
    },
    placeholderData: keepPreviousData,
  });

  const affiliates: AffiliateData[] = data?.data?.affiliates ?? [];
  const globalStats: GlobalStats = data?.data?.globalStats ?? defaultGlobalStats;
  const totalPages: number = data?.data?.pagination?.pages ?? 1;

  const { data: detailsData, isLoading: detailsLoading } = useQuery({
    queryKey: ['admin', 'affiliates', selectedAffiliateId, 'details'],
    queryFn: async () => {
      const res = await fetch(`/api/admin/affiliates/${selectedAffiliateId}`);
      if (!res.ok) throw new Error('details');
      return res.json();
    },
    enabled: !!selectedAffiliateId,
  });

  const selectedAffiliate: AffiliateData | null = detailsData?.data ?? null;

  const { data: rankingsData } = useQuery({
    queryKey: ['admin', 'affiliates', 'rankings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/affiliates/rankings?limit=15');
      if (!res.ok) throw new Error('rankings');
      return res.json();
    },
  });

  const rankings: Array<{
    affiliateId: string;
    code: string;
    steamUsername: string | null;
    totalVolumeCents: number;
    activeReferrals: number;
    retentionRate: number;
    totalReferredUsers: number;
  }> = rankingsData?.data?.rankings ?? [];

  const invalidateAffiliates = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'affiliates'] });

  const callAffiliateAction = async (action: string, affiliateId: string, extraData: Record<string, unknown>) => {
    const response = await fetch('/api/admin/affiliates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, affiliateId, data: extraData }),
    });
    return response.json();
  };

  const openAffiliateDetails = (affiliate: AffiliateData) => {
    setSelectedAffiliateId(affiliate.id);
    setNewCommissionRate(affiliate.commissionRate * 100);
    setNewCode(affiliate.code);
    setEditingCommissionRate(false);
    setEditingCode(false);
  };

  const closeAffiliateDetails = () => {
    setSelectedAffiliateId(null);
    setEditingCommissionRate(false);
    setEditingCode(false);
  };

  const toggleAffiliateStatus = async (affiliate: AffiliateData) => {
    try {
      const result = await callAffiliateAction('toggle_status', affiliate.id, { currentStatus: affiliate.isActive });
      if (result.success) {
        const status = affiliate.isActive ? t.successToggleDeactivated : t.successToggleActivated;
        toast({ title: t.successTitle, description: t.successToggle.replace('{status}', status) });
        invalidateAffiliates();
      } else {
        toast({ title: t.errorTitle, description: result.error || t.errorStatus, variant: 'destructive' });
      }
    } catch {
      toast({ title: t.errorTitle, description: t.errorConnection, variant: 'destructive' });
    }
  };

  const updateCommissionRate = async () => {
    if (!selectedAffiliate) return;
    try {
      const result = await callAffiliateAction('update_commission_rate', selectedAffiliate.id, {
        oldRate: selectedAffiliate.commissionRate,
        newRate: newCommissionRate / 100,
      });
      if (result.success) {
        toast({ title: t.successTitle, description: t.successCommissionRate });
        setEditingCommissionRate(false);
        invalidateAffiliates();
        queryClient.invalidateQueries({ queryKey: ['admin', 'affiliates', selectedAffiliate.id, 'details'] });
      } else {
        toast({ title: t.errorTitle, description: result.error || t.errorUpdate, variant: 'destructive' });
      }
    } catch {
      toast({ title: t.errorTitle, description: t.errorConnection, variant: 'destructive' });
    }
  };

  const updateCode = async () => {
    if (!selectedAffiliate) return;
    try {
      const result = await callAffiliateAction('update_code', selectedAffiliate.id, {
        oldCode: selectedAffiliate.code,
        newCode: newCode,
      });
      if (result.success) {
        toast({ title: t.successTitle, description: t.successCode });
        setEditingCode(false);
        invalidateAffiliates();
        queryClient.invalidateQueries({ queryKey: ['admin', 'affiliates', selectedAffiliate.id, 'details'] });
      } else {
        toast({ title: t.errorTitle, description: result.error || t.errorUpdate, variant: 'destructive' });
      }
    } catch {
      toast({ title: t.errorTitle, description: t.errorConnection, variant: 'destructive' });
    }
  };

  const openRemoveConfirm = (affiliate: AffiliateData) => {
    affiliateToRemoveRef.current = affiliate;
    setRemoveConfirmOpen(true);
  };

  const removeAffiliate = async () => {
    const affiliate = affiliateToRemoveRef.current;
    if (!affiliate) return;

    setIsRemoving(true);
    try {
      const result = await callAffiliateAction('remove_affiliate', affiliate.id, {});
      if (result.success) {
        const userName = affiliate.user.steamUsername || affiliate.user.email;
        toast({
          title: t.affiliationRemovedTitle,
          description: t.affiliationRemovedDesc.replace('{user}', userName),
        });
        setRemoveConfirmOpen(false);
        closeAffiliateDetails();
        affiliateToRemoveRef.current = null;
        invalidateAffiliates();
      } else {
        toast({ title: t.errorTitle, description: result.error || t.errorRemove, variant: 'destructive' });
      }
    } catch {
      toast({ title: t.errorTitle, description: t.errorConnection, variant: 'destructive' });
    } finally {
      setIsRemoving(false);
    }
  };

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR');

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">{t.statActiveAffiliates}</CardTitle>
            <UserCheck className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{globalStats.totalAffiliates}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">{t.statTotalReferrals}</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{globalStats.totalReferrals}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">{t.statGeneratedVolume}</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(globalStats.totalVolume)}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">{t.statTotalCommissions}</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(globalStats.totalCommissions)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main affiliates list */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">{t.managementTitle}</CardTitle>
          <CardDescription className="text-slate-400">{t.managementDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.searchPlaceholder}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 pr-10"
                />
                {isFetching && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 text-muted-foreground animate-spin" />
                )}
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder={t.filterAll} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.filterAll}</SelectItem>
                <SelectItem value="active">{t.filterActive}</SelectItem>
                <SelectItem value="inactive">{t.filterInactive}</SelectItem>
              </SelectContent>
            </Select>
            <CreateAffiliateDialog onAffiliateCreated={invalidateAffiliates} />
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.colAffiliate}</TableHead>
                  <TableHead>{t.colCode}</TableHead>
                  <TableHead>{t.colReferrals}</TableHead>
                  <TableHead>{t.colVolume}</TableHead>
                  <TableHead>{t.colCommissions}</TableHead>
                  <TableHead>{t.colRate}</TableHead>
                  <TableHead>{t.colStatus}</TableHead>
                  <TableHead>{t.colActions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      {t.noAffiliates}
                    </TableCell>
                  </TableRow>
                ) : affiliates.map((affiliate) => (
                  <TableRow
                    key={affiliate.id}
                    className={selectedAffiliateId === affiliate.id ? 'bg-slate-700/30' : undefined}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <SafeImg
                          src={affiliate.user.steamAvatar || '/images/default-avatar.png'}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full"
                          fallbackClassName="w-8 h-8 rounded-full"
                          fallbackIcon={<UserCircleIcon className="w-5 h-5" />}
                        />
                        <div>
                          <p className="font-medium">
                            {affiliate.user.steamUsername || t.defaultUser}
                          </p>
                          <p className="text-sm text-muted-foreground">{affiliate.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm">{affiliate.code}</code>
                    </TableCell>
                    <TableCell>{affiliate.totalReferrals}</TableCell>
                    <TableCell>{formatCurrency(affiliate.totalVolumeCents)}</TableCell>
                    <TableCell>{formatCurrency(affiliate.totalCommissionCents)}</TableCell>
                    <TableCell>{(affiliate.commissionRate * 100).toFixed(1)}%</TableCell>
                    <TableCell>
                      <Badge variant={affiliate.isActive ? 'default' : 'secondary'}>
                        {affiliate.isActive ? t.statusActive : t.statusInactive}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title={t.tooltipViewDetails}
                          onClick={() => openAffiliateDetails(affiliate)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title={affiliate.isActive ? t.successToggleDeactivated : t.successToggleActivated}
                          onClick={() => toggleAffiliateStatus(affiliate)}
                        >
                          {affiliate.isActive ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title={t.tooltipRemoveAffiliate}
                          onClick={() => openRemoveConfirm(affiliate)}
                        >
                          <UserX className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

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
                <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                  {t.previous}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                  {t.next}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rankings */}
      {rankings.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t.rankingsTitle}
            </CardTitle>
            <CardDescription className="text-slate-400">{t.rankingsDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-slate-700 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-400">#</TableHead>
                    <TableHead className="text-slate-400">{t.colAffiliate}</TableHead>
                    <TableHead className="text-slate-400">{t.colCode}</TableHead>
                    <TableHead className="text-slate-400">{t.colVolume}</TableHead>
                    <TableHead className="text-slate-400">{t.rankingsActiveReferrals}</TableHead>
                    <TableHead className="text-slate-400">{t.rankingsRetention}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankings.map((row, idx) => (
                    <TableRow key={row.affiliateId} className="border-slate-700">
                      <TableCell className="text-slate-300">{idx + 1}</TableCell>
                      <TableCell className="text-white">{row.steamUsername || row.code}</TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">{row.code}</code>
                      </TableCell>
                      <TableCell className="text-white">{formatCurrency(row.totalVolumeCents)}</TableCell>
                      <TableCell className="text-white">{row.activeReferrals}</TableCell>
                      <TableCell className="text-emerald-400">
                        {(row.retentionRate * 100).toFixed(0)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin tools */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Settings className="h-5 w-5" />
            {t.adminToolsTitle}
          </CardTitle>
          <CardDescription className="text-slate-400">{t.adminToolsDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <AffiliateTools />
        </CardContent>
      </Card>

      {/* Affiliate details dialog */}
      <Dialog open={!!selectedAffiliateId} onOpenChange={(open) => { if (!open) closeAffiliateDetails(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">{t.detailsTitle}</DialogTitle>
            <DialogDescription className="text-slate-400">{t.detailsDesc}</DialogDescription>
          </DialogHeader>

          {detailsLoading || !selectedAffiliate ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile header */}
              <div className="flex items-center gap-4">
                <SafeImg
                  src={selectedAffiliate.user.steamAvatar || '/images/default-avatar.png'}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full"
                  fallbackClassName="w-12 h-12 rounded-full"
                  fallbackIcon={<UserCircleIcon className="w-7 h-7" />}
                />
                <div>
                  <p className="text-lg font-semibold text-white">
                    {selectedAffiliate.user.steamUsername || t.defaultUser}
                  </p>
                  <p className="text-sm text-slate-400">{selectedAffiliate.user.email}</p>
                </div>
                <Badge variant={selectedAffiliate.isActive ? 'default' : 'secondary'} className="ml-auto">
                  {selectedAffiliate.isActive ? t.statusActive : t.statusInactive}
                </Badge>
              </div>

              {/* Performance */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {t.statGeneratedVolume}
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-center">
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(selectedAffiliate.totalVolumeCents)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{t.labelVolume}</p>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-400">
                      {formatCurrency(selectedAffiliate.totalCommissionCents)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{t.labelCommissions}</p>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-center">
                    {editingCommissionRate ? (
                      <div className="flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          value={newCommissionRate}
                          onChange={(e) => setNewCommissionRate(parseFloat(e.target.value))}
                          min="0"
                          max="100"
                          step="0.1"
                          className="w-16 h-8 text-center"
                        />
                        <span className="text-sm">%</span>
                        <Button size="sm" variant="ghost" onClick={updateCommissionRate}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingCommissionRate(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-2xl font-bold text-white">
                          {(selectedAffiliate.commissionRate * 100).toFixed(1)}%
                        </p>
                        <Button variant="ghost" size="sm" onClick={() => setEditingCommissionRate(true)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-1">{t.labelCommissionRate}</p>
                  </div>
                </div>
              </section>

              <Separator className="bg-slate-700" />

              {/* Referrals */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t.referrals.title}
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-center">
                    <p className="text-xl font-bold text-white">
                      {selectedAffiliate.metrics?.activeReferrals ?? selectedAffiliate.totalReferrals}
                    </p>
                    <p className="text-xs text-slate-400">{t.referrals.tabActive}</p>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-center">
                    <p className="text-xl font-bold text-white">
                      {selectedAffiliate.metrics?.churnedUsers ?? 0}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                      <UserMinus className="h-3 w-3" />
                      {t.referrals.tabChurned}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-center">
                    <p className="text-xl font-bold text-white">
                      {selectedAffiliate.metrics?.totalReferredUsers ?? selectedAffiliate.totalReferrals}
                    </p>
                    <p className="text-xs text-slate-400">{t.labelReferrals}</p>
                  </div>
                </div>
                <AffiliateReferralsList affiliateId={selectedAffiliate.id} />
              </section>

              <Separator className="bg-slate-700" />

              {/* Profile / history */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                  {t.detailsTitle}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-slate-400">{t.labelMemberSince}</Label>
                    <p className="font-medium text-white">{formatDate(selectedAffiliate.user.createdAt)}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">{t.labelAffiliateSince}</Label>
                    <p className="font-medium text-white">{formatDate(selectedAffiliate.createdAt)}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">{t.labelKycStatus}</Label>
                    <Badge variant={selectedAffiliate.user.kycStatus === 'VERIFIED' ? 'default' : 'secondary'}>
                      {selectedAffiliate.user.kycStatus}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-slate-400">{t.labelAffiliateCode}</Label>
                    {editingCode ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          value={newCode}
                          onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                          maxLength={20}
                          className="w-32 font-mono uppercase h-8"
                        />
                        <Button size="sm" onClick={updateCode}><Check className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingCode(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-mono font-medium text-white">{selectedAffiliate.code}</p>
                        <Button variant="ghost" size="sm" onClick={() => { setNewCode(selectedAffiliate.code); setEditingCode(true); }}>
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <div className="pt-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => openRemoveConfirm(selectedAffiliate)}
                  className="w-full"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  {t.removeAffiliation}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove affiliation confirmation */}
      <Dialog open={removeConfirmOpen} onOpenChange={(open) => { if (!open && !isRemoving) setRemoveConfirmOpen(false); }}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-500" />
              {t.removeTitle}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {t.removeDesc
                .replace('{user}', affiliateToRemoveRef.current?.user.steamUsername || affiliateToRemoveRef.current?.user.email || '')
                .replace('{code}', affiliateToRemoveRef.current?.code || '')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setRemoveConfirmOpen(false)}
              disabled={isRemoving}
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={removeAffiliate}
              disabled={isRemoving}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t.removing}
                </>
              ) : (
                <>
                  <UserX className="h-4 w-4 mr-2" />
                  {t.removeAffiliation}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
