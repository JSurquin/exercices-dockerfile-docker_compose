'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Key, Trash2, Webhook, Plus, Activity, Save, Globe, Search } from 'lucide-react';
import { AdminUserCombobox } from '@/components/admin/admin-user-combobox';
import { AdminUserLink } from '@/components/admin/admin-user-link';
import { SecretValueField } from '@/components/ui/secret-value-field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLocale } from '@/components/providers/locale-provider';
import { useToast } from '@/hooks/use-toast';
import {
  adminBtnOutline,
  adminBtnPrimary,
  adminGlassCard,
  panelGlassField,
  panelListRow,
} from '@/lib/admin-ui';
import { cn } from '@/lib/utils';
import {
  partnerAdminPageCopy,
  partnerCallLabel,
  partnerEventLabel,
  partnerHttpResultLabel,
  partnerScopeHelp,
  partnerScopeLabel,
  partnerStatusLabel,
  partnerStatusTone,
} from '@/lib/partner-api/admin-labels';
import type { Locale } from '@/lib/i18n';

const ALL_SCOPES = ['read', 'trade', 'payout'] as const;
const DEFAULT_SCOPES = [...ALL_SCOPES];

interface ApiClientRow {
  id: string;
  name: string;
  user_id: string;
  status: string;
  scopes: string[];
  rate_limit_per_min: number;
  webhook_url: string | null;
  key_prefix: string;
  last_used_at: string | null;
  user: {
    steam_username: string | null;
    steam_id: string | null;
    email: string;
    avatar: string;
  };
  stats: { api_calls: number; webhook_deliveries: number };
}

interface WebhookDelivery {
  id: string;
  partner_name: string;
  user_id: string;
  account_name: string;
  avatar: string;
  event_type: string;
  event_status: string | null;
  resource_id: string;
  status: string;
  http_status: number | null;
  attempts: number;
  created_at: string;
}

interface ApiCallLog {
  id: string;
  partner_name: string;
  user_id: string;
  account_name: string;
  steam_id: string | null;
  avatar: string;
  endpoint: string;
  method: string;
  status_code: number;
  ip_address: string | null;
  duration_ms: number | null;
  created_at: string;
}

function formatWhen(iso: string, locale: Locale) {
  const loc = locale === 'cn' ? 'zh-CN' : locale === 'en' ? 'en-GB' : 'fr-FR';
  return new Date(iso).toLocaleString(loc, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toneBadgeClass(tone: ReturnType<typeof partnerStatusTone>) {
  if (tone === 'success') return 'border-emerald-500/35 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
  if (tone === 'danger') return 'border-red-500/35 bg-red-500/15 text-red-700 dark:text-red-300';
  if (tone === 'warning') return 'border-amber-500/35 bg-amber-500/15 text-amber-800 dark:text-amber-200';
  if (tone === 'info') return 'border-sky-500/35 bg-sky-500/15 text-sky-700 dark:text-sky-300';
  return '';
}

function httpBadgeClass(code: number) {
  if (code < 300) return toneBadgeClass('success');
  if (code < 500) return toneBadgeClass('warning');
  return toneBadgeClass('danger');
}

function EventBadges({
  eventType,
  eventStatus,
  locale,
}: {
  eventType: string;
  eventStatus: string | null;
  locale: Locale;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Badge variant="outline" className="border-theme-accent/30 bg-theme-accent/10 text-theme-highlight">
        {partnerEventLabel(eventType, locale)}
      </Badge>
      {eventStatus && (
        <Badge variant="outline" className={cn('font-normal', toneBadgeClass(partnerStatusTone(eventStatus)))}>
          {partnerStatusLabel(eventStatus, locale)}
        </Badge>
      )}
    </span>
  );
}

function matchesLogSearch(log: ApiCallLog, query: string, locale: Locale): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    log.account_name,
    log.partner_name,
    log.steam_id,
    log.ip_address,
    log.endpoint,
    log.method,
    String(log.status_code),
    partnerCallLabel(log.method, log.endpoint, locale),
    partnerHttpResultLabel(log.status_code, locale),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

export default function AdminApiClientsPage() {
  const { locale } = useLocale();
  const t = partnerAdminPageCopy(locale);
  const { toast } = useToast();
  const [clients, setClients] = useState<ApiClientRow[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiCallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<{ api_key: string; webhook_secret: string } | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    user_id: '',
    rate_limit: '100',
    scopes: DEFAULT_SCOPES,
  });
  const [rateLimitEdits, setRateLimitEdits] = useState<Record<string, string>>({});
  const [savingRateLimit, setSavingRateLimit] = useState<string | null>(null);
  const [logSearch, setLogSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [clientsRes, deliveriesRes, logsRes] = await Promise.all([
        fetch('/api/admin/api-clients'),
        fetch('/api/admin/api-clients/deliveries?limit=30'),
        fetch('/api/admin/api-clients/logs?limit=200'),
      ]);
      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data.clients ?? []);
      }
      if (deliveriesRes.ok) {
        const data = await deliveriesRes.json();
        setDeliveries(data.deliveries ?? []);
      }
      if (logsRes.ok) {
        const data = await logsRes.json();
        setApiLogs(data.logs ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.user_id.trim() || form.scopes.length === 0) return;
    setCreating(true);
    setNewKey(null);
    try {
      const res = await fetch('/api/admin/api-clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          user_id: form.user_id.trim(),
          rate_limit_per_min: parseInt(form.rate_limit, 10) || 100,
          scopes: form.scopes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewKey({ api_key: data.api_key, webhook_secret: data.webhook_secret });
        setForm({ name: '', user_id: '', rate_limit: '100', scopes: DEFAULT_SCOPES });
        await load();
      } else {
        toast({
          title: t.createError,
          description: typeof data.error === 'string' ? data.error : undefined,
          variant: 'destructive',
        });
      }
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    await fetch(`/api/admin/api-clients/${id}`, { method: 'DELETE' });
    setRevokeId(null);
    await load();
  };

  const handleSaveRateLimit = async (id: string) => {
    const value = rateLimitEdits[id];
    const parsed = parseInt(value, 10);
    if (!value || Number.isNaN(parsed) || parsed < 10 || parsed > 1000) {
      toast({ title: t.rateError, variant: 'destructive' });
      return;
    }
    setSavingRateLimit(id);
    try {
      const res = await fetch(`/api/admin/api-clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate_limit_per_min: parsed }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast({
          title: t.updateError,
          description: typeof data.error === 'string' ? data.error : undefined,
          variant: 'destructive',
        });
        return;
      }
      setRateLimitEdits((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await load();
    } finally {
      setSavingRateLimit(null);
    }
  };

  const filteredLogs = useMemo(
    () => apiLogs.filter((log) => matchesLogSearch(log, logSearch, locale)),
    [apiLogs, logSearch, locale]
  );

  const stats = useMemo(
    () => ({
      partners: clients.length,
      calls: apiLogs.length,
      webhooks: deliveries.length,
    }),
    [clients.length, apiLogs.length, deliveries.length]
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Key className="h-6 w-6 text-theme-accent" />
          {t.title}
        </h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">{t.subtitle}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: t.statPartners, value: stats.partners, icon: Key },
          { label: t.statCalls, value: stats.calls, icon: Activity },
          { label: t.statWebhooks, value: stats.webhooks, icon: Webhook },
        ].map((stat) => (
          <Card key={stat.label} className={adminGlassCard}>
            <CardContent className="flex items-center gap-3 p-4">
              <stat.icon className="h-5 w-5 text-theme-accent shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-semibold tabular-nums">{loading ? '—' : stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_1fr]">
        <Card className={adminGlassCard}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5 text-theme-accent" />
              {t.createTitle}
            </CardTitle>
            <p className="text-sm text-muted-foreground font-normal">{t.createHint}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t.nameLabel}</Label>
              <Input
                className={panelGlassField}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t.namePlaceholder}
              />
            </div>
            <div>
              <Label>{t.userLabel}</Label>
              <AdminUserCombobox
                value={form.user_id}
                onChange={(userId) => setForm((f) => ({ ...f, user_id: userId }))}
                placeholder={t.userPlaceholder}
                disabled={creating}
              />
            </div>
            <div>
              <Label>{t.rateLabel}</Label>
              <Input
                type="number"
                className={panelGlassField}
                value={form.rate_limit}
                onChange={(e) => setForm((f) => ({ ...f, rate_limit: e.target.value }))}
              />
            </div>
            <div>
              <Label>{t.scopesLabel}</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">{t.scopesHint}</p>
              <div className="space-y-2">
                {ALL_SCOPES.map((scope) => {
                  const checked = form.scopes.includes(scope);
                  const id = `partner-scope-${scope}`;
                  return (
                    <div
                      key={scope}
                      className={cn(
                        'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                        checked
                          ? 'border-theme-accent/30 bg-theme-accent/8'
                          : 'border-border/50 bg-background/20'
                      )}
                    >
                      <Checkbox
                        id={id}
                        className="mt-0.5"
                        checked={checked}
                        onCheckedChange={(next) => {
                          setForm((f) => ({
                            ...f,
                            scopes:
                              next === true
                                ? [...f.scopes.filter((s) => s !== scope), scope]
                                : f.scopes.filter((s) => s !== scope),
                          }));
                        }}
                        disabled={creating}
                      />
                      <label htmlFor={id} className="min-w-0 cursor-pointer">
                        <span className="block text-sm font-medium">
                          {partnerScopeLabel(scope, locale)}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                          {partnerScopeHelp(scope, locale)}
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
            <Button
              className={adminBtnPrimary}
              onClick={() => void handleCreate()}
              disabled={creating || !form.name.trim() || !form.user_id || form.scopes.length === 0}
            >
              {creating ? t.generating : t.generate}
            </Button>
          </CardContent>
        </Card>

        <Card className={adminGlassCard}>
          <CardHeader>
            <CardTitle className="text-lg">
              {t.keysTitle}
              <span className="ml-2 text-sm font-normal text-muted-foreground">({clients.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">{t.loading}</p>
            ) : clients.length === 0 ? (
              <p className="text-muted-foreground">{t.noKeys}</p>
            ) : (
              <div className="space-y-3">
                {clients.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-border/60 bg-background/20 p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <AdminUserLink
                        userId={c.user_id}
                        name={c.user.steam_username || c.name}
                        avatar={c.user.avatar}
                        subtitle={c.name}
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setRevokeId(c.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {t.revoke}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {c.scopes.map((scope) => (
                        <Badge key={scope} variant="outline" title={partnerScopeHelp(scope, locale)}>
                          {partnerScopeLabel(scope, locale)}
                        </Badge>
                      ))}
                      <Badge variant="secondary">{c.stats.api_calls} {locale === 'en' ? 'calls' : locale === 'cn' ? '次调用' : 'appels'}</Badge>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground">{c.key_prefix}…</p>
                    {c.webhook_url && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                        <Globe className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{c.webhook_url}</span>
                      </p>
                    )}
                    {c.last_used_at && (
                      <p className="text-xs text-muted-foreground">
                        {t.lastUsed} · {formatWhen(c.last_used_at, locale)}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs shrink-0">{t.reqMin}</Label>
                      <Input
                        type="number"
                        className={cn('h-8 w-24', panelGlassField)}
                        value={rateLimitEdits[c.id] ?? String(c.rate_limit_per_min)}
                        onChange={(e) =>
                          setRateLimitEdits((prev) => ({ ...prev, [c.id]: e.target.value }))
                        }
                      />
                      {rateLimitEdits[c.id] !== undefined &&
                        rateLimitEdits[c.id] !== String(c.rate_limit_per_min) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className={adminBtnOutline}
                            disabled={savingRateLimit === c.id}
                            onClick={() => void handleSaveRateLimit(c.id)}
                          >
                            <Save className="h-3 w-3 mr-1" />
                            {savingRateLimit === c.id ? '…' : t.save}
                          </Button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className={adminGlassCard}>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-theme-accent" />
              {t.logsTitle}
              {!loading && apiLogs.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({logSearch.trim() ? `${filteredLogs.length}/${apiLogs.length}` : apiLogs.length})
                </span>
              )}
            </CardTitle>
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder={t.logsSearch}
                className={cn('pl-8', panelGlassField)}
                disabled={loading || apiLogs.length === 0}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">{t.loading}</p>
          ) : apiLogs.length === 0 ? (
            <p className="text-muted-foreground">{t.noLogs}</p>
          ) : filteredLogs.length === 0 ? (
            <p className="text-muted-foreground">{t.logsNoMatch}</p>
          ) : (
            <div className="h-[28rem] overflow-y-auto overscroll-contain space-y-2 pr-1">
              {filteredLogs.map((log) => (
                <div key={log.id} className={panelListRow}>
                  <div className="flex flex-wrap items-center gap-3">
                    <AdminUserLink
                      userId={log.user_id}
                      name={log.account_name}
                      avatar={log.avatar}
                      subtitle={log.partner_name}
                      avatarSize="sm"
                    />
                    <p className="min-w-0 flex-1 text-sm font-medium">
                      {partnerCallLabel(log.method, log.endpoint, locale)}
                    </p>
                    <Badge variant="outline" className={cn('tabular-nums', httpBadgeClass(log.status_code))}>
                      {partnerHttpResultLabel(log.status_code, locale)}
                      <span className="ml-1 opacity-70">{log.status_code}</span>
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-mono tabular-nums">
                      {log.ip_address ?? t.unknownIp}
                    </span>
                    {log.duration_ms != null && (
                      <span className="tabular-nums">{log.duration_ms} ms</span>
                    )}
                    <span className="ml-auto whitespace-nowrap">{formatWhen(log.created_at, locale)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={adminGlassCard}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Webhook className="h-5 w-5 text-theme-accent" />
            {t.webhooksTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">{t.loading}</p>
          ) : deliveries.length === 0 ? (
            <p className="text-muted-foreground">{t.noWebhooks}</p>
          ) : (
            <div className="space-y-2">
              {deliveries.map((d) => (
                <div
                  key={d.id}
                  className={panelListRow}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminUserLink
                      userId={d.user_id}
                      name={d.account_name}
                      avatar={d.avatar}
                      avatarSize="sm"
                    />
                    <EventBadges eventType={d.event_type} eventStatus={d.event_status} locale={locale} />
                    <Badge
                      variant="outline"
                      className={cn(
                        'font-normal',
                        d.status === 'success'
                          ? toneBadgeClass('success')
                          : d.status === 'failed'
                            ? toneBadgeClass('danger')
                            : toneBadgeClass('warning')
                      )}
                    >
                      {d.status === 'success' ? t.delivered : d.status === 'failed' ? t.failed : partnerStatusLabel(d.status, locale)}
                    </Badge>
                    <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
                      {formatWhen(d.created_at, locale)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {d.resource_id && (
                      <span className="font-mono truncate max-w-[280px]">{d.resource_id}</span>
                    )}
                    {d.http_status != null && <span>HTTP {d.http_status}</span>}
                    <span>
                      {d.attempts} {t.attempts}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!newKey} onOpenChange={(open) => { if (!open) setNewKey(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.copyTitle}</DialogTitle>
            <DialogDescription>{t.copyDesc}</DialogDescription>
          </DialogHeader>
          {newKey && (
            <div className="space-y-4">
              <SecretValueField
                label={locale === 'en' ? 'API key' : locale === 'cn' ? 'API 密钥' : 'Clé API'}
                value={newKey.api_key}
                showLabel={locale === 'en' ? 'Show' : locale === 'cn' ? '显示' : 'Afficher'}
                hideLabel={locale === 'en' ? 'Hide' : locale === 'cn' ? '隐藏' : 'Masquer'}
                copyLabel={locale === 'en' ? 'Copy' : locale === 'cn' ? '复制' : 'Copier'}
                copiedLabel={locale === 'en' ? 'Copied' : locale === 'cn' ? '已复制' : 'Copié'}
              />
              <SecretValueField
                label={locale === 'en' ? 'Webhook secret' : locale === 'cn' ? 'Webhook 密钥' : 'Secret webhook'}
                value={newKey.webhook_secret}
                showLabel={locale === 'en' ? 'Show' : locale === 'cn' ? '显示' : 'Afficher'}
                hideLabel={locale === 'en' ? 'Hide' : locale === 'cn' ? '隐藏' : 'Masquer'}
                copyLabel={locale === 'en' ? 'Copy' : locale === 'cn' ? '复制' : 'Copier'}
                copiedLabel={locale === 'en' ? 'Copied' : locale === 'cn' ? '已复制' : 'Copié'}
              />
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setNewKey(null)}>{t.copied}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!revokeId} onOpenChange={(open) => { if (!open) setRevokeId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.revokeTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.revokeDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => revokeId && void handleRevoke(revokeId)}
            >
              {t.revokeConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
