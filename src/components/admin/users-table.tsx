'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Download, 
  Eye, 
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  User,
  Clock,
  UserCheck,
  Loader2,
  CloudDownload,
} from 'lucide-react';
import { User as UserType, AdminFilters } from '@/lib/types';
import { prismaKycStatusToAdminBadgeKey } from '@/lib/status-mapper';
import { useLocale } from '@/components/providers/locale-provider';
import { CreateUserDialog } from './create-user-dialog';
import { queryKeys } from '@/lib/query-keys';
import { UserRoleBadge } from '@/components/ui/user-role-badge';

interface PromoteDialogState {
  open: boolean;
  userId: string;
  username: string;
}

export function AdminUsersTable() {
  const { messages } = useLocale();
  const t = messages.admin.usersTable;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filters, setFilters] = useState<AdminFilters>({
    page: 1,
    limit: 20,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setFilters(prev => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [promoteDialog, setPromoteDialog] = useState<PromoteDialogState>({
    open: false,
    userId: '',
    username: '',
  });
  const [promoteCode, setPromoteCode] = useState('');
  const [promoteCommission, setPromoteCommission] = useState('2');
  const [promoting, setPromoting] = useState(false);
  const [syncingKycUserId, setSyncingKycUserId] = useState<string | null>(null);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: queryKeys.adminUsers({ ...filters, search: debouncedSearch }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.role) params.append('role', filters.role);
      if (filters.tag) params.append('tag', filters.tag);
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/admin/users?${params}`);
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || t.errorLoading);
      }
      return json;
    },
    placeholderData: keepPreviousData,
  });

  const users: UserType[] = data?.users ?? [];

  const handleKYCFilter = (status: string) => {
    setFilters(prev => ({ 
      ...prev, 
      status: status === 'all' ? undefined : status,
      page: 1 
    }));
  };

  const handleRoleFilter = (value: string) => {
    if (value === 'all') {
      setFilters(prev => ({ ...prev, role: undefined, tag: undefined, page: 1 }));
    } else if (value.startsWith('tag:')) {
      setFilters(prev => ({ ...prev, role: undefined, tag: value.replace('tag:', ''), page: 1 }));
    } else {
      setFilters(prev => ({ ...prev, role: value, tag: undefined, page: 1 }));
    }
  };

  const getKYCBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: Clock, text: t.kycPending },
      in_progress: { variant: 'default' as const, icon: Shield, text: t.kycInProgress },
      verified: { variant: 'default' as const, icon: CheckCircle, text: t.kycVerified },
      rejected: { variant: 'destructive' as const, icon: XCircle, text: t.kycRejected },
    };

    const key = prismaKycStatusToAdminBadgeKey(status);
    const config = statusConfig[key];
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
    }).format(new Date(date));
  };

  const exportUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/users/export?${params}`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Erreur lors de l\'export:', err);
    }
  };

  const openPromoteDialog = (user: UserType) => {
    setPromoteCode('');
    setPromoteCommission('2');
    setPromoteDialog({ open: true, userId: user.id, username: user.username });
  };

  const handlePromoteAffiliate = async () => {
    const t = messages.admin.promoteAffiliate;
    const rate = parseFloat(promoteCommission);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast({ title: t.errorTitle, description: messages.admin.affiliateCreation.errorInvalidRate, variant: 'destructive' });
      return;
    }

    setPromoting(true);
    try {
      const response = await fetch(`/api/admin/users/${promoteDialog.userId}/promote-affiliate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commissionRate: rate,
          code: promoteCode || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        let description = data.error || t.errorMessage;
        if (data.error?.includes('déjà affilié') || data.error?.includes('already')) {
          description = t.errorAlreadyAffiliate;
        } else if (data.error?.includes('code')) {
          description = t.errorCodeExists;
        }
        throw new Error(description);
      }
      toast({
        title: t.successTitle,
        description: t.successMessage.replace('{code}', data.data.affiliateCode),
      });
      setPromoteDialog({ open: false, userId: '', username: '' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'affiliates'] });
    } catch (err) {
      toast({
        title: messages.admin.promoteAffiliate.errorTitle,
        description: err instanceof Error ? err.message : messages.admin.promoteAffiliate.errorMessage,
        variant: 'destructive',
      });
    } finally {
      setPromoting(false);
    }
  };

  const handleSyncKyc = async (userId: string) => {
    setSyncingKycUserId(userId);
    try {
      const res = await fetch(`/api/admin/kyc/force-verify/${userId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      if (data.success) {
        toast({ title: t.kycUpdated, description: `Statut → ${data.newStatus}` });
      } else {
        toast({
          title: t.kycUpdateFailed,
          description: data.message || `Status KYCAID : ${data.kycaidStatus ?? t.kycUnknown}`,
          variant: 'destructive',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    } catch (err) {
      toast({
        title: t.kycSyncError,
        description: err instanceof Error ? err.message : t.errorUnknown,
        variant: 'destructive',
      });
    } finally {
      setSyncingKycUserId(null);
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
            <span>{t.errorTitle}: {error.message}</span>
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
          
          <Select onValueChange={handleKYCFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder={t.filterByKyc} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allKycStatuses}</SelectItem>
              <SelectItem value="pending">{t.kycPending}</SelectItem>
              <SelectItem value="in_progress">{t.kycInProgress}</SelectItem>
              <SelectItem value="verified">{t.kycVerified}</SelectItem>
              <SelectItem value="rejected">{t.kycRejected}</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={handleRoleFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder={t.filterByRole} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allRoles}</SelectItem>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="AFFILIATE">{t.filterAffiliate}</SelectItem>
              <SelectItem value="MODERATOR">{t.filterModerator}</SelectItem>
              <SelectItem value="tag:VIP">{t.filterVip}</SelectItem>
              <SelectItem value="tag:MERCHANT">{t.filterMerchant}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })}
            variant="outline"
            size="sm"
            className="border-slate-600 text-white hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t.refresh}</span>
          </Button>

          <Button 
            onClick={exportUsers}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t.export}</span>
          </Button>

          <CreateUserDialog onUserCreated={() => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })} />
        </div>
      </div>

      {/* Table */}
      <Card className="bg-slate-800/30 border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700">
              <TableHead className="text-slate-300 whitespace-nowrap">{t.tableUser}</TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">{t.tableSteamId}</TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">{t.tableKyc}</TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">{t.tableLevel}</TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">{t.tableVolume}</TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">{t.tablePendingVol}</TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">{t.tableTickets}</TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">{t.tableJoined}</TableHead>
              <TableHead className="text-slate-300 whitespace-nowrap">{t.tableActions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="border-slate-700 hover:bg-slate-800/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.username} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{user.username}</span>
                        <UserRoleBadge role={user.role} userTag={user.userTag} />
                      </div>
                      <div className="text-xs text-slate-400">ID: {user.id}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm text-slate-300">
                  {user.steamId64}
                </TableCell>
                <TableCell>
                  {getKYCBadge(user.kycStatus)}
                </TableCell>
                <TableCell className="text-white">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {t.levelLabel} {user.level}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {user.xp} XP
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-white">
                  {formatCurrency(user.totalVolume)}
                </TableCell>
                <TableCell className="text-blue-400">
                  {user.pendingVolume ? formatCurrency(user.pendingVolume) : '—'}
                </TableCell>
                <TableCell className="text-slate-300">
                  {user.tickets}
                </TableCell>
                <TableCell className="text-slate-300">
                  {formatDate(user.joinedAt)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-white hover:bg-slate-700"
                      asChild
                    >
                      <Link href={`/admin/users/${user.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {/* Sync KYC depuis KYCAID pour cet utilisateur */}
                    {user.kycStatus !== 'VERIFIED' && user.kycStatus !== 'KYCAID_VERIFIED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={syncingKycUserId === user.id}
                        onClick={() => handleSyncKyc(user.id)}
                        className="border-amber-600 text-amber-400 hover:bg-amber-900/30"
                        title="Interroger KYCAID et mettre à jour le statut KYC"
                      >
                        {syncingKycUserId === user.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <CloudDownload className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    {user.role !== 'AFFILIATE' && user.role !== 'ADMIN' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-purple-600 text-purple-400 hover:bg-purple-900/30 hover:text-purple-300"
                        onClick={() => openPromoteDialog(user)}
                        title={messages.admin.promoteAffiliate.buttonLabel}
                      >
                        <UserCheck className="h-4 w-4" />
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

      {users.length === 0 && (
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="p-8 text-center">
            <p className="text-slate-300">{t.noUsers}</p>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={promoteDialog.open}
        onOpenChange={(open) => setPromoteDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-[420px] bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-purple-400" />
              {messages.admin.promoteAffiliate.dialogTitle}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              <span className="font-semibold text-purple-300">{promoteDialog.username}</span>
              {' — '}
              {messages.admin.promoteAffiliate.dialogDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="promote-code" className="text-white">
                {messages.admin.promoteAffiliate.codeLabel}
              </Label>
              <Input
                id="promote-code"
                type="text"
                placeholder={messages.admin.promoteAffiliate.codePlaceholder}
                value={promoteCode}
                onChange={(e) => setPromoteCode(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promote-commission" className="text-white">
                {messages.admin.promoteAffiliate.commissionRateLabel}
              </Label>
              <Input
                id="promote-commission"
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder={messages.admin.promoteAffiliate.commissionRatePlaceholder}
                value={promoteCommission}
                onChange={(e) => setPromoteCommission(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPromoteDialog((prev) => ({ ...prev, open: false }))}
                disabled={promoting}
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                {messages.common.cancel}
              </Button>
              <Button
                type="button"
                onClick={handlePromoteAffiliate}
                disabled={promoting}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                {promoting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {messages.admin.promoteAffiliate.promoting}
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    {messages.admin.promoteAffiliate.confirmButton}
                  </>
                )}
              </Button>
            </div>
          </div>
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
