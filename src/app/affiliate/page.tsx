'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useLocale } from '@/components/providers/locale-provider';
import { useSession } from '~/lib/auth-client';
import { queryKeys } from '@/lib/query-keys';
import { AffiliateCommission } from '@/lib/types';
import { toast } from 'sonner';
import {
  Copy,
  ExternalLink,
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  Star,
  Zap,
  Share2,
  BarChart3,
  CheckCircle2,
  XCircle,
  Loader2,
  Link as LinkIcon,
  Gift,
  Shield,
  UserCheck,
  AlertTriangle,
  Check,
} from 'lucide-react';

export default function AffiliatePage() {
  const { messages } = useLocale();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [customPath, setCustomPath] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const userId = session?.user?.id;

  const { data: statsData, isLoading } = useQuery({
    queryKey: queryKeys.affiliateStats,
    queryFn: async () => {
      const response = await fetch(`/api/affiliate/stats?userId=${userId}`);
      const data = await response.json();
      if (!data.success && response.status !== 404) throw new Error('Erreur stats affilié');
      return { ...data, status: response.status };
    },
    enabled: !!userId,
  });

  const affiliateData = statsData?.success
    ? {
        ...statsData.data,
        metrics: statsData.data?.metrics || {
          totalPendingCommissions: 0,
          totalPaidCommissions: 0,
          conversionRate: 0,
          averageOrderValue: 0,
        },
        recentReferrals: statsData.data?.recentReferrals || [],
      }
    : null;

  // Giveaways privés liés au code de cet affilié
  const { data: privateGiveaways = [] } = useQuery<{ id: string; title: string; status: string }[]>({
    queryKey: ['giveaways', 'private', affiliateData?.code],
    queryFn: async () => {
      const res = await fetch('/api/giveaways/private?affiliateCode=' + affiliateData!.code, { credentials: 'include' });
      if (!res.ok) return [];
      const data = await res.json();
      return data ?? [];
    },
    enabled: !!affiliateData?.code,
  });

  const { data: allCommissionsData } = useQuery({
    queryKey: [...queryKeys.affiliateCommissions, 'all'],
    queryFn: async () => {
      const [pending, paid] = await Promise.all([
        fetch(`/api/affiliate/commissions?userId=${userId}&status=PENDING`).then((r) => r.json()),
        fetch(`/api/affiliate/commissions?userId=${userId}&status=PAID`).then((r) => r.json()),
      ]);
      return {
        pending: pending.success ? pending.data.commissions : [],
        paid: paid.success ? paid.data.commissions : [],
      };
    },
    enabled: !!affiliateData,
  });

  const commissions = allCommissionsData?.pending ?? [];
  const paidCommissions = allCommissionsData?.paid ?? [];

  // Détecter si l'utilisateur a visité sa propre page avec son propre lien affilié
  useEffect(() => {
    if (!affiliateData?.code) return;
    const cookieRef = document.cookie
      .split(';')
      .find((c) => c.trim().startsWith('ctf_affiliate_ref='))
      ?.split('=')[1]
      ?.trim();
    if (cookieRef && cookieRef === affiliateData.code) {
      toast.warning(messages.affiliate.dashboard.selfReferralWarning, {
        description: messages.affiliate.dashboard.selfReferralDesc,
        duration: 8000,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [affiliateData?.code]);

  const payoutMutation = useMutation({
    mutationFn: async (commissionIds: string[]) => {
      const res = await fetch('/api/affiliate/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'request_payout', commissionIds }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Erreur');
      return data;
    },
    onSuccess: () => {
      toast.success(messages.affiliate.dashboard.payoutRequested, { description: messages.affiliate.dashboard.payoutRequestedDesc });
      queryClient.invalidateQueries({ queryKey: queryKeys.affiliateCommissions });
    },
    onError: (err: Error) => {
      toast.error(messages.affiliate.dashboard.payoutError, { description: err.message });
    },
  });

  const generateAffiliateLink = async (path = '', copyKey = 'custom') => {
    // Validation du path
    const normalizedPath = path.trim();
    if (normalizedPath && !normalizedPath.startsWith('/')) {
      toast.error(messages.affiliate.dashboard.invalidPath, { description: messages.affiliate.dashboard.invalidPathDesc });
      return;
    }

    try {
      const res = await fetch('/api/affiliate/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, path: normalizedPath }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(messages.affiliate.dashboard.generateError, { description: data.error || messages.affiliate.dashboard.generateErrorDesc });
        return;
      }

      const link: string = data.data.link;
      setGeneratedLink(link);

      await navigator.clipboard.writeText(link);

      setCopiedKey(copyKey);
      setTimeout(() => setCopiedKey(null), 2500);

      toast.success(messages.affiliate.linkCopied, {
        description: link,
        duration: 5000,
      });
    } catch {
      toast.error(messages.affiliate.dashboard.copyError, { description: messages.affiliate.dashboard.copyErrorDesc });
    }
  };

  const fmt = (cents: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);

  const fmtDate = (d: string | Date) =>
    new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));

  if (isLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!affiliateData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-purple-500/20 bg-slate-900/50">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold">{messages.affiliate.dashboard.notAffiliate}</h2>
            <p className="text-muted-foreground text-sm">
              {messages.affiliate.dashboard.notAffiliateDesc}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingTotal = commissions.reduce((s: number, c: AffiliateCommission) => s + c.amountCents, 0);
  const paidTotal = paidCommissions.reduce((s: number, c: AffiliateCommission) => s + c.amountCents, 0);
  const conversionPct = affiliateData.metrics?.conversionRate
    ? (affiliateData.metrics.conversionRate * 100).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-slate-950/50">
      {/* Hero Banner */}
      <div className="relative overflow-hidden border-b border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40">
        <div className="absolute inset-0 bg-[url('/images/cs2-pattern.svg')] opacity-5" />
        <div className="container mx-auto px-4 py-10 relative">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <UserCheck className="h-8 w-8 text-white" />
                </div>
                {affiliateData.isActive && (
                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-400 rounded-full border-2 border-background animate-pulse" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-white">{messages.affiliate.dashboard.title}</h1>
                  <Badge className="bg-purple-500/20 border-purple-500/40 text-purple-300 text-xs">
                    {affiliateData.isActive ? messages.affiliate.dashboard.active : messages.affiliate.dashboard.inactive}
                  </Badge>
                </div>
                <p className="text-slate-400 text-sm">
                  {messages.affiliate.dashboard.codeLabel} :{' '}
                  <span className="font-mono font-semibold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded">
                    {affiliateData.code}
                  </span>
                  {' · '}
                  {messages.affiliate.dashboard.commissionLabel} :{' '}
                  <span className="font-semibold text-white">
                    {(affiliateData.commissionRate * 100).toFixed(1)}%
                  </span>
                </p>
              </div>
            </div>

            {/* Quick copy */}
            <Button
              onClick={() => generateAffiliateLink('', 'hero')}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/20"
            >
              {copiedKey === 'hero' ? (
                <Check className="h-4 w-4 mr-2 text-green-300" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copiedKey === 'hero' ? messages.affiliate.dashboard.copied : messages.affiliate.dashboard.copyMyLink}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="h-5 w-5 text-blue-400" />}
            label={messages.affiliate.dashboard.kpi.referrals}
            value={affiliateData.totalReferrals.toString()}
            sub={messages.affiliate.dashboard.kpi.referralsSub}
            color="blue"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
            label={messages.affiliate.dashboard.kpi.totalVolume}
            value={fmt(affiliateData.totalVolumeCents)}
            sub={messages.affiliate.dashboard.kpi.totalVolumeSub}
            color="emerald"
          />
          <StatCard
            icon={<DollarSign className="h-5 w-5 text-purple-400" />}
            label={messages.affiliate.dashboard.kpi.totalCommissions}
            value={fmt(affiliateData.totalCommissionCents)}
            sub={`${fmt(paidTotal)} ${messages.affiliate.dashboard.commissionPaid.toLowerCase()}`}
            color="purple"
          />
          <StatCard
            icon={<Clock className="h-5 w-5 text-orange-400" />}
            label={messages.affiliate.dashboard.kpi.pending}
            value={fmt(pendingTotal)}
            sub={`${commissions.length} commission(s)`}
            color="orange"
          />
        </div>

        {/* Taux de conversion */}
        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {messages.affiliate.dashboard.performance}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">{messages.affiliate.dashboard.conversionRate}</span>
                <span className="text-sm font-bold text-white">{conversionPct}%</span>
              </div>
              <Progress value={parseFloat(conversionPct)} className="h-2 bg-slate-700" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">{messages.affiliate.dashboard.avgOrderValue}</span>
                <span className="text-sm font-bold text-white">
                  {fmt(affiliateData.metrics?.averageOrderValue || 0)}
                </span>
              </div>
              <Progress
                value={Math.min(
                  ((affiliateData.metrics?.averageOrderValue || 0) / 10000) * 100,
                  100
                )}
                className="h-2 bg-slate-700"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">{messages.affiliate.dashboard.commissionRate}</span>
                <span className="text-sm font-bold text-purple-300">
                  {(affiliateData.commissionRate * 100).toFixed(1)}%
                </span>
              </div>
              <Progress
                value={affiliateData.commissionRate * 100}
                className="h-2 bg-slate-700"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="referrals" className="space-y-6">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="referrals" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-2" />
              {messages.affiliate.dashboard.tabs.referrals}
            </TabsTrigger>
            <TabsTrigger value="commissions" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <DollarSign className="h-4 w-4 mr-2" />
              {messages.affiliate.dashboard.tabs.commissions}
            </TabsTrigger>
            <TabsTrigger value="tools" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Zap className="h-4 w-4 mr-2" />
              {messages.affiliate.dashboard.tabs.tools}
            </TabsTrigger>
          </TabsList>

          {/* Parrainages */}
          <TabsContent value="referrals">
            <Card className="border-slate-700 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-white">{messages.affiliate.dashboard.recentReferrals}</CardTitle>
                <CardDescription>{messages.affiliate.dashboard.recentReferralsSub}</CardDescription>
              </CardHeader>
              <CardContent>
                {affiliateData.recentReferrals?.length ? (
                  <div className="space-y-3">
                    {affiliateData.recentReferrals.map((ref: any) => (
                      <div
                        key={ref.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-slate-700 bg-slate-800/40 hover:bg-slate-800/70 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={ref.referredUser?.steamAvatar || ''} />
                            <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
                              {(ref.referredUser?.steamUsername || 'U').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-white text-sm">
                              {ref.referredUser?.steamUsername || 'Utilisateur'}
                            </p>
                            <p className="text-xs text-slate-400">
                              {messages.affiliate.dashboard.referredOn} {fmtDate(ref.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white text-sm">{fmt(ref.volumeCents)}</p>
                          <p className="text-xs text-purple-400">+{fmt(ref.commissionCents)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Users className="h-8 w-8 text-slate-500" />}
                    label={messages.affiliate.dashboard.noReferrals}
                    sub={messages.affiliate.dashboard.noReferralsSub}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions */}
          <TabsContent value="commissions" className="space-y-4">
            {/* En attente */}
            <Card className="border-slate-700 bg-slate-900/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-400" />
                    {messages.affiliate.dashboard.pendingCommissionsTitle}
                  </CardTitle>
                  <CardDescription>
                    {messages.affiliate.dashboard.pendingTotal} : <span className="font-semibold text-orange-300">{fmt(pendingTotal)}</span>
                  </CardDescription>
                </div>
                {commissions.length > 0 && (
                  <Button
                    size="sm"
                    onClick={() => payoutMutation.mutate(commissions.map((c: AffiliateCommission) => c.id))}
                    disabled={payoutMutation.isPending}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                  >
                    {payoutMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4 mr-1" />
                        {messages.affiliate.dashboard.requestPayout}
                      </>
                    )}
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {commissions.length ? (
                  <CommissionList commissions={commissions} fmt={fmt} fmtDate={fmtDate} paidLabel={messages.affiliate.dashboard.commissionPaid} pendingLabel={messages.affiliate.dashboard.commissionPending} />
                ) : (
                  <EmptyState
                    icon={<CheckCircle2 className="h-8 w-8 text-emerald-500/50" />}
                    label={messages.affiliate.dashboard.noPending}
                    sub={messages.affiliate.dashboard.noPendingSub}
                  />
                )}
              </CardContent>
            </Card>

            {/* Historique versé */}
            <Card className="border-slate-700 bg-slate-900/50">
              <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  {messages.affiliate.dashboard.paidCommissionsTitle}
                </CardTitle>
                <CardDescription>
                  {messages.affiliate.dashboard.totalReceived} : <span className="font-semibold text-emerald-300">{fmt(paidTotal)}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paidCommissions.length ? (
                  <CommissionList commissions={paidCommissions} fmt={fmt} fmtDate={fmtDate} paid paidLabel={messages.affiliate.dashboard.commissionPaid} pendingLabel={messages.affiliate.dashboard.commissionPending} />
                ) : (
                  <EmptyState
                    icon={<XCircle className="h-8 w-8 text-slate-500" />}
                    label={messages.affiliate.dashboard.noPaid}
                    sub={messages.affiliate.dashboard.noPaidSub}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outils */}
          <TabsContent value="tools">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Générateur de liens */}
              <Card className="border-slate-700 bg-slate-900/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <LinkIcon className="h-5 w-5 text-purple-400" />
                    {messages.affiliate.dashboard.linkGenerator}
                  </CardTitle>
                  <CardDescription>
                    {messages.affiliate.dashboard.linkGeneratorDesc}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">
                      {messages.affiliate.dashboard.targetPage} <span className="text-slate-500 font-normal">{messages.affiliate.dashboard.targetPageOptional}</span>
                    </Label>
                    <Input
                      placeholder="/sell, /giveaways, etc."
                      value={customPath}
                      onChange={(e) => setCustomPath(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') generateAffiliateLink(customPath, 'custom');
                      }}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                    />
                    <p className="text-xs text-slate-500">
                      {messages.affiliate.dashboard.targetPageHint}
                    </p>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                    onClick={() => generateAffiliateLink(customPath, 'custom')}
                  >
                    {copiedKey === 'custom' ? (
                      <><Check className="h-4 w-4 mr-2 text-green-300" /> {messages.affiliate.dashboard.copied}</>
                    ) : (
                      <><Copy className="h-4 w-4 mr-2" /> {messages.affiliate.dashboard.generateAndCopy}</>
                    )}
                  </Button>

                  {/* Aperçu du lien généré */}
                  {generatedLink && (
                    <div className="rounded-lg border border-purple-500/30 bg-purple-950/20 p-3">
                      <p className="text-xs text-purple-400 font-medium mb-1">{messages.affiliate.dashboard.lastGenerated} :</p>
                      <p className="text-xs text-slate-300 break-all font-mono">{generatedLink}</p>
                    </div>
                  )}

                  <Separator className="bg-slate-700" />
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{messages.affiliate.dashboard.quickLinks}</p>
                    {[
                      { label: messages.affiliate.dashboard.quickHome, path: '', key: 'quick-home' },
                      { label: messages.affiliate.dashboard.quickSell, path: '/sell', key: 'quick-sell' },
                      { label: messages.affiliate.dashboard.quickGiveaways, path: '/giveaways', key: 'quick-giveaways' },
                    ].map(({ label, path, key }) => (
                      <button
                        key={key}
                        onClick={() => generateAffiliateLink(path, key)}
                        className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-700/60 transition-colors text-sm text-slate-300 hover:text-white group"
                      >
                        <span>{label}</span>
                        {copiedKey === key ? (
                          <Check className="h-3.5 w-3.5 text-green-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                        )}
                      </button>
                    ))}
                    {privateGiveaways.length > 0 && (
                      <>
                        <p className="text-xs text-purple-400 font-medium uppercase tracking-wide pt-2">
                          {messages.affiliate.dashboard.privateGiveawaysLabel ?? '🔒 Giveaways privés'}
                        </p>
                        {privateGiveaways.map((g) => {
                          const key = `private-${g.id}`;
                          return (
                            <button
                              key={key}
                              onClick={() => generateAffiliateLink(`/giveaways/${g.id}`, key)}
                              className="w-full flex items-center justify-between p-3 rounded-lg border border-purple-500/30 bg-purple-950/20 hover:bg-purple-950/40 transition-colors text-sm text-purple-300 hover:text-purple-100 group"
                            >
                              <span className="truncate">{g.title}</span>
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                {g.status === 'ACTIVE' && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                                )}
                                {copiedKey === key ? (
                                  <Check className="h-3.5 w-3.5 text-green-400" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5 text-purple-500 group-hover:text-purple-300 transition-colors" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Ressources & Avantages */}
              <Card className="border-slate-700 bg-slate-900/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400" />
                    {messages.affiliate.dashboard.partnerBenefits}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    {
                      icon: <DollarSign className="h-4 w-4 text-emerald-400" />,
                      label: messages.affiliate.dashboard.benefitCommission.replace('{rate}', (affiliateData.commissionRate * 100).toFixed(1)),
                    },
                    {
                      icon: <Gift className="h-4 w-4 text-purple-400" />,
                      label: messages.affiliate.dashboard.benefitPayments,
                    },
                    {
                      icon: <BarChart3 className="h-4 w-4 text-blue-400" />,
                      label: messages.affiliate.dashboard.benefitAnalytics,
                    },
                    {
                      icon: <Share2 className="h-4 w-4 text-orange-400" />,
                      label: messages.affiliate.dashboard.benefitMarketing,
                    },
                    {
                      icon: <Shield className="h-4 w-4 text-indigo-400" />,
                      label: messages.affiliate.dashboard.benefitSupport,
                    },
                  ].map(({ icon, label }, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                      <div className="flex-shrink-0">{icon}</div>
                      <p className="text-sm text-slate-300">{label}</p>
                    </div>
                  ))}
                  <Separator className="bg-slate-700" />
                  <Button
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                    onClick={() => window.open('/support', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {messages.affiliate.dashboard.contactSupport}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: 'blue' | 'emerald' | 'purple' | 'orange';
}) {
  const bg = {
    blue: 'bg-blue-500/10 border-blue-500/20',
    emerald: 'bg-emerald-500/10 border-emerald-500/20',
    purple: 'bg-purple-500/10 border-purple-500/20',
    orange: 'bg-orange-500/10 border-orange-500/20',
  }[color];

  return (
    <Card className={`border ${bg} bg-slate-900/50`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-400 font-medium">{label}</span>
          {icon}
        </div>
        <p className="text-2xl font-bold text-white truncate">{value}</p>
        <p className="text-xs text-slate-500 mt-1 truncate">{sub}</p>
      </CardContent>
    </Card>
  );
}

function CommissionList({
  commissions,
  fmt,
  fmtDate,
  paid = false,
  paidLabel,
  pendingLabel,
}: {
  commissions: AffiliateCommission[];
  fmt: (c: number) => string;
  fmtDate: (d: string | Date) => string;
  paid?: boolean;
  paidLabel: string;
  pendingLabel: string;
}) {
  return (
    <div className="space-y-2">
      {commissions.map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/40"
        >
          <div>
            <p className="text-sm font-semibold text-white">{fmt(c.amountCents)}</p>
            <p className="text-xs text-slate-400">{fmtDate(c.createdAt)}</p>
          </div>
          <Badge
            variant={paid ? 'default' : 'secondary'}
            className={
              paid
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-orange-500/20 text-orange-300 border-orange-500/30'
            }
          >
            {paid ? paidLabel : pendingLabel}
          </Badge>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  icon,
  label,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
      <div className="mb-2">{icon}</div>
      <p className="text-slate-300 font-medium">{label}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  );
}
