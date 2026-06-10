'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/components/providers/locale-provider';
import { Snowflake, Sun, Plus, Minus, RefreshCw, Wallet } from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';

const formatCents = (cents: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);

const formatDate = (d: Date | string) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(d));

export interface BalanceContext {
  balanceCents: number;
  pendingBalanceCents: number;
  frozenBalanceCents: number;
  availableCents: number;
  accountFrozen: boolean;
  monthlyLimitCents: number | null;
  monthlyUsedCents: number;
  transactions: {
    id: string;
    type: string;
    amountCents: number;
    balanceAfterCents: number;
    reason: string | null;
    createdAt: Date | string;
  }[];
}

interface BalanceManagementProps {
  userId: string;
  initialContext?: BalanceContext | null;
  onUpdate?: () => void;
}

export function BalanceManagement({ userId, initialContext, onUpdate }: BalanceManagementProps) {
  const { messages } = useLocale();
  const t = messages.admin.balanceManagement;

  const queryClient = useQueryClient();
  const [adjusting, setAdjusting] = useState(false);
  const [freezing, setFreezing] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [freezeReason, setFreezeReason] = useState('');
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.adminBalance(userId),
    queryFn: async () => {
      const res = await fetch(`/api/admin/balance/${userId}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || res.statusText);
      }
      return res.json() as Promise<BalanceContext>;
    },
    initialData: initialContext ?? undefined,
  });

  const context = data ?? null;
  const loading = isLoading;

  const handleAdjust = async (sign: 'add' | 'subtract') => {
    const raw = parseInt(adjustAmount, 10);
    if (isNaN(raw) || raw <= 0 || !adjustReason.trim()) {
      toast({
        title: t.invalidInput,
        description: t.invalidInputDesc,
        variant: 'destructive',
      });
      return;
    }
    const amountCents = sign === 'add' ? raw : -raw;
    setAdjusting(true);
    try {
      const res = await fetch('/api/admin/balance/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amountCents, reason: adjustReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.error);
      toast({
        title: t.balanceUpdated,
        description: t.balanceUpdatedDesc.replace('{balance}', formatCents(data.balanceAfterCents))
      });
      setAdjustAmount('');
      setAdjustReason('');
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminBalance(userId) });
      onUpdate?.();
    } catch (e) {
      toast({
        title: t.error,
        description: e instanceof Error ? e.message : t.adjustmentError,
        variant: 'destructive',
      });
    } finally {
      setAdjusting(false);
    }
  };

  const handleFreeze = async () => {
    if (!freezeReason.trim()) {
      toast({ title: t.reasonRequired, variant: 'destructive' });
      return;
    }
    setFreezing(true);
    try {
      const res = await fetch('/api/admin/balance/freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reason: freezeReason.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.error);
      }
      toast({ title: t.accountFrozen });
      setFreezeReason('');
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminBalance(userId) });
      onUpdate?.();
    } catch (e) {
      toast({
        title: t.error,
        description: e instanceof Error ? e.message : t.cannotFreeze,
        variant: 'destructive',
      });
    } finally {
      setFreezing(false);
    }
  };

  const handleUnfreeze = async () => {
    setFreezing(true);
    try {
      const res = await fetch('/api/admin/balance/unfreeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.error);
      }
      toast({ title: t.accountUnfrozen });
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminBalance(userId) });
      onUpdate?.();
    } catch (e) {
      toast({
        title: t.error,
        description: e instanceof Error ? e.message : t.cannotUnfreeze,
        variant: 'destructive',
      });
    } finally {
      setFreezing(false);
    }
  };

  if (loading && !context) {
    return (
      <Card className="bg-slate-800/30 border-slate-700">
        <CardContent className="p-0">
          <PageLoading variant="compact" message={t.loading} className="py-8" />
        </CardContent>
      </Card>
    );
  }

  if (!context) return null;

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/30 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {t.title}
            {context.accountFrozen && (
              <Badge variant="destructive" className="ml-2">
                <Snowflake className="h-3 w-3 mr-1" />
                {t.frozen}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-400">{t.totalBalance}</p>
              <p className="text-lg font-semibold text-white">{formatCents(context.balanceCents)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{t.pending}</p>
              <p className="text-lg font-semibold text-blue-400">{formatCents(context.pendingBalanceCents)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{t.frozenBalance}</p>
              <p className="text-lg font-semibold text-theme-highlight">{formatCents(context.frozenBalanceCents)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{t.available}</p>
              <p className="text-lg font-semibold text-green-400">{formatCents(context.availableCents)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-end gap-2 flex-1 min-w-[200px]">
              <div className="flex-1">
                <Label className="text-slate-300">{t.amountLabel}</Label>
                <Input
                  type="number"
                  placeholder={t.amountPlaceholder}
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                />
              </div>
              <div className="flex-1">
                <Label className="text-slate-300">{t.reasonLabel}</Label>
                <Input
                  placeholder={t.reasonPlaceholder}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <Button
                size="sm"
                onClick={() => handleAdjust('add')}
                disabled={adjusting}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                {t.credit}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleAdjust('subtract')}
                disabled={adjusting}
              >
                <Minus className="h-4 w-4 mr-1" />
                {t.debit}
              </Button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700">
            {context.accountFrozen ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleUnfreeze}
                disabled={freezing}
                className="border-emerald-600 text-emerald-400 hover:bg-emerald-900/30"
              >
                <Sun className="h-4 w-4 mr-2" />
                {t.unfreezeButton}
              </Button>
            ) : (
              <>
                <Input
                  placeholder={t.freezeReasonPlaceholder}
                  value={freezeReason}
                  onChange={(e) => setFreezeReason(e.target.value)}
                  className="max-w-xs bg-slate-700 border-slate-600 text-white mr-2 mb-2 sm:mb-0 sm:inline-flex"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleFreeze}
                  disabled={freezing || !freezeReason.trim()}
                >
                  <Snowflake className="h-4 w-4 mr-2" />
                  {t.freezeButton}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/30 border-slate-700">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-white text-base">{t.transactionsTitle}</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.adminBalance(userId) })} className="text-slate-400">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-400 whitespace-nowrap">{t.colDate}</TableHead>
                <TableHead className="text-slate-400 whitespace-nowrap">{t.colType}</TableHead>
                <TableHead className="text-slate-400 whitespace-nowrap">{t.colAmount}</TableHead>
                <TableHead className="text-slate-400 whitespace-nowrap">{t.colBalanceAfter}</TableHead>
                <TableHead className="text-slate-400 whitespace-nowrap">{t.colReason}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {context.transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-slate-500 text-center py-4">
                    {t.noTransactions}
                  </TableCell>
                </TableRow>
              ) : (
                context.transactions.map((tx) => (
                  <TableRow key={tx.id} className="border-slate-700">
                    <TableCell className="text-slate-300 text-sm">{formatDate(tx.createdAt)}</TableCell>
                    <TableCell className="text-slate-300">{tx.type}</TableCell>
                    <TableCell
                      className={tx.amountCents >= 0 ? 'text-green-400' : 'text-red-400'}
                    >
                      {tx.amountCents >= 0 ? '+' : ''}{formatCents(tx.amountCents)}
                    </TableCell>
                    <TableCell className="text-white">{formatCents(tx.balanceAfterCents)}</TableCell>
                    <TableCell className="text-slate-400 max-w-[200px] truncate">{tx.reason || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
