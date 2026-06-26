'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  User,
  Mail,
  Hash,
  RefreshCw,
  Crown,
  Save,
  Zap,
  Shield,
  Wallet,
  TrendingUp,
} from 'lucide-react';
import { BalanceManagement } from '@/components/admin/balance-management';
import { WithdrawalLimits } from '@/components/admin/withdrawal-limits';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useToast } from '@/hooks/use-toast';
import { UserRoleBadge } from '@/components/ui/user-role-badge';
import { useLocale } from '@/components/providers/locale-provider';
import { UserRewardsBlockControls } from '@/components/admin/user-rewards-block-controls';
import { UserBanManagement } from '@/components/admin/user-ban-management';
import { ConvertedPrice } from '@/components/ui/converted-price';
import { SteamIcon } from '@/components/ui/cs2-icons';
import { getSteamProfileUrl } from '@/lib/steam-id';
import { cn } from '@/lib/utils';

const adminBtnNeutral =
  'h-9 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white';
const adminBtnPositive =
  'h-9 border border-theme-highlight/50 bg-theme-stat/10 text-theme-highlight hover:bg-theme-stat/20';
const adminBtnDestructive =
  'h-9 bg-red-600/90 hover:bg-red-600 text-white border-0';

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
  banned: boolean;
  banReason: string | null;
  banExpires: string | null;
  lastLoginIp: string | null;
  lastLoginAt: string | null;
  bonusRatePercent: number;
  userTag: string | null;
  instantCreditEnabled: boolean;
  affiliateRewardsBlocked: boolean;
  xpRewardsBlocked: boolean;
  referredBy: { affiliateId: string; code: string; steamUsername: string | null } | null;
  affiliateHistory?: Array<{
    id: string;
    affiliateCode: string;
    affiliateName: string | null;
    startedAt: string;
    endedAt: string | null;
    isActive: boolean;
  }>;
  createdAt: string;
  role: string;
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <Icon className="h-5 w-5 text-theme-highlight" />
        {title}
      </h2>
      {description && <p className="text-sm text-slate-400">{description}</p>}
    </div>
  );
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
    if (!user || user.id !== userId) return;
    setBonusRate(String(user.bonusRatePercent ?? 0));
    setUserTag(user.userTag ?? '');
  }, [user, userId]);

  const handleSaveBonus = async () => {
    if (!userId) return;

    const rate = parseFloat(bonusRate);
    const tag = userTag.trim() || null;

    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast({
        title: t.errorTitle,
        description: t.bonusRangeError,
        variant: 'destructive',
      });
      return;
    }

    if (tag && rate <= 0) {
      toast({
        title: t.errorTitle,
        description: t.bonusTagRequiresRate,
        variant: 'destructive',
      });
      return;
    }

    if (!tag && rate > 0) {
      toast({
        title: t.errorTitle,
        description: t.bonusRateRequiresTag,
        variant: 'destructive',
      });
      return;
    }

    setBonusSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/bonus`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bonusRatePercent: rate,
          userTag: tag,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.errorTitle);

      setBonusRate(String(data.bonusRatePercent ?? 0));
      setUserTag(data.userTag ?? '');

      queryClient.setQueryData(queryKeys.adminUser(userId), (current: UserDetail | undefined) =>
        current
          ? {
              ...current,
              bonusRatePercent: data.bonusRatePercent ?? 0,
              userTag: data.userTag ?? null,
            }
          : current
      );

      toast({
        title: t.bonusUpdatedTitle,
        description: t.bonusUpdatedDesc
          .replace('{rate}', String(data.bonusRatePercent))
          .replace('{tag}', data.userTag || t.noTagLabel),
      });
      await refetchUser();
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUser(userId) });
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
    return <div className="text-slate-400">{t.missingId}</div>;
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
        <Button variant="outline" size="sm" asChild className={adminBtnNeutral}>
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
    <div className="space-y-8">
      <Button variant="outline" size="sm" asChild className={cn(adminBtnNeutral, 'w-fit')}>
        <Link href="/admin/dashboard?tab=users" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t.backToUsers}
        </Link>
      </Button>

      {/* Identité & statistiques */}
      <Card className="bg-slate-800/30 border-slate-700">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarImage src={user.image ?? undefined} alt={displayName} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-2">
              <CardTitle className="text-white text-xl">{displayName}</CardTitle>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </span>
                {user.steamId && (
                  <span className="flex items-center gap-1 font-mono text-xs">
                    <Hash className="h-3.5 w-3.5" />
                    {user.steamId}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  {user.role}
                </Badge>
                <UserRoleBadge userTag={user.userTag} size="sm" />
                {user.accountFrozen && <Badge variant="destructive">{t.frozenAccount}</Badge>}
                {user.banned && (!user.banExpires || new Date(user.banExpires) > new Date()) && (
                  <Badge variant="destructive">{t.bannedAccount}</Badge>
                )}
              </div>
            </div>
            {user.steamId && (
              <Button variant="outline" size="sm" asChild className={cn(adminBtnNeutral, 'shrink-0')}>
                <a href={getSteamProfileUrl(user.steamId)} target="_blank" rel="noopener noreferrer">
                  <SteamIcon className="h-4 w-4 mr-2" />
                  {t.viewSteamProfile}
                </a>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
            <div className="rounded-lg border border-slate-700/80 bg-slate-900/40 p-3">
              <p className="text-slate-400 text-xs">{t.totalVolume}</p>
              <p className="text-white font-semibold mt-1">
                <ConvertedPrice usdCents={user.totalVolumeCents} fromCurrency="USD" className="text-white" />
              </p>
            </div>
            <div className="rounded-lg border border-slate-700/80 bg-slate-900/40 p-3">
              <p className="text-slate-400 text-xs">{t.levelXp}</p>
              <p className="text-white font-semibold mt-1">
                {user.level} · {user.xp} XP
              </p>
            </div>
            <div className="rounded-lg border border-slate-700/80 bg-slate-900/40 p-3">
              <p className="text-slate-400 text-xs">{t.fragments}</p>
              <p className="text-white font-semibold mt-1">{user.tickets}</p>
            </div>
            <div className="rounded-lg border border-slate-700/80 bg-slate-900/40 p-3">
              <p className="text-slate-400 text-xs">{t.kycLabel}</p>
              <p className="text-white font-semibold mt-1">{user.kycStatus}</p>
            </div>
            <div className="rounded-lg border border-slate-700/80 bg-slate-900/40 p-3 col-span-2 sm:col-span-1">
              <p className="text-slate-400 text-xs">{t.lastLoginIpLabel}</p>
              <p className="text-white font-mono text-xs break-all mt-1">
                {user.lastLoginIp ?? t.lastLoginIpUnknown}
              </p>
              {user.lastLoginAt && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(user.lastLoginAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Finances */}
      <section className="space-y-4">
        <SectionHeading icon={Wallet} title="Finances" />
        <div className="grid gap-6 lg:grid-cols-2">
          <BalanceManagement userId={userId} onUpdate={() => {}} />
          <WithdrawalLimits userId={userId} onUpdate={() => {}} />
        </div>
      </section>

      {/* Modération */}
      <section className="space-y-4">
        <SectionHeading icon={Shield} title="Modération du compte" />
        <div className="grid gap-6 lg:grid-cols-2">
          <UserBanManagement
            userId={userId}
            banned={user.banned}
            banReason={user.banReason}
            banExpires={user.banExpires}
            onUpdate={() => refetchUser()}
          />

          <Card
            className={cn(
              'bg-slate-800/30 border-slate-700',
              user.instantCreditEnabled && 'border-theme-highlight/40 shadow-lg shadow-[var(--cta-shadow)]',
            )}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Zap
                  className={cn(
                    'h-5 w-5',
                    user.instantCreditEnabled ? 'text-theme-highlight' : 'text-slate-500',
                  )}
                />
                {t.instantCreditTitle}
              </CardTitle>
              <CardDescription className="text-slate-400">{t.instantCreditHelp}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/30 p-4">
                <Label className="text-slate-200">{t.instantCreditLabel}</Label>
                <Switch
                  checked={user.instantCreditEnabled}
                  onCheckedChange={handleToggleInstantCredit}
                  disabled={instantCreditSaving}
                />
              </div>
              {user.instantCreditEnabled && (
                <p className="text-sm text-theme-highlight">{t.instantCreditActiveWarning}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-800/30 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-theme-highlight" />
              Récompenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UserRewardsBlockControls
              userId={userId!}
              affiliateRewardsBlocked={user.affiliateRewardsBlocked ?? false}
              xpRewardsBlocked={user.xpRewardsBlocked ?? false}
            />
          </CardContent>
        </Card>
      </section>

      {/* KYC */}
      <section className="space-y-4">
        <SectionHeading icon={TrendingUp} title="Vérification KYC" />
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-slate-300">
                  Statut actuel : <span className="text-white font-medium">{user.kycStatus}</span>
                </p>
                {user.kycaidApplicantId && (
                  <p
                    className="text-xs text-slate-500 font-mono mt-1 truncate max-w-md"
                    title={user.kycaidApplicantId}
                  >
                    {user.kycaidApplicantId}
                  </p>
                )}
              </div>
              {user.kycaidApplicantId && (
                <Button
                  variant="outline"
                  size="sm"
                  className={adminBtnDestructive}
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
            </div>
            {resetKycMessage && (
              <p
                className={
                  resetKycMessage.type === 'success' ? 'text-sm text-green-400' : 'text-sm text-red-400'
                }
              >
                {resetKycMessage.text}
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* VIP / Bonus */}
      <section className="space-y-4">
        <SectionHeading icon={Crown} title={t.bonusSectionTitle} />
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="pt-6 space-y-4">
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
                  className="bg-slate-700 border-slate-600 text-white h-9"
                />
                <p className="text-xs text-slate-500">{t.bonusRateHelp}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">{t.userTagLabel}</Label>
                <Select value={userTag || 'none'} onValueChange={(v) => setUserTag(v === 'none' ? '' : v)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-9">
                    <SelectValue placeholder={t.noTag} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t.noTag}</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="MERCHANT">MERCHANT</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">{t.tagHelp}</p>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleSaveBonus}
                  disabled={bonusSaving}
                  variant="outline"
                  className={cn(adminBtnPositive, 'w-full sm:w-auto')}
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
            {user.affiliateHistory && user.affiliateHistory.length > 0 && (
              <div className="border-t border-slate-700 pt-3 space-y-2">
                <p className="text-sm font-medium text-slate-200">{t.affiliateHistoryTitle}</p>
                <ul className="space-y-1.5">
                  {user.affiliateHistory.map((entry: NonNullable<UserDetail['affiliateHistory']>[number]) => (
                    <li key={entry.id} className="text-xs text-slate-400 flex flex-wrap gap-1">
                      <code className="text-theme-highlight">{entry.affiliateCode}</code>
                      {entry.affiliateName ? `(${entry.affiliateName})` : ''}
                      <span>—</span>
                      <span>
                        {new Date(entry.startedAt).toLocaleDateString('fr-FR')}
                        {entry.endedAt
                          ? ` → ${new Date(entry.endedAt).toLocaleDateString('fr-FR')}`
                          : entry.isActive
                            ? ` (${t.affiliateHistoryCurrent})`
                            : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
