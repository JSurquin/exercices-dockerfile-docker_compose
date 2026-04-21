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

interface KycUser {
  userId: string;
  steamUsername: string | null;
  steamId: string | null;
  steamAvatar: string | null;
  name: string | null;
  email: string;
  kycStatus: string;
  kycaidApplicantId: string | null;
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
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const [syncing, setSyncing] = useState(false);
  const [syncingUserId, setSyncingUserId] = useState<string | null>(null);

  const queryParams = { status: statusFilter, search: searchTerm, page };

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.adminKyc(queryParams as any),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', String(page));
      params.append('limit', '20');
      const res = await fetch(`/api/admin/kyc?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur chargement KYC');
      return json;
    },
  });

  const users: KycUser[] = data?.users ?? [];

  // ─── Sync all pending ───────────────────────────────────────────────────────
  const handleSyncAllPending = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/admin/kyc/sync-pending', { method: 'POST' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Erreur sync');
      toast({
        title: 'Sync KYCAID terminée',
        description: `${d.verified} vérifiés · ${d.rejected} rejetés · ${d.unchanged} inchangés · ${d.errors} erreurs (sur ${d.total} utilisateurs).`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminKyc(queryParams as any) });
    } catch (err) {
      toast({ title: 'Erreur sync', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' });
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
      if (!res.ok) throw new Error(d.error || 'Erreur');
      if (d.success) {
        toast({ title: 'Statut mis à jour', description: `→ ${d.newStatus} (source : ${d.source})` });
      } else {
        toast({ title: 'KYCAID non résolu', description: d.message || `Status KYCAID : ${d.kycaidStatus}`, variant: 'destructive' });
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminKyc(queryParams as any) });
    } catch (err) {
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Erreur', variant: 'destructive' });
    } finally {
      setSyncingUserId(null);
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const getKYCBadge = (kycStatus: string) => {
    const key = prismaKycStatusToAdminBadgeKey(kycStatus);
    const cfg = {
      pending:     { variant: 'secondary' as const, icon: Clock,         label: 'En attente' },
      in_progress: { variant: 'default'   as const, icon: ShieldCheck,   label: 'En cours'   },
      verified:    { variant: 'default'   as const, icon: CheckCircle,   label: 'Vérifié'    },
      rejected:    { variant: 'destructive' as const, icon: XCircle,     label: 'Rejeté'     },
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
      ID_CARD: "Carte d'identité",
      PASSPORT: 'Passeport',
      DOMESTIC_PASSPORT: 'Passeport',
      SELFIE: 'Selfie',
      PROOF_OF_ADDRESS: 'Justificatif de domicile',
    };
    return map[type?.toUpperCase()] ?? type ?? '—';
  };

  const fmt = (d: string | null | undefined) =>
    d ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d)) : '—';

  const displayName = (u: KycUser) =>
    u.steamUsername || u.name || u.email || u.userId;

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

  if (isLoading) return <TableSkeleton />;

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
              placeholder="Rechercher par pseudo Steam, email, Steam ID…"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="pl-10 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <Select value={statusFilter || 'all'} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-48 bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente / En cours</SelectItem>
              <SelectItem value="verified">Vérifié</SelectItem>
              <SelectItem value="rejected">Rejeté</SelectItem>
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
            <span className="hidden sm:inline">Actualiser</span>
          </Button>

          <Button
            onClick={handleSyncAllPending}
            disabled={syncing}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white"
            title="Interroge KYCAID pour tous les users en attente et met à jour la DB"
          >
            {syncing ? <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" /> : <CloudDownload className="h-4 w-4 sm:mr-2" />}
            <span className="hidden sm:inline">{syncing ? 'Sync…' : 'Sync KYCAID (tous)'}</span>
          </Button>

          <Button onClick={exportKYC} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Exporter</span>
          </Button>
        </div>
      </div>

      {/* Table — 1 ligne par utilisateur */}
      <Card className="bg-slate-800/30 border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Utilisateur</TableHead>
                <TableHead className="text-slate-300 whitespace-nowrap">Statut KYC réel</TableHead>
                <TableHead className="text-slate-300 whitespace-nowrap">Dernier doc</TableHead>
                <TableHead className="text-slate-300 whitespace-nowrap">Soumis le</TableHead>
                <TableHead className="text-slate-300 whitespace-nowrap">Complété le</TableHead>
                <TableHead className="text-slate-300 whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.userId} className="border-slate-700 hover:bg-slate-800/50">
                  {/* Utilisateur */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.steamAvatar ?? undefined} alt={displayName(u)} />
                        <AvatarFallback className="bg-slate-600 text-slate-300">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-white">{displayName(u)}</div>
                        <div className="text-xs text-slate-400 space-x-1">
                          {u.steamId && <span>Steam: {u.steamId}</span>}
                          {u.steamId && u.email && <span>·</span>}
                          <span>{u.email}</span>
                        </div>
                        {u.kycaidApplicantId && (
                          <div className="text-xs text-slate-500 font-mono truncate max-w-[200px]" title={u.kycaidApplicantId}>
                            {u.kycaidApplicantId}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Statut réel depuis User.kycStatus */}
                  <TableCell>{getKYCBadge(u.kycStatus)}</TableCell>

                  {/* Dernier document */}
                  <TableCell className="text-slate-300 text-sm">
                    {u.latestDocument ? getDocumentTypeLabel(u.latestDocument.type) : '—'}
                  </TableCell>

                  {/* Date soumission */}
                  <TableCell className="text-slate-300 text-sm whitespace-nowrap">
                    {u.latestDocument ? fmt(u.latestDocument.uploadedAt) : (u.latestVerification ? fmt(u.latestVerification.createdAt) : '—')}
                  </TableCell>

                  {/* Date complétion */}
                  <TableCell className="text-slate-300 text-sm whitespace-nowrap">
                    {u.latestVerification?.completedAt
                      ? fmt(u.latestVerification.completedAt)
                      : u.latestDocument?.reviewedAt
                      ? fmt(u.latestDocument.reviewedAt)
                      : '—'}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      {/* Sync depuis KYCAID */}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={syncingUserId === u.userId}
                        onClick={() => handleSyncUser(u.userId)}
                        className="border-amber-600 text-amber-400 hover:bg-amber-900/30"
                        title="Interroger KYCAID et mettre à jour le statut"
                      >
                        {syncingUserId === u.userId
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <CloudDownload className="h-4 w-4" />}
                      </Button>

                      {/* Force vérifié (override admin) */}
                      {u.kycStatus !== 'VERIFIED' && u.kycStatus !== 'KYCAID_VERIFIED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm(`Forcer la vérification KYC de ${displayName(u)} sans passer par KYCAID ?`)) {
                              fetch(`/api/admin/kyc/force-verify/${u.userId}?force=true`, { method: 'POST' })
                                .then((r) => r.json())
                                .then((d) => {
                                  toast({ title: 'KYC forcé', description: `Statut → ${d.newStatus}` });
                                  queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
                                  queryClient.invalidateQueries({ queryKey: queryKeys.adminKyc(queryParams as any) });
                                });
                            }
                          }}
                          className="border-green-700 text-green-400 hover:bg-green-900/30"
                          title="Forcer VERIFIED manuellement (override admin)"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Force rejeté */}
                      {u.kycStatus !== 'REJECTED' && u.kycStatus !== 'KYCAID_REJECTED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm(`Rejeter manuellement le KYC de ${displayName(u)} ?`)) {
                              fetch(`/api/admin/kyc/force-verify/${u.userId}`, { method: 'POST' })
                                .then((r) => r.json())
                                .then((d) => {
                                  toast({ title: 'Résultat', description: d.newStatus === 'VERIFIED' ? 'KYCAID dit VERIFIED — pas rejeté' : `Statut → ${d.newStatus ?? 'inchangé'}` });
                                  queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
                                  queryClient.invalidateQueries({ queryKey: queryKeys.adminKyc(queryParams as any) });
                                });
                            }
                          }}
                          className="border-red-700 text-red-400 hover:bg-red-900/30"
                          title="Vérifier depuis KYCAID (peut rejeter si KYCAID l'a décliné)"
                        >
                          <ShieldX className="h-4 w-4" />
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
            <p className="text-slate-300">Aucun utilisateur KYC trouvé</p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {data?.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="border-slate-600 text-white">Précédent</Button>
          <span className="text-slate-400 text-sm self-center">Page {page} / {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}
            className="border-slate-600 text-white">Suivant</Button>
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
