'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  User,
  CloudDownload,
  ShieldCheck,
  ShieldX,
  Loader2,
} from 'lucide-react';
import { useLocale } from '@/components/providers/locale-provider';
import { prismaKycStatusToAdminBadgeKey } from '@/lib/status-mapper';
import { AdminUserLink } from '@/components/admin/admin-user-link';

interface KycUser {
  userId: string;
  steamUsername: string | null;
  steamId: string | null;
  steamAvatar: string | null;
  name: string | null;
  email: string;
  kycStatus: string;
  kycaidApplicantId: string | null;
  hasKycRequest: boolean;
  createdAt: string;
  latestVerification: {
    kycaidVerificationId: string;
    status: string;
    verified: boolean;
    createdAt: string;
    completedAt: string | null;
    declineReasons: string[];
  } | null;
  latestDocument: {
    id: string;
    type: string;
    status: string;
    uploadedAt: string;
    reviewedAt: string | null;
    rejectionReason: string | null;
  } | null;
}

export function AdminKYCManagement() {
  const { messages } = useLocale();
  const t = messages.admin.kycManagement;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [syncing, setSyncing] = useState(false);
  const [syncingUserId, setSyncingUserId] = useState<string | null>(null);
  const [manualAction, setManualAction] = useState<{
    open: boolean;
    user: KycUser | null;
    action: 'verify' | 'reject';
  }>({ open: false, user: null, action: 'verify' });
  const [manualReason, setManualReason] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const queryParams = { status: statusFilter, search: debouncedSearch, page, limit };

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: queryKeys.adminKyc(queryParams as any),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (debouncedSearch) params.append('search', debouncedSearch);
      params.append('page', String(page));
      params.append('limit', String(limit));
      const res = await fetch(`/api/admin/kyc?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t.loadError);
      return json;
    },
    placeholderData: keepPreviousData,
  });

  const users: KycUser[] = data?.users ?? [];

  // ─── Sync all pending ───────────────────────────────────────────────────────
  const handleSyncAllPending = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/admin/kyc/sync-pending', { method: 'POST' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || t.syncErrorDesc);
      toast({
        title: t.syncDoneTitle,
        description: t.syncDoneDesc
          .replace('{verified}', String(d.verified))
          .replace('{rejected}', String(d.rejected))
          .replace('{unchanged}', String(d.unchanged))
          .replace('{errors}', String(d.errors))
          .replace('{total}', String(d.total)),
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminKyc(queryParams as any) });
    } catch (err) {
      toast({ title: t.syncErrorTitle, description: err instanceof Error ? err.message : t.syncErrorDesc, variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  // ─── Sync one user ───────────────────────────────────────────────────────────
  const handleSyncUser = async (userId: string) => {
    setSyncingUserId(userId);
    try {
      const res = await fetch(`/api/admin/kyc/force-verify/${userId}`, { method: 'POST' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || t.syncErrorDesc);
      if (d.success) {
        toast({
          title: t.statusUpdatedTitle,
          description: t.singleUserSyncDesc
            .replace('{status}', String(d.newStatus))
            .replace('{source}', String(d.source ?? '')),
        });
      } else {
        toast({
          title: t.kycaidUnresolvedTitle,
          description:
            d.message ||
            t.kycaidStatusLine.replace('{status}', String(d.kycaidStatus ?? t.kycUnknown)),
          variant: 'destructive',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminKyc(queryParams as any) });
    } catch (err) {
      toast({ title: t.errorTitle, description: err instanceof Error ? err.message : t.syncErrorDesc, variant: 'destructive' });
    } finally {
      setSyncingUserId(null);
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const getKYCBadge = (u: KycUser) => {
    if (!u.hasKycRequest) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 border-slate-500 text-slate-300">
          <User className="h-3 w-3" />
          {t.statusNoRequest}
        </Badge>
      );
    }

    const key = prismaKycStatusToAdminBadgeKey(u.kycStatus);
    const cfg = {
      pending:     { variant: 'secondary' as const, icon: Clock,         label: t.statusPending    },
      in_progress: { variant: 'default'   as const, icon: ShieldCheck,   label: t.statusInProgress },
      verified:    { variant: 'default'   as const, icon: CheckCircle,   label: t.statusVerified   },
      rejected:    { variant: 'destructive' as const, icon: XCircle,     label: t.statusRejected   },
    }[key];
    const Icon = cfg.icon;
    return (
      <Badge variant={cfg.variant} className={`flex items-center gap-1 ${key === 'verified' ? 'bg-green-600 hover:bg-green-700' : ''}`}>
        <Icon className="h-3 w-3" />
        {cfg.label}
      </Badge>
    );
  };

  const getDocumentTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      ID_CARD: t.docIdCard,
      PASSPORT: t.docPassport,
      DOMESTIC_PASSPORT: t.docPassport,
      SELFIE: t.docSelfie,
      PROOF_OF_ADDRESS: t.docProofOfAddress,
    };
    return map[type?.toUpperCase()] ?? type ?? '-';
  };

  const fmt = (d: string | null | undefined) =>
    d ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d)) : '-';

  const displayName = (u: KycUser) =>
    u.steamUsername || u.name || u.email || u.userId;

  const openManualAction = (user: KycUser, action: 'verify' | 'reject') => {
    setManualReason('');
    setManualAction({ open: true, user, action });
  };

  const handleManualAction = async () => {
    if (!manualAction.user) return;
    const reason = manualReason.trim();
    if (!reason) {
      toast({ title: t.errorTitle, description: t.manualReasonRequired, variant: 'destructive' });
      return;
    }

    setManualSubmitting(true);
    const u = manualAction.user;
    const isVerify = manualAction.action === 'verify';
    try {
      const params = isVerify ? '?force=true' : '?forceReject=true';
      const r = await fetch(`/api/admin/kyc/force-verify/${u.userId}${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d?.success || !d?.newStatus) {
        toast({
          title: t.errorTitle,
          description: d?.error || d?.message || t.kycSyncErrorDesc,
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: isVerify ? t.kycForcedTitle : t.rejectResultTitle,
        description: t.kycForcedDesc.replace('{status}', d.newStatus),
      });
      setManualAction({ open: false, user: null, action: 'verify' });
      setManualReason('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminKyc(queryParams as any) });
    } catch (err) {
      toast({
        title: t.errorTitle,
        description: err instanceof Error ? err.message : t.kycSyncErrorDesc,
        variant: 'destructive',
      });
    } finally {
      setManualSubmitting(false);
    }
  };

  const exportKYC = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      const res = await fetch(`/api/admin/kyc/export?${params}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `kyc-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a); a.click();
      URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch { /* silent */ }
  };

  if (isLoading && !data) return <TableSkeleton />;

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-500">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span>{(error as Error).message}</span>
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
          <Select value={statusFilter || 'all'} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-48 bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder={t.filterByStatus} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allStatuses}</SelectItem>
              <SelectItem value="pending">{t.pendingInProgress}</SelectItem>
              <SelectItem value="verified">{t.verified}</SelectItem>
              <SelectItem value="rejected">{t.rejected}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.adminKyc(queryParams as any) })}
            variant="outline" size="sm"
            className="border-slate-600 text-white hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t.refresh}</span>
          </Button>

          <Button
            onClick={handleSyncAllPending}
            disabled={syncing}
            size="sm"
            className="bg-theme-stat hover:bg-theme-stat/90 text-white"
            title={t.tooltipSyncAllPending}
          >
            {syncing ? <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" /> : <CloudDownload className="h-4 w-4 sm:mr-2" />}
            <span className="hidden sm:inline">{syncing ? t.syncing : t.syncAll}</span>
          </Button>

          <Button onClick={exportKYC} size="sm" className="bg-blue-600 hover:bg-blue-700">
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
                <TableHead className="text-slate-300">{t.colUser}</TableHead>
                <TableHead className="text-slate-300 whitespace-nowrap">{t.colKycStatus}</TableHead>
                <TableHead className="text-slate-300 whitespace-nowrap">{t.colLastDoc}</TableHead>
                <TableHead className="text-slate-300 whitespace-nowrap">{t.colSubmittedAt}</TableHead>
                <TableHead className="text-slate-300 whitespace-nowrap">{t.colCompletedAt}</TableHead>
                <TableHead className="text-slate-300 whitespace-nowrap">{t.colActions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.userId} className="border-slate-700 hover:bg-slate-800/50">
                  <TableCell>
                    <AdminUserLink
                      userId={u.userId}
                      name={displayName(u)}
                      avatar={u.steamAvatar}
                      email={u.email}
                      showEmail
                      subtitle={u.kycaidApplicantId ? u.kycaidApplicantId : undefined}
                    />
                  </TableCell>

                  <TableCell>{getKYCBadge(u)}</TableCell>

                  <TableCell className="text-slate-300 text-sm">
                    {u.latestDocument ? getDocumentTypeLabel(u.latestDocument.type) : '-'}
                  </TableCell>

                  <TableCell className="text-slate-300 text-sm whitespace-nowrap">
                    {u.latestDocument ? fmt(u.latestDocument.uploadedAt) : (u.latestVerification ? fmt(u.latestVerification.createdAt) : '-')}
                  </TableCell>

                  <TableCell className="text-slate-300 text-sm whitespace-nowrap">
                    {u.latestVerification?.completedAt
                      ? fmt(u.latestVerification.completedAt)
                      : u.latestDocument?.reviewedAt
                      ? fmt(u.latestDocument.reviewedAt)
                      : '-'}
                  </TableCell>

                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      {u.hasKycRequest && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={syncingUserId === u.userId}
                          onClick={() => handleSyncUser(u.userId)}
                          className="border-theme-highlight text-theme-highlight hover:bg-theme-highlight/15"
                          title={t.tooltipSyncKycaid}
                        >
                          {syncingUserId === u.userId
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <CloudDownload className="h-4 w-4" />}
                        </Button>
                      )}

                      {u.kycStatus !== 'VERIFIED' && u.kycStatus !== 'KYCAID_VERIFIED' && (
                        u.hasKycRequest ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (!confirm(t.forceVerifyConfirm.replace('{name}', displayName(u)))) return;
                              try {
                                const r = await fetch(`/api/admin/kyc/force-verify/${u.userId}?force=true`, { method: 'POST' });
                                const d = await r.json().catch(() => ({}));
                                if (!r.ok || !d?.success || !d?.newStatus) {
                                  toast({
                                    title: t.errorTitle,
                                    description: d?.error || d?.message || t.kycSyncErrorDesc,
                                    variant: 'destructive',
                                  });
                                  return;
                                }
                                toast({ title: t.kycForcedTitle, description: t.kycForcedDesc.replace('{status}', d.newStatus) });
                                queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
                                queryClient.invalidateQueries({ queryKey: queryKeys.adminKyc(queryParams as any) });
                              } catch (err) {
                                toast({
                                  title: t.errorTitle,
                                  description: err instanceof Error ? err.message : t.kycSyncErrorDesc,
                                  variant: 'destructive',
                                });
                              }
                            }}
                            className="border-green-700 text-green-400 hover:bg-green-900/30"
                            title={t.tooltipForceVerify}
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openManualAction(u, 'verify')}
                            className="border-green-700 text-green-400 hover:bg-green-900/30"
                            title={t.tooltipForceVerify}
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </Button>
                        )
                      )}

                      {u.kycStatus !== 'REJECTED' && u.kycStatus !== 'KYCAID_REJECTED' && (
                        u.hasKycRequest ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (!confirm(t.rejectConfirm.replace('{name}', displayName(u)))) return;
                              try {
                                const r = await fetch(`/api/admin/kyc/force-verify/${u.userId}`, { method: 'POST' });
                                const d = await r.json().catch(() => ({}));
                                if (!r.ok) {
                                  toast({
                                    title: t.errorTitle,
                                    description: d?.error || d?.message || t.kycSyncErrorDesc,
                                    variant: 'destructive',
                                  });
                                  return;
                                }
                                toast({
                                  title: t.rejectResultTitle,
                                  description:
                                    d.newStatus === 'VERIFIED'
                                      ? t.kycaidSaysVerified
                                      : t.kycForcedDesc.replace(
                                          '{status}',
                                          String(d.newStatus ?? t.unchanged),
                                        ),
                                });
                                queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
                                queryClient.invalidateQueries({ queryKey: queryKeys.adminKyc(queryParams as any) });
                              } catch (err) {
                                toast({
                                  title: t.errorTitle,
                                  description: err instanceof Error ? err.message : t.kycSyncErrorDesc,
                                  variant: 'destructive',
                                });
                              }
                            }}
                            className="border-red-700 text-red-400 hover:bg-red-900/30"
                            title={t.tooltipForceReject}
                          >
                            <ShieldX className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openManualAction(u, 'reject')}
                            className="border-red-700 text-red-400 hover:bg-red-900/30"
                            title={t.tooltipForceRejectManual}
                          >
                            <ShieldX className="h-4 w-4" />
                          </Button>
                        )
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
        open={manualAction.open}
        onOpenChange={(open) => {
          if (!open) {
            setManualAction({ open: false, user: null, action: 'verify' });
            setManualReason('');
          }
        }}
      >
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>
              {manualAction.action === 'verify' ? t.manualVerifyTitle : t.manualRejectTitle}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {(manualAction.action === 'verify' ? t.manualVerifyDesc : t.manualRejectDesc).replace(
                '{name}',
                manualAction.user ? displayName(manualAction.user) : '',
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="manual-kyc-reason" className="text-slate-300">
              {t.manualReasonLabel}
            </Label>
            <Input
              id="manual-kyc-reason"
              value={manualReason}
              onChange={(e) => setManualReason(e.target.value)}
              placeholder={t.manualReasonPlaceholder}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setManualAction({ open: false, user: null, action: 'verify' });
                setManualReason('');
              }}
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              {t.manualCancel}
            </Button>
            <Button
              onClick={handleManualAction}
              disabled={manualSubmitting}
              className={
                manualAction.action === 'verify'
                  ? 'bg-green-700 hover:bg-green-800'
                  : 'bg-red-700 hover:bg-red-800'
              }
            >
              {manualSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t.manualConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {data?.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
            <span className="text-slate-400 text-sm">
              {t.page.replace('{page}', String(page)).replace('{total}', String(data.totalPages))}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="border-slate-600 text-white">{t.previous}</Button>
              <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}
                className="border-slate-600 text-white">{t.next}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="h-10 bg-slate-600 rounded w-1/3 animate-pulse" />
        <div className="h-10 bg-slate-600 rounded w-32 animate-pulse" />
        <div className="h-10 bg-slate-600 rounded w-24 animate-pulse" />
      </div>
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-600 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
