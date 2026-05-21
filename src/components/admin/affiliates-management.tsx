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
  Loader2
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
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateData | null>(null);
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
    totalCommissions: 0
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.adminAffiliates({ page, search: debouncedSearch, status: statusFilter, limit }),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: debouncedSearch,
        status: statusFilter
      });
      const response = await fetch(`/api/admin/affiliates?${params}`);
      return response.json();
    },
    placeholderData: keepPreviousData
  });

  const affiliates: AffiliateData[] = data?.data?.affiliates ?? [];
  const globalStats: GlobalStats = data?.data?.globalStats ?? defaultGlobalStats;
  const totalPages: number = data?.data?.pagination?.pages ?? 1;

  const invalidateAffiliates = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'affiliates'] });

  const callAffiliateAction = async (action: string, affiliateId: string, extraData: Record<string, unknown>) => {
    const response = await fetch('/api/admin/affiliates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, affiliateId, data: extraData })
    });
    return response.json();
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
        newRate: newCommissionRate / 100
      });
      if (result.success) {
        toast({ title: t.successTitle, description: t.successCommissionRate });
        setEditingCommissionRate(false);
        setSelectedAffiliate(prev => prev ? { ...prev, commissionRate: newCommissionRate / 100 } : null);
        invalidateAffiliates();
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
        newCode: newCode
      });
      if (result.success) {
        toast({ title: t.successTitle, description: t.successCode });
        setEditingCode(false);
        setSelectedAffiliate(prev => prev ? { ...prev, code: newCode.trim().toUpperCase() } : null);
        invalidateAffiliates();
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
          description: t.affiliationRemovedDesc.replace('{user}', userName)
        });
        setRemoveConfirmOpen(false);
        setSelectedAffiliate(null);
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
      {/* Admin tools */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Settings className="h-5 w-5" />
            {t.adminToolsTitle}
          </CardTitle>
          <CardDescription className="text-slate-400">
            {t.adminToolsDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AffiliateTools />
        </CardContent>
      </Card>

      {/* Global metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Filters and search */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">{t.managementTitle}</CardTitle>
          <CardDescription className="text-slate-400">
            {t.managementDesc}
          </CardDescription>
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

          {/* Affiliates table */}
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
                  <TableRow key={affiliate.id}>
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
                          <p className="text-sm text-muted-foreground">
                            {affiliate.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {affiliate.code}
                      </code>
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
                          onClick={() => {
                            setSelectedAffiliate(affiliate);
                            setNewCommissionRate(affiliate.commissionRate * 100);
                            setNewCode(affiliate.code);
                            setEditingCommissionRate(false);
                            setEditingCode(false);
                          }}
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

      {/* Affiliate details dialog */}
      <Dialog open={!!selectedAffiliate} onOpenChange={(open) => { if (!open) setSelectedAffiliate(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">{t.detailsTitle}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {t.detailsDesc}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAffiliate && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t.labelUsername}</Label>
                  <p className="font-medium">{selectedAffiliate.user.steamUsername}</p>
                </div>
                <div>
                  <Label>{t.labelEmail}</Label>
                  <p className="font-medium">{selectedAffiliate.user.email}</p>
                </div>
                <div>
                  <Label>{t.labelMemberSince}</Label>
                  <p className="font-medium">{formatDate(selectedAffiliate.user.createdAt)}</p>
                </div>
                <div>
                  <Label>{t.labelAffiliateSince}</Label>
                  <p className="font-medium">{formatDate(selectedAffiliate.createdAt)}</p>
                </div>
                <div>
                  <Label>{t.labelKycStatus}</Label>
                  <Badge variant={selectedAffiliate.user.kycStatus === 'VERIFIED' ? 'default' : 'secondary'}>
                    {selectedAffiliate.user.kycStatus}
                  </Badge>
                </div>
              </div>

              {/* Affiliate code */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <Label>{t.labelAffiliateCode}</Label>
                  {!editingCode && (
                    <Button variant="ghost" size="sm" onClick={() => { setNewCode(selectedAffiliate.code); setEditingCode(true); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {editingCode ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      maxLength={20}
                      className="w-40 font-mono uppercase"
                      placeholder="EX: MOON2024"
                    />
                    <Button size="sm" onClick={updateCode}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingCode(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="font-mono font-medium text-lg">{selectedAffiliate.code}</p>
                )}
              </div>

              {/* Commission rate */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <Label>{t.labelCommissionRate}</Label>
                  {!editingCommissionRate && (
                    <Button variant="ghost" size="sm" onClick={() => setEditingCommissionRate(true)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {editingCommissionRate ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={newCommissionRate}
                      onChange={(e) => setNewCommissionRate(parseFloat(e.target.value))}
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-24"
                    />
                    <span>%</span>
                    <Button size="sm" onClick={updateCommissionRate}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingCommissionRate(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="font-medium text-lg">
                    {(selectedAffiliate.commissionRate * 100).toFixed(1)}%
                  </p>
                )}
              </div>

              <AffiliateReferralsList affiliateId={selectedAffiliate.id} />

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold">{selectedAffiliate.totalReferrals}</p>
                  <p className="text-sm text-muted-foreground">{t.labelReferrals}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatCurrency(selectedAffiliate.totalVolumeCents)}</p>
                  <p className="text-sm text-muted-foreground">{t.labelVolume}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatCurrency(selectedAffiliate.totalCommissionCents)}</p>
                  <p className="text-sm text-muted-foreground">{t.labelCommissions}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
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
