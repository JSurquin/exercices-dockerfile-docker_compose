'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  ArrowPathIcon,
  PauseIcon,
  PlayIcon,
  PowerIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useLocale } from '@/components/providers/locale-provider';
import {
  GIVEAWAY_DEFAULT_MAX_TICKETS,
  GIVEAWAY_DEFAULT_TICKET_PRICE,
  GIVEAWAY_DEFAULT_WINNER_COUNT,
} from '@/lib/admin-constants';

type SeriesStatus = 'ACTIVE' | 'PAUSED' | 'DISABLED';
type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

interface GiveawaySeriesRow {
  id: string;
  title: string;
  description: string;
  prize: string;
  frequency: RecurringFrequency;
  durationMinutes: number;
  status: SeriesStatus;
  startDate: string;
  endDate: string | null;
  nextSpawnAt: string | null;
  spawnCount: number;
  instanceCount?: number;
  instances?: {
    id: string;
    status: string;
    endDate: string;
    _count?: { entries: number };
  }[];
}

interface SeriesForm {
  title: string;
  description: string;
  prize: string;
  ticketPrice: number;
  maxTickets: number;
  durationMinutes: number;
  frequency: RecurringFrequency;
  winnerCount: number;
  maxEntriesPerUser: string;
  rewardValueCents: number;
  startDate: string;
  endDate: string;
  isPrivate: boolean;
  requiredAffiliateCode: string;
}

const defaultForm = (): SeriesForm => ({
  title: '',
  description: '',
  prize: '',
  ticketPrice: GIVEAWAY_DEFAULT_TICKET_PRICE,
  maxTickets: GIVEAWAY_DEFAULT_MAX_TICKETS,
  durationMinutes: 24 * 60,
  frequency: 'WEEKLY',
  winnerCount: GIVEAWAY_DEFAULT_WINNER_COUNT,
  maxEntriesPerUser: '',
  rewardValueCents: 0,
  startDate: new Date().toISOString().slice(0, 16),
  endDate: '',
  isPrivate: false,
  requiredAffiliateCode: '',
});

export function GiveawayRecurringAdmin() {
  const { messages } = useLocale();
  const t = messages.admin.giveaways.recurring;
  const [series, setSeries] = useState<GiveawaySeriesRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SeriesForm>(defaultForm);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadSeries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/giveaway-series', { credentials: 'include' });
      if (!res.ok) throw new Error();
      setSeries(await res.json());
    } catch {
      toast.error(t.loadError);
    } finally {
      setLoading(false);
    }
  }, [t.loadError]);

  useEffect(() => {
    loadSeries();
  }, [loadSeries]);

  const runAction = async (id: string, action: 'pause' | 'resume' | 'disable' | 'restart' | 'spawn') => {
    setActionLoading(`${id}-${action}`);
    try {
      const res = await fetch(`/api/admin/giveaway-series/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.actionError);
      }
      toast.success(t.actionSuccess.replace('{action}', action));
      await loadSeries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.actionError);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.prize) {
      toast.error(t.requiredFields);
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/giveaway-series', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          maxEntriesPerUser: form.maxEntriesPerUser.trim()
            ? parseInt(form.maxEntriesPerUser, 10)
            : null,
          startDate: new Date(form.startDate).toISOString(),
          endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
          requiredAffiliateCode:
            form.isPrivate && form.requiredAffiliateCode.trim()
              ? form.requiredAffiliateCode.trim()
              : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.createError);
      }
      toast.success(t.createSuccess);
      setForm(defaultForm());
      setShowForm(false);
      await loadSeries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.createError);
    } finally {
      setCreating(false);
    }
  };

  const statusBadge = (status: SeriesStatus) => {
    const colors: Record<SeriesStatus, string> = {
      ACTIVE: 'bg-green-500',
      PAUSED: 'bg-amber-500',
      DISABLED: 'bg-slate-500',
    };
    return (
      <Badge className={colors[status]}>
        {t.status[status.toLowerCase() as keyof typeof t.status] ?? status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">{t.title}</h2>
          <p className="text-sm text-slate-400 mt-1">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSeries} disabled={loading}>
            {loading ? t.loading : t.refresh}
          </Button>
          <Button onClick={() => setShowForm((v) => !v)} className="bg-orange-500 hover:bg-orange-600">
            <PlusIcon className="w-4 h-4 mr-2" />
            {showForm ? t.cancelCreate : t.createSeries}
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">{t.createTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{t.formTitle}</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>{t.formPrize}</Label>
                  <Input
                    value={form.prize}
                    onChange={(e) => setForm((p) => ({ ...p, prize: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>{t.formFrequency}</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.frequency}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, frequency: e.target.value as RecurringFrequency }))
                    }
                  >
                    <option value="DAILY">{t.frequency.daily}</option>
                    <option value="WEEKLY">{t.frequency.weekly}</option>
                    <option value="MONTHLY">{t.frequency.monthly}</option>
                    <option value="YEARLY">{t.frequency.yearly}</option>
                  </select>
                </div>
                <div>
                  <Label>{t.formDuration}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.durationMinutes}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, durationMinutes: parseInt(e.target.value, 10) || 1 }))
                    }
                  />
                </div>
                <div>
                  <Label>{t.formStartDate}</Label>
                  <Input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>{t.formEndDate}</Label>
                  <Input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t.formEndDateHint}</p>
                </div>
                <div>
                  <Label>{t.formEntryPrice}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.ticketPrice}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, ticketPrice: parseInt(e.target.value, 10) || 1 }))
                    }
                  />
                </div>
                <div>
                  <Label>{t.formWinnerCount}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.winnerCount}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, winnerCount: parseInt(e.target.value, 10) || 1 }))
                    }
                  />
                </div>
              </div>
              <div>
                <Label>{t.formDescription}</Label>
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  required
                />
              </div>
              <div className="rounded-lg border border-purple-500/30 bg-purple-950/10 p-4">
                <div className="flex items-center justify-between">
                  <Label className="text-purple-300">{t.formPrivate}</Label>
                  <Switch
                    checked={form.isPrivate}
                    onCheckedChange={(v) => setForm((p) => ({ ...p, isPrivate: v }))}
                  />
                </div>
                {form.isPrivate && (
                  <Input
                    className="mt-3 font-mono"
                    placeholder={t.formAffiliateCode}
                    value={form.requiredAffiliateCode}
                    onChange={(e) => setForm((p) => ({ ...p, requiredAffiliateCode: e.target.value }))}
                  />
                )}
              </div>
              <Button type="submit" disabled={creating} className="bg-orange-500 hover:bg-orange-600">
                {creating ? t.creating : t.submitCreate}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center text-slate-300">{t.loading}</CardContent>
        </Card>
      ) : series.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <p className="text-slate-300">{t.empty}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {series.map((row) => {
            const activeInstance = row.instances?.find((i) => i.status === 'ACTIVE' || i.status === 'PAUSED');
            return (
              <Card key={row.id} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">{row.title}</h3>
                        {statusBadge(row.status)}
                        <Badge variant="outline">{t.frequency[row.frequency.toLowerCase() as keyof typeof t.frequency] ?? row.frequency}</Badge>
                      </div>
                      <p className="text-sm text-slate-400 mb-3">{row.prize}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-slate-500">{t.instances}</span>
                          <p className="text-white">{row.spawnCount}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">{t.duration}</span>
                          <p className="text-white">{row.durationMinutes} min</p>
                        </div>
                        <div>
                          <span className="text-slate-500">{t.nextSpawn}</span>
                          <p className="text-white">
                            {row.nextSpawnAt ? new Date(row.nextSpawnAt).toLocaleString() : '—'}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500">{t.currentInstance}</span>
                          <p className="text-white">{activeInstance?.status ?? t.noActiveInstance}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {row.status === 'ACTIVE' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading === `${row.id}-pause`}
                          onClick={() => runAction(row.id, 'pause')}
                        >
                          <PauseIcon className="w-4 h-4 mr-1" />
                          {t.pause}
                        </Button>
                      )}
                      {row.status === 'PAUSED' && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          disabled={actionLoading === `${row.id}-resume`}
                          onClick={() => runAction(row.id, 'resume')}
                        >
                          <PlayIcon className="w-4 h-4 mr-1" />
                          {t.resume}
                        </Button>
                      )}
                      {row.status !== 'DISABLED' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={actionLoading === `${row.id}-disable`}
                          onClick={() => runAction(row.id, 'disable')}
                        >
                          <PowerIcon className="w-4 h-4 mr-1" />
                          {t.disable}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading === `${row.id}-restart`}
                        onClick={() => runAction(row.id, 'restart')}
                      >
                        <ArrowPathIcon className="w-4 h-4 mr-1" />
                        {t.restart}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
