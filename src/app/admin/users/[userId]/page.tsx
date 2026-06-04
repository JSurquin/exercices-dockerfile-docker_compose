'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, User, Mail, Hash, RefreshCw, Crown, Save, Zap } from 'lucide-react';
import { BalanceManagement } from '@/components/admin/balance-management';
import { WithdrawalLimits } from '@/components/admin/withdrawal-limits';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useToast } from '@/hooks/use-toast';
import { UserRoleBadge } from '@/components/ui/user-role-badge';
import { useLocale } from '@/components/providers/locale-provider';
import { UserRewardsBlockControls } from '@/components/admin/user-rewards-block-controls';
import { ConvertedPrice } from '@/components/ui/converted-price';

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
  pendingBalanceCents: number;
  balanceCents: number;
  frozenBalanceCents: number;
  accountFrozen: boolean;
  bonusRatePercent: number;
  userTag: string | null;
  instantCreditEnabled: boolean;
  affiliateRewardsBlocked: boolean;
  xpRewardsBlocked: boolean;
  referredBy: { affiliateId: string; code: string; steamUsername: string | null } | null;
  createdAt: string;
  role: string;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = params?.userId as string | undefined;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { messages } = useLocale();
  const t = messages.admin.userDetail;
  const [resetKycLoading, setResetKycLoading] = useState(false);
  const [resetKycMessage, setResetKycMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [bonusRate, setBonusRate] = useState('');
  const [userTag, setUserTag] = useState('');
  const [bonusSaving, setBonusSaving] = useState(false);
  const [bonusInitialized, setBonusInitialized] = useState(false);
  const [instantCreditSaving, setInstantCreditSaving] = useState(false);

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

  useEffect(() => {
    if (user && !bonusInitialized) {
      setBonusRate(String(user.bonusRatePercent ?? 0));
      setUserTag(user.userTag ?? '');
      setBonusInitialized(true);
    }
  }, [user, bonusInitialized]);

  const handleSaveBonus = async () => {
    if (!userId) return;
    setBonusSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/bonus`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bonusRatePercent: parseFloat(bonusRate) || 0,
          userTag: userTag || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.errorTitle);
      toast({ title: t.bonusUpdatedTitle, description: t.bonusUpdatedDesc.replace('{rate}', String(data.bonusRatePercent)).replace('{tag}', data.userTag || t.noTagLabel) });
      await refetchUser();
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    } catch (e) {
      toast({
        title: t.errorTitle,
        description: e instanceof Error ? e.message : t.errorSave,
        variant: 'destructive',
      });
    } finally {
      setBonusSaving(false);
    }
  };

  const handleToggleInstantCredit = async (enabled: boolean) => {
    if (!userId) return;
    setInstantCreditSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/instant-credit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.errorTitle);
      toast({
        title: enabled ? t.instantCreditEnabledTitle : t.instantCreditDisabledTitle,
        description: enabled ? t.instantCreditEnabledDesc : t.instantCreditDisabledDesc,
        variant: enabled ? 'default' : 'destructive',
      });
      await refetchUser();
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    } catch (e) {
      toast({
        title: t.errorTitle,
        description: e instanceof Error ? e.message : t.errorSave,
        variant: 'destructive',
      });
    } finally {
      setInstantCreditSaving(false);
    }
  };

  const handleResetKycApplicant = async () => {
    if (!userId || !user) return;
    setResetKycMessage(null);
    setResetKycLoading(true);
    try {
      const res = await fetch(`/api/admin/kyc/reset-applicant/${userId}`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      setResetKycMessage({ type: 'success', text: data.message ?? t.resetKyc });
      await refetchUser();
    } catch (e) {
      setResetKycMessage({ type: 'error', text: e instanceof Error ? e.message : 'Erreur' });
    } finally {
      setResetKycLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="text-slate-400">{t.missingId}</div>
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
            {t.backToUsers}
          </Link>
        </Button>
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="p-6">
            <p className="text-red-400">{error || t.userNotFound}</p>
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
            {t.backToUsers}
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
                <UserRoleBadge userTag={user.userTag} size="sm" />
                {user.accountFrozen && (
                  <Badge variant="destructive">{t.frozenAccount}</Badge>
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
            <p className="text-slate-400">{t.kycLabel}</p>
            <p className="text-white">{user.kycStatus}</p>
            {user.kycaidApplicantId && (
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[180px]" title={user.kycaidApplicantId}>
                {user.kycaidApplicantId}
              </p>
            )}
          </div>
          <div>
            <p className="text-slate-400">{t.levelXp}</p>
            <p className="text-white">{user.level} — {user.xp} XP</p>
          </div>
          <div>
            <p className="text-slate-400">{t.fragments}</p>
            <p className="text-white">{user.tickets}</p>
          </div>
          <div>
            <p className="text-slate-400">{t.totalVolume}</p>
            <p className="text-white">
              <ConvertedPrice
                usdCents={user.totalVolumeCents}
                fromCurrency="USD"
                className="text-white"
              />
            </p>
          </div>
          </div>
          {user.kycaidApplicantId && (
            <Button
              variant="outline"
              size="sm"
              className="border-theme-highlight/50 text-theme-highlight hover:bg-theme-stat/10"
              onClick={handleResetKycApplicant}
              disabled={resetKycLoading}
            >
              {resetKycLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  {t.resettingKyc}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t.resetKyc}
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

      <Card className={`bg-slate-800/30 border-slate-700 ${user.instantCreditEnabled ? 'border-theme-highlight/40 shadow-lg shadow-[var(--cta-shadow)]' : ''}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className={`h-5 w-5 ${user.instantCreditEnabled ? 'text-theme-highlight' : 'text-slate-500'}`} />
            {t.instantCreditTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/5 border border-red-500/20">
            <div className="space-y-1 flex-1">
              <Label className="text-slate-200">{t.instantCreditLabel}</Label>
              <p className="text-xs text-slate-400">
                {t.instantCreditHelp}
              </p>
            </div>
            <Switch
              checked={user.instantCreditEnabled}
              onCheckedChange={handleToggleInstantCredit}
              disabled={instantCreditSaving}
            />
          </div>
          {user.instantCreditEnabled && (
            <p className="text-sm text-theme-highlight">
              {t.instantCreditActiveWarning}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-800/30 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <Crown className="h-5 w-5 text-theme-highlight" />
            {t.bonusSectionTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">{t.bonusRateLabel}</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder={t.bonusRatePlaceholder}
                value={bonusRate}
                onChange={(e) => setBonusRate(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-500">
                {t.bonusRateHelp}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">{t.userTagLabel}</Label>
              <Select value={userTag || 'none'} onValueChange={(v) => setUserTag(v === 'none' ? '' : v)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder={t.noTag} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t.noTag}</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="MERCHANT">MERCHANT</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                {t.tagHelp}
              </p>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleSaveBonus}
                disabled={bonusSaving}
                className="bg-theme-stat hover:bg-theme-stat/90"
              >
                <Save className="h-4 w-4 mr-2" />
                {bonusSaving ? t.saving : t.save}
              </Button>
            </div>
          </div>
          {user.bonusRatePercent > 0 && (
            <p className="text-sm text-theme-highlight">
              {t.bonusActive.replace('{rate}', String(user.bonusRatePercent))}
            </p>
          )}
          {user.referredBy && (
            <p className="text-sm text-slate-300 border-t border-slate-700 pt-3">
              {t.referredByLabel}{' '}
              <code className="text-theme-highlight">{user.referredBy.code}</code>
              {user.referredBy.steamUsername ? ` (${user.referredBy.steamUsername})` : ''}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-800/30 border-slate-700">
        <CardContent className="pt-6">
          <UserRewardsBlockControls
            userId={userId!}
            affiliateRewardsBlocked={user.affiliateRewardsBlocked ?? false}
            xpRewardsBlocked={user.xpRewardsBlocked ?? false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
