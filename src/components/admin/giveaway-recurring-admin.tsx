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
  PencilIcon,
  CubeIcon,
  XMarkIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useLocale } from '@/components/providers/locale-provider';
import { PageLoading } from '@/components/ui/page-loading';
import { SafeImage } from '@/components/ui/safe-image';
import { SkinPickerModal } from '@/components/admin/skin-picker-modal';
import { GiveawayDurationPresets } from '@/components/admin/giveaway-duration-presets';
import { toDatetimeLocalValue } from '@/lib/giveaway-duration-presets';
import {
  GIVEAWAY_DEFAULT_MAX_TICKETS,
  GIVEAWAY_DEFAULT_TICKET_PRICE,
  GIVEAWAY_DEFAULT_WINNER_COUNT,
} from '@/lib/admin-constants';

type SeriesStatus = 'ACTIVE' | 'PAUSED' | 'DISABLED';
type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

interface SkinItem {
  steam_market_hash_name: string;
  icon_url: string | null;
  price: number | null;
  rarity: string | null;
  rarity_color: string | null;
  exterior: string | null;
  item_type: string | null;
  phase: string | null;
}

interface GiveawaySeriesRow {
  id: string;
  title: string;
  description: string;
  prize: string;
  prizeImageUrl?: string | null;
  steamMarketHashName?: string | null;
  ticketPrice: number;
  maxTickets: number;
  frequency: RecurringFrequency;
  durationMinutes: number;
  winnerCount: number;
  maxEntriesPerUser?: number | null;
  rewardValueCents: number;
  isPrivate: boolean;
  requiredAffiliateCode?: string | null;
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
  prizeImageUrl: string;
  steamMarketHashName: string;
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
  prizeImageUrl: '',
  steamMarketHashName: '',
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

function seriesToForm(row: GiveawaySeriesRow): SeriesForm {
  return {
    title: row.title,
    description: row.description,
    prize: row.prize,
    prizeImageUrl: row.prizeImageUrl ?? '',
    steamMarketHashName: row.steamMarketHashName ?? '',
    ticketPrice: row.ticketPrice,
    maxTickets: row.maxTickets,
    durationMinutes: row.durationMinutes,
    frequency: row.frequency,
    winnerCount: row.winnerCount,
    maxEntriesPerUser: row.maxEntriesPerUser != null ? String(row.maxEntriesPerUser) : '',
    rewardValueCents: row.rewardValueCents ?? 0,
    startDate: toDatetimeLocalValue(new Date(row.startDate)),
    endDate: row.endDate ? toDatetimeLocalValue(new Date(row.endDate)) : '',
    isPrivate: row.isPrivate === true,
    requiredAffiliateCode: row.requiredAffiliateCode ?? '',
  };
}

function skinFromSeries(row: GiveawaySeriesRow): SkinItem | null {
  if (!row.steamMarketHashName && !row.prizeImageUrl) return null;
  return {
    steam_market_hash_name: row.steamMarketHashName || row.prize,
    icon_url: row.prizeImageUrl ?? null,
    price: row.rewardValueCents != null ? row.rewardValueCents / 100 : null,
    rarity: null,
    rarity_color: null,
    exterior: null,
    item_type: null,
    phase: null,
  };
}

export function GiveawayRecurringAdmin() {
  const { messages } = useLocale();
  const t = messages.admin.giveaways.recurring;
  const formT = messages.admin.giveaways.form;
  const [series, setSeries] = useState<GiveawaySeriesRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SeriesForm>(defaultForm);
  const [selectedSkin, setSelectedSkin] = useState<SkinItem | null>(null);
  const [skinPickerOpen, setSkinPickerOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const instanceDemand = Math.max(0, form.ticketPrice) * Math.max(0, form.maxTickets);

  const handleSelectSkin = (skin: SkinItem) => {
    setSelectedSkin(skin);
    setForm((prev) => ({
      ...prev,
      prize: skin.steam_market_hash_name,
      prizeImageUrl: skin.icon_url ?? '',
      steamMarketHashName: skin.steam_market_hash_name,
      rewardValueCents: skin.price != null ? Math.round(skin.price * 100) : prev.rewardValueCents,
    }));
  };

  const handleClearSkin = () => {
    setSelectedSkin(null);
    setForm((prev) => ({ ...prev, prize: '', prizeImageUrl: '', steamMarketHashName: '' }));
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(defaultForm());
    setSelectedSkin(null);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm());
    setSelectedSkin(null);
    setShowForm(true);
  };

  const handleStartEdit = (row: GiveawaySeriesRow) => {
    setEditingId(row.id);
    setForm(seriesToForm(row));
    setSelectedSkin(skinFromSeries(row));
    setShowForm(true);
  };

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

  const handleDelete = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    setActionLoading(`${id}-delete`);
    try {
      const res = await fetch(`/api/admin/giveaway-series/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.deleteError);
      }
      toast.success(t.deleteSuccess);
      if (editingId === id) closeForm();
      await loadSeries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.deleteError);
    } finally {
      setActionLoading(null);
    }
  };

  const seriesPayload = () => {
    const prizeValue = selectedSkin?.steam_market_hash_name || form.prize;
    return {
      title: form.title,
      description: form.description,
      prize: prizeValue,
      prizeImageUrl: form.prizeImageUrl || null,
      steamMarketHashName: form.steamMarketHashName || null,
      ticketPrice: form.ticketPrice,
      maxTickets: form.maxTickets,
      durationMinutes: form.durationMinutes,
      frequency: form.frequency,
      winnerCount: form.winnerCount,
      maxEntriesPerUser: form.maxEntriesPerUser.trim()
        ? parseInt(form.maxEntriesPerUser, 10)
        : null,
      rewardValueCents: form.rewardValueCents,
      startDate: new Date(form.startDate).toISOString(),
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      isPrivate: form.isPrivate,
      requiredAffiliateCode:
        form.isPrivate && form.requiredAffiliateCode.trim()
          ? form.requiredAffiliateCode.trim()
          : null,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prizeValue = selectedSkin?.steam_market_hash_name || form.prize;
    if (!form.title || !form.description || !prizeValue) {
      toast.error(t.requiredFields);
      return;
    }
    setSaving(true);
    try {
      const payload = seriesPayload();
      const res = editingId
        ? await fetch(`/api/admin/giveaway-series/${editingId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, syncActiveInstance: true }),
          })
        : await fetch('/api/admin/giveaway-series', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || (editingId ? t.updateError : t.createError));
      }
      toast.success(editingId ? t.updateSuccess : t.createSuccess);
      closeForm();
      await loadSeries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : editingId ? t.updateError : t.createError);
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status: SeriesStatus) => {
    const colors: Record<SeriesStatus, string> = {
      ACTIVE: 'bg-green-500',
      PAUSED: 'bg-theme-stat',
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
          <Button
            onClick={() => (showForm ? closeForm() : openCreate())}
            className="bg-primary hover:bg-primary/90"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            {showForm ? t.cancelCreate : t.createSeries}
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">{editingId ? t.editTitle : t.createTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{t.formTitle}</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>{formT.prizeLabel}</Label>
                  {selectedSkin ? (
                    <div className="flex items-center gap-3 mt-1 p-3 rounded-xl border border-theme-accent/40 bg-slate-700/50">
                      <SafeImage
                        src={selectedSkin.icon_url}
                        alt={selectedSkin.steam_market_hash_name}
                        width={64}
                        height={48}
                        className="object-contain rounded shrink-0 drop-shadow-lg"
                        fallbackIcon={<CubeIcon className="w-8 h-8" />}
                        unoptimized
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{selectedSkin.steam_market_hash_name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {selectedSkin.price != null ? `~${selectedSkin.price.toFixed(2)} $` : formT.priceUnknown}
                          {selectedSkin.exterior ? ` · ${selectedSkin.exterior}` : ''}
                          {selectedSkin.rarity ? ` · ${selectedSkin.rarity}` : ''}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSkinPickerOpen(true)}
                          className="text-xs text-theme-highlight hover:text-theme-highlight transition-colors px-2 py-1 rounded border border-theme-accent/40 hover:border-theme-highlight"
                        >
                          {formT.changeSkin}
                        </button>
                        <button type="button" onClick={handleClearSkin} className="text-slate-400 hover:text-red-400 transition-colors">
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSkinPickerOpen(true)}
                      className="mt-1 w-full flex items-center gap-3 rounded-xl border-2 border-dashed border-slate-600 hover:border-theme-accent/40 bg-slate-800/40 hover:bg-slate-700/40 px-4 py-4 transition-all group"
                    >
                      <div className="p-2 rounded-lg bg-theme-accent/10 group-hover:bg-theme-accent/20 transition-colors">
                        <CubeIcon className="w-6 h-6 text-theme-highlight" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                          {formT.chooseSkin}
                        </p>
                        <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                          {formT.browseSkinplace}
                        </p>
                      </div>
                    </button>
                  )}
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
                <div className="md:col-span-2">
                  <GiveawayDurationPresets
                    id="series-duration"
                    value={form.durationMinutes}
                    onChange={(minutes) => setForm((p) => ({ ...p, durationMinutes: minutes }))}
                    labels={formT.durationPresets}
                    durationLabel={t.formDuration}
                    durationHelp={formT.durationHelp}
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
                  <Label>{formT.maxTicketsLabel}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.maxTickets}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, maxTickets: parseInt(e.target.value, 10) || 1 }))
                    }
                  />
                </div>
                <div>
                  <Label>{formT.rewardValueLabel}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.rewardValueCents}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, rewardValueCents: parseInt(e.target.value, 10) || 0 }))
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
                <div>
                  <Label>{formT.maxEntriesPerUserLabel}</Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder={formT.maxEntriesPlaceholder}
                    value={form.maxEntriesPerUser}
                    onChange={(e) => setForm((p) => ({ ...p, maxEntriesPerUser: e.target.value }))}
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
              <p className="text-sm text-theme-highlight">
                {t.instanceDemand.replace('{count}', instanceDemand.toLocaleString('fr-FR'))}
              </p>
              {editingId && <p className="text-xs text-slate-400">{t.syncHint}</p>}
              <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
                {editingId
                  ? saving
                    ? t.updating
                    : t.submitUpdate
                  : saving
                    ? t.creating
                    : t.submitCreate}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <PageLoading variant="compact" message={t.loading} />
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
                        <SafeImage
                          src={row.prizeImageUrl}
                          alt={row.prize}
                          width={52}
                          height={38}
                          className="object-contain rounded shrink-0"
                          fallbackIcon={<CubeIcon className="w-8 h-8 text-theme-accent" />}
                          unoptimized
                        />
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
                            {row.nextSpawnAt ? new Date(row.nextSpawnAt).toLocaleString() : '-'}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500">{t.currentInstance}</span>
                          <p className="text-white">{activeInstance?.status ?? t.noActiveInstance}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartEdit(row)}
                      >
                        <PencilIcon className="w-4 h-4 mr-1" />
                        {t.edit}
                      </Button>
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
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={actionLoading === `${row.id}-delete`}
                        onClick={() => handleDelete(row.id)}
                      >
                        <TrashIcon className="w-4 h-4 mr-1" />
                        {t.delete}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <SkinPickerModal
        open={skinPickerOpen}
        onOpenChange={setSkinPickerOpen}
        onSelect={handleSelectSkin}
        selected={selectedSkin}
      />
    </div>
  );
}
