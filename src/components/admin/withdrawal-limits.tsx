'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/components/providers/locale-provider';
import { TrendingUp, RefreshCw } from 'lucide-react';

const formatCents = (cents: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);

interface WithdrawalLimitsProps {
  userId: string;
  monthlyLimitCents?: number | null;
  monthlyUsedCents?: number;
  onUpdate?: () => void;
}

export function WithdrawalLimits({
  userId,
  monthlyLimitCents: initialLimit = null,
  monthlyUsedCents: initialUsed = 0,
  onUpdate,
}: WithdrawalLimitsProps) {
  const { messages } = useLocale();
  const t = messages.admin.withdrawalLimits;

  const [inputValue, setInputValue] = useState(
    initialLimit != null ? String(initialLimit / 100) : ''
  );
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: limitsData, isLoading: loading } = useQuery({
    queryKey: ['admin', 'withdrawal-limits', userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/withdrawal-limits/${userId}`);
      if (!res.ok) throw new Error(t.loadingError);
      const data = await res.json();
      onUpdate?.();
      return data;
    },
    enabled: !!userId,
  });

  const DEFAULT_LIMIT = 500000; // 5000€
  const limitCents: number | null = limitsData?.monthlyLimitCents ?? initialLimit ?? DEFAULT_LIMIT;
  const usedCents: number = limitsData?.monthlyUsedCents ?? initialUsed;

  const handleSave = async () => {
    const raw = inputValue.trim() === '' ? null : Math.round(parseFloat(inputValue.replace(',', '.')) * 100);
    if (raw !== null && (isNaN(raw) || raw < 0)) {
      toast({ title: t.invalidAmount, variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/withdrawal-limits/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyLimitCents: raw }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.error);
      }
      toast({ title: t.limitUpdated });
      if (raw != null) setInputValue(String(raw / 100));
      else setInputValue('');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawal-limits'] });
    } catch (e) {
      toast({
        title: t.error,
        description: e instanceof Error ? e.message : t.cannotSave,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const limitNum = limitCents ?? 0;
  const progress = limitNum > 0 ? Math.min(100, (usedCents / limitNum) * 100) : 0;

  return (
    <Card className="bg-slate-800/30 border-slate-700">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawal-limits'] })} disabled={loading} className="text-slate-400">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400">{t.usedThisMonth}</p>
            <p className="text-lg font-semibold text-white">{formatCents(usedCents)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">{t.limit}</p>
            <p className="text-lg font-semibold text-slate-300">
              {limitCents == null ? t.unlimited : formatCents(limitCents)}
            </p>
          </div>
        </div>
        {limitCents != null && limitCents > 0 && (
          <div>
            <p className="text-xs text-slate-400 mb-1">{t.progress}</p>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <Label className="text-slate-300">{t.newLimitLabel}</Label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder={t.placeholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white mt-1 w-40"
            />
          </div>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {t.save}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
