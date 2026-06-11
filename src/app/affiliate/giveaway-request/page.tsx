'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import type { Messages } from '~/utils/types';
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
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Gift, Loader2 } from 'lucide-react';

interface GiveawayRequestRow {
  id: string;
  startDate: string;
  endDate: string;
  winnerCount: number;
  costCents: number;
  requireAffiliateCode?: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminMessage?: string | null;
  giveaway?: { id: string; title: string; status: string } | null;
}

async function parseApiJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error('Réponse serveur vide');
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error('Réponse serveur invalide — réessayez dans un instant');
  }
}

function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const REQUEST_STATUS_LABELS: Record<GiveawayRequestRow['status'], keyof Messages['affiliate']['giveawayRequest']> = {
  PENDING: 'statusPending',
  APPROVED: 'statusApproved',
  REJECTED: 'statusRejected',
};

export default function AffiliateGiveawayRequestPage() {
  const { messages } = useLocale();
  const t = messages.affiliate?.giveawayRequest;
  const td = messages.affiliate.dashboard;
  const { toast } = useToast();
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
  const [requireAffiliateCode, setRequireAffiliateCode] = useState(true);

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
          const data = await parseApiJson(res);
          if (!data.success) throw new Error(String(data.error || 'Load error'));
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
      const parsedStart = new Date(startDate);
      const parsedEnd = new Date(endDate);
      const parsedWinners = parseInt(winnerCount, 10);

      if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
        throw new Error(t?.startDate ? `${t.startDate} / ${t.endDate} invalides` : 'Dates invalides');
      }
      if (!Number.isFinite(parsedWinners) || parsedWinners < 1) {
        throw new Error(t?.winnerCount ? `${t.winnerCount} invalide` : 'Nombre de gagnants invalide');
      }

      const res = await fetch('/api/affiliate/giveaway-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: parsedStart.toISOString(),
          endDate: parsedEnd.toISOString(),
          winnerCount: parsedWinners,
          costCents,
          adminMessage: adminMessage.trim() || null,
          requireAffiliateCode,
        }),
      });
      const data = await parseApiJson(res);
      if (!data.success) throw new Error(String(data.error || 'Error'));
      return data;
    },
    onSuccess: () => {
      toast({
        title: t?.success ?? 'Demande envoyée',
        description: t?.successDesc,
      });
      setCostEur('');
      setAdminMessage('');
      queryClient.invalidateQueries({ queryKey: queryKeys.affiliateGiveawayRequests });
      queryClient.invalidateQueries({ queryKey: queryKeys.userBalance });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : td.payoutError;
      toast({
        title: td.payoutError,
        description: message,
        variant: 'destructive',
      });
    },
  });

  if (statsQuery.isLoading || requestsQuery.isLoading || !session) {
    return <PageLoading variant="compact" message={messages.common.loading} className="min-h-[50vh]" />;
  }

  if (!t) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-500/20 bg-slate-900/50">
          <CardContent className="p-8 text-center space-y-4">
            <h2 className="text-xl font-bold text-white">{messages.common.error}</h2>
            <p className="text-muted-foreground text-sm">{messages.error.message}</p>
            <Button asChild variant="outline">
              <Link href="/affiliate">Retour</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requestsQuery.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-500/20 bg-slate-900/50">
          <CardContent className="p-8 text-center space-y-4">
            <h2 className="text-xl font-bold text-white">{td.payoutError}</h2>
            <p className="text-muted-foreground text-sm">
              {requestsQuery.error instanceof Error
                ? requestsQuery.error.message
                : messages.common.error}
            </p>
            <Button variant="outline" onClick={() => requestsQuery.refetch()}>
              {messages.error.retry}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
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

  const getStatusLabel = (status: GiveawayRequestRow['status']) =>
    t[REQUEST_STATUS_LABELS[status]] ?? status;

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
                {String(t.maxPendingReached).replace('{max}', String(maxPending))}
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

            <div className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/40 p-3">
              <input
                id="requireAffiliateCode"
                type="checkbox"
                checked={requireAffiliateCode}
                onChange={(e) => setRequireAffiliateCode(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-800 accent-purple-500"
              />
              <div className="space-y-1">
                <Label htmlFor="requireAffiliateCode" className="text-slate-200 cursor-pointer">
                  {t.requireAffiliateCode}
                </Label>
                <p className="text-xs text-slate-400">{t.requireAffiliateCodeHint}</p>
              </div>
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
                      {req.requireAffiliateCode === false ? ` · ${t.publicAccess}` : ` · ${t.privateAccess}`}
                    </p>
                    {req.giveaway && (
                      <Link
                        href={`/giveaways/${req.giveaway.id}`}
                        className="text-xs text-purple-400 hover:text-purple-300 underline"
                      >
                        {t.viewGiveaway}: {req.giveaway.title}
                      </Link>
                    )}
                  </div>
                  <Badge variant="outline">{getStatusLabel(req.status)}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
