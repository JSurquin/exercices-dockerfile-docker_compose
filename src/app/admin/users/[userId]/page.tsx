'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Mail, Hash, RefreshCw } from 'lucide-react';
import { BalanceManagement } from '@/components/admin/balance-management';
import { WithdrawalLimits } from '@/components/admin/withdrawal-limits';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

interface UserDetail {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  steamId: string | null;
  steamUsername: string | null;
  kycStatus: string;
  kycaidApplicantId: string | null;
  level: number;
  xp: number;
  tickets: number;
  totalVolumeCents: number;
  balanceCents: number;
  frozenBalanceCents: number;
  accountFrozen: boolean;
  createdAt: string;
  role: string;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = params?.userId as string | undefined;
  const [resetKycLoading, setResetKycLoading] = useState(false);
  const [resetKycMessage, setResetKycMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: user, isLoading: loading, error: queryError, refetch: refetchUser } = useQuery({
    queryKey: queryKeys.adminUser(userId ?? ''),
    queryFn: async () => {
      if (!userId) return null;
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText);
      }
      return res.json();
    },
    enabled: !!userId,
  });
  const error = queryError instanceof Error ? queryError.message : null;

  const handleResetKycApplicant = async () => {
    if (!userId || !user) return;
    setResetKycMessage(null);
    setResetKycLoading(true);
    try {
      const res = await fetch(`/api/admin/kyc/reset-applicant/${userId}`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      setResetKycMessage({ type: 'success', text: data.message ?? "Applicant réinitialisé." });
      await refetchUser();
    } catch (e) {
      setResetKycMessage({ type: 'error', text: e instanceof Error ? e.message : 'Erreur' });
    } finally {
      setResetKycLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="text-slate-400">Identifiant utilisateur manquant.</div>
    );
  }

  if (loading && !user) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="h-64 bg-slate-800/50 rounded animate-pulse" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" asChild className="border-slate-600 text-slate-300">
          <Link href="/admin/dashboard?tab=users" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour aux utilisateurs
          </Link>
        </Button>
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="p-6">
            <p className="text-red-400">{error || 'Utilisateur non trouvé'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = user.name || user.steamUsername || user.email || user.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button variant="outline" size="sm" asChild className="border-slate-600 text-slate-300 w-fit">
          <Link href="/admin/dashboard?tab=users" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour aux utilisateurs
          </Link>
        </Button>
      </div>

      <Card className="bg-slate-800/30 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.image ?? undefined} alt={displayName} />
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div>{displayName}</div>
              <div className="text-sm font-normal text-slate-400 flex flex-wrap items-center gap-2 mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </span>
                {user.steamId && (
                  <span className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    {user.steamId}
                  </span>
                )}
                <Badge variant="outline" className="text-xs">
                  {user.role}
                </Badge>
                {user.accountFrozen && (
                  <Badge variant="destructive">Compte gelé</Badge>
                )}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {resetKycMessage && (
            <p
              className={
                resetKycMessage.type === 'success'
                  ? 'text-sm text-green-400'
                  : 'text-sm text-red-400'
              }
            >
              {resetKycMessage.text}
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-400">KYC</p>
            <p className="text-white">{user.kycStatus}</p>
            {user.kycaidApplicantId && (
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[180px]" title={user.kycaidApplicantId}>
                {user.kycaidApplicantId}
              </p>
            )}
          </div>
          <div>
            <p className="text-slate-400">Niveau / XP</p>
            <p className="text-white">{user.level} — {user.xp} XP</p>
          </div>
          <div>
            <p className="text-slate-400">Tickets</p>
            <p className="text-white">{user.tickets}</p>
          </div>
          <div>
            <p className="text-slate-400">Volume total</p>
            <p className="text-white">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(user.totalVolumeCents / 100)}
            </p>
          </div>
          </div>
          {user.kycaidApplicantId && (
            <Button
              variant="outline"
              size="sm"
              className="border-amber-600/50 text-amber-400 hover:bg-amber-500/10"
              onClick={handleResetKycApplicant}
              disabled={resetKycLoading}
            >
              {resetKycLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Réinitialisation…
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réinitialiser l&apos;applicant KYC
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <BalanceManagement userId={userId} onUpdate={() => {}} />
        <WithdrawalLimits userId={userId} onUpdate={() => {}} />
      </div>
    </div>
  );
}
