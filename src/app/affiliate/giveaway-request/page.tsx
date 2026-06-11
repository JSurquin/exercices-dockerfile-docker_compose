'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PageLoading } from '@/components/ui/page-loading';
import { useLocale } from '@/components/providers/locale-provider';
import { useSession } from '~/lib/auth-client';
import { queryKeys } from '@/lib/query-keys';
import { formatCentsToCurrency } from '@/lib/currency-converter';
import { AFFILIATE_MAX_PENDING_GIVEAWAY_REQUESTS } from '@/lib/affiliate-giveaway-request-logic';
import { toast } from 'sonner';
import { ArrowLeft, Gift, Loader2 } from 'lucide-react';

interface GiveawayRequestRow {
  id: string;
  startDate: string;
  endDate: string;
  winnerCount: number;
  costCents: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminMessage?: string | null;
  giveaway?: { id: string; title: string; status: string } | null;
}

function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AffiliateGiveawayRequestPage() {
  const { messages } = useLocale();
  const t = messages.affiliate.giveawayRequest;
  const td = messages.affiliate.dashboard;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const defaultStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(12, 0, 0, 0);
    return d;
  }, []);
  const defaultEnd = useMemo(() => {
    const d = new Date(defaultStart);
    d.setDate(d.getDate() + 7);
    return d;
  }, [defaultStart]);

  const [startDate, setStartDate] = useState(toLocalDatetimeValue(defaultStart));
  const [endDate, setEndDate] = useState(toLocalDatetimeValue(defaultEnd));
  const [winnerCount, setWinnerCount] = useState('1');
  const [costEur, setCostEur] = useState('');
  const [adminMessage, setAdminMessage] = useState('');

  const [statsQuery, requestsQuery] = useQueries({
    queries: [
      {
        queryKey: queryKeys.affiliateStats,
        queryFn: async () => {
          const res = await fetch(`/api/affiliate/stats?userId=${userId}`);
          const data = await res.json();
          if (!data.success && res.status !== 404) throw new Error('Stats error');
          return data;
        },
        enabled: !!userId,
      },
      {
        queryKey: queryKeys.affiliateGiveawayRequests,
        queryFn: async () => {
          const res = await fetch('/api/affiliate/giveaway-requests');
          const data = await res.json();
          if (!data.success) throw new Error(data.error || 'Load error');
          return data.data as {
            requests: GiveawayRequestRow[];
            balance: { availableCents: number; accountFrozen: boolean };
            maxPending: number;
          };
        },
        enabled: !!userId,
      },
    ],
  });

  const affiliateData = statsQuery.data?.success ? statsQuery.data.data : null;
  const availableCents = requestsQuery.data?.balance.availableCents ?? 0;
  const accountFrozen = requestsQuery.data?.balance.accountFrozen ?? false;
  const requests = requestsQuery.data?.requests ?? [];
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const maxPending = requestsQuery.data?.maxPending ?? AFFILIATE_MAX_PENDING_GIVEAWAY_REQUESTS;

  const costCents = useMemo(() => {
    const parsed = parseFloat(costEur.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.round(parsed * 100);
  }, [costEur]);

  const canSubmit =
    !!affiliateData &&
    !accountFrozen &&
    availableCents > 0 &&
    costCents >= 1 &&
    availableCents >= costCents &&
    pendingCount < maxPending;

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/affiliate/giveaway-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          winnerCount: parseInt(winnerCount, 10),
          costCents,
          adminMessage: adminMessage.trim() || null,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error');
      return data;
    },
    onSuccess: () => {
      toast.success(t.success, { description: t.successDesc });
      queryClient.invalidateQueries({ queryKey: queryKeys.affiliateGiveawayRequests });
      queryClient.invalidateQueries({ queryKey: queryKeys.userBalance });
      router.push('/affiliate');
    },
    onError: (err: Error) => {
      toast.error(td.payoutError, { description: err.message });
    },
  });

  if (statsQuery.isLoading || requestsQuery.isLoading || !session) {
    return <PageLoading variant="compact" message={messages.common.loading} className="min-h-[50vh]" />;
  }

  if (!affiliateData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-purple-500/20 bg-slate-900/50">
          <CardContent className="p-8 text-center space-y-4">
            <h2 className="text-xl font-bold">{td.notAffiliate}</h2>
            <p className="text-muted-foreground text-sm">{td.notAffiliateDesc}</p>
            <Button asChild variant="outline">
              <Link href="/affiliate">{t.backToDashboard}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusLabel = (status: GiveawayRequestRow['status']) => {
    if (status === 'PENDING') return t.statusPending;
    if (status === 'APPROVED') return t.statusApproved;
    return t.statusRejected;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-slate-950/50">
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <Button asChild variant="ghost" className="text-slate-400 hover:text-white -ml-2">
          <Link href="/affiliate">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.backToDashboard}
          </Link>
        </Button>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Gift className="h-6 w-6 text-purple-400" />
            {t.title}
          </h1>
          <p className="text-slate-400 text-sm">{t.subtitle}</p>
        </div>

        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-white text-base">{t.availableBalance}</CardTitle>
            <CardDescription>
              <span className="text-lg font-semibold text-white">
                {formatCentsToCurrency(availableCents, 'EUR')}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableCents <= 0 && (
              <p className="text-sm text-amber-400">{t.noBalance}</p>
            )}
            {pendingCount >= maxPending && (
              <p className="text-sm text-amber-400">
                {t.maxPendingReached.replace('{max}', String(maxPending))}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{t.startDate}</Label>
                <Input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-800 border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">{t.endDate}</Label>
                <Input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-800 border-slate-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{t.winnerCount}</Label>
                <Input
                  type="number"
                  min={1}
                  value={winnerCount}
                  onChange={(e) => setWinnerCount(e.target.value)}
                  className="bg-slate-800 border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">{t.cost}</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="50.00"
                  value={costEur}
                  onChange={(e) => setCostEur(e.target.value)}
                  className="bg-slate-800 border-slate-600"
                />
                <p className="text-xs text-slate-500">{t.costHint}</p>
                {costCents > 0 && availableCents < costCents && (
                  <p className="text-xs text-amber-400">{t.insufficientBalance}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">{t.adminMessage}</Label>
              <Textarea
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                placeholder={t.adminMessagePlaceholder}
                className="bg-slate-800 border-slate-600 min-h-[100px]"
              />
            </div>

            <Button
              className="w-full bg-cta-gradient hover:brightness-110 text-white"
              disabled={!canSubmit || submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
            >
              {submitMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t.submit
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-white text-base">{t.myRequests}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-sm text-slate-400">{t.noRequests}</p>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-slate-700 bg-slate-800/40"
                >
                  <div>
                    <p className="text-sm text-white font-medium">
                      {formatCentsToCurrency(req.costCents, 'EUR')} · {req.winnerCount} gagnant(s)
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(req.startDate).toLocaleDateString()} → {new Date(req.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline">{statusLabel(req.status)}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
