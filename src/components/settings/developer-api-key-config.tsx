'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Key,
  RefreshCw,
  BookOpen,
  Mail,
  Copy,
  Check,
  Shield,
  Webhook,
  Rocket,
} from 'lucide-react';
import { useLocale } from '@/components/providers/locale-provider';
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
import { toast } from 'sonner';
import { PARTNER_API_BASE_URL, PARTNER_API_SUPPORT_EMAIL, partnerEndpointCatalog } from '@/lib/partner-api/docs-content';
import {
  partnerEndpointLabel,
  partnerEventLabel,
  partnerScopeHelp,
  partnerScopeLabel,
} from '@/lib/partner-api/admin-labels';
import type { Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const BASE_PATH = `${PARTNER_API_BASE_URL}/api/v1/partner`;
const WEBHOOK_EVENTS = [
  'trade.created',
  'trade.status_changed',
  'payout.created',
  'payout.status_changed',
] as const;

interface ApiClientInfo {
  id: string;
  name: string;
  status: string;
  key_prefix: string;
  scopes: string[];
  rate_limit_per_min: number;
  webhook_url: string | null;
  last_used_at: string | null;
  created_at: string;
}

interface RevealedCredentials {
  api_key: string;
  webhook_secret: string;
}

function formatWhen(iso: string, locale: Locale) {
  const loc = locale === 'cn' ? 'zh-CN' : locale === 'en' ? 'en-GB' : 'fr-FR';
  return new Date(iso).toLocaleString(loc, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function authSnippet(prefix: string) {
  return `curl ${BASE_PATH}/me \\\n  -H "Authorization: Bearer ${prefix}…"`;
}

export default function DeveloperApiKeyConfig() {
  const { locale, messages } = useLocale();
  const t = messages.settings.developer;

  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState(false);
  const [client, setClient] = useState<ApiClientInfo | null>(null);
  const [generating, setGenerating] = useState(false);
  const [revealed, setRevealed] = useState<RevealedCredentials | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/developer/api-key');
      if (!res.ok) return;
      const data = await res.json();
      setEligible(Boolean(data.eligible));
      setClient(data.client ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const snippet = useMemo(
    () => authSnippet(client?.key_prefix || 'msk_live_VOTRE_CLE'),
    [client?.key_prefix]
  );

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/user/developer/api-key', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t.errorGeneric);
        return;
      }
      setClient(data.client ?? null);
      if (data.api_key && data.webhook_secret) {
        setRevealed({ api_key: data.api_key, webhook_secret: data.webhook_secret });
      }
      toast.success(client ? t.regenerateSuccess : t.createSuccess);
    } finally {
      setGenerating(false);
      setConfirmOpen(false);
    }
  };

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(
        `curl ${BASE_PATH}/me \\\n  -H "Authorization: Bearer YOUR_API_KEY"`
      );
      setCopied(true);
      toast.success(t.copied);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error(t.errorGeneric);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t.loading}</p>;
  }

  const capabilities = [
    { scope: 'read', text: t.capabilityRead },
    { scope: 'trade', text: t.capabilityTrade },
    { scope: 'payout', text: t.capabilityPayout },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-theme-accent" />
            {t.title}
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">{t.whatYouCanDo}</p>
            <ul className="space-y-2">
              {capabilities.map((item) => (
                <li key={item.scope} className="flex gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
                  <Badge variant="outline" className="mt-0.5 shrink-0">
                    {partnerScopeLabel(item.scope, locale)}
                  </Badge>
                  <span className="text-sm text-muted-foreground leading-relaxed">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          {!eligible && (
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <a href={`mailto:${PARTNER_API_SUPPORT_EMAIL}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  {t.contactSupport}
                </a>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/api-docs">
                  <BookOpen className="mr-2 h-4 w-4" />
                  {t.viewDocs}
                </Link>
              </Button>
            </div>
          )}
          {!eligible && (
            <p className="text-sm text-muted-foreground">{t.notEligibleDesc}</p>
          )}
        </CardContent>
      </Card>

      {eligible && (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">{t.keyStatus}</CardTitle>
                  <CardDescription>{client ? t.credentialsStayVisible : t.noKeyYet}</CardDescription>
                </div>
                {client && (
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" variant="outline">
                    {t.statusActive}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {client ? (
                <>
                  <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                      <dt className="text-muted-foreground">{t.prefixLabel}</dt>
                      <dd className="mt-1 font-mono">{client.key_prefix}…</dd>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                      <dt className="text-muted-foreground">{t.rateLimitLabel}</dt>
                      <dd className="mt-1 tabular-nums">
                        {client.rate_limit_per_min} {t.reqPerMin}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                      <dt className="text-muted-foreground">{t.createdLabel}</dt>
                      <dd className="mt-1">{formatWhen(client.created_at, locale)}</dd>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                      <dt className="text-muted-foreground">{t.lastUsedLabel}</dt>
                      <dd className="mt-1">
                        {client.last_used_at ? formatWhen(client.last_used_at, locale) : t.neverUsed}
                      </dd>
                    </div>
                  </dl>

                  <div>
                    <p className="mb-2 text-sm font-medium">{t.scopesLabel}</p>
                    <div className="space-y-2">
                      {(client.scopes.length ? client.scopes : ['read', 'trade', 'payout']).map((scope) => (
                        <div
                          key={scope}
                          className={cn(
                            'rounded-lg border p-3',
                            client.scopes.includes(scope)
                              ? 'border-theme-accent/30 bg-theme-accent/8'
                              : 'border-border/50 bg-muted/20 opacity-60'
                          )}
                        >
                          <p className="text-sm font-medium">{partnerScopeLabel(scope, locale)}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                            {partnerScopeHelp(scope, locale)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <p className="mb-2 text-sm font-medium">{t.gettingStarted}</p>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">1.</span>
                    {t.step1}
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">2.</span>
                    {t.step2}
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">3.</span>
                    {t.step3}
                  </li>
                </ol>
                </div>
              )}

              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {t.securityHint}
              </p>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => {
                    if (client) setConfirmOpen(true);
                    else void handleGenerate();
                  }}
                  disabled={generating}
                >
                  {generating ? (
                    t.generating
                  ) : client ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {t.regenerateButton}
                    </>
                  ) : (
                    <>
                      <Rocket className="mr-2 h-4 w-4" />
                      {t.createButton}
                    </>
                  )}
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/api-docs">
                    <BookOpen className="mr-2 h-4 w-4" />
                    {t.viewDocs}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.authTitle}</CardTitle>
              <CardDescription>{t.authHint}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t.baseUrlLabel}</p>
                <code className="block break-all rounded-md border border-border/60 bg-muted/40 px-3 py-2 font-mono text-xs">
                  {BASE_PATH}
                </code>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t.authHeaderLabel}</p>
                <code className="block break-all rounded-md border border-border/60 bg-muted/40 px-3 py-2 font-mono text-xs">
                  Authorization: Bearer {client?.key_prefix ?? 'msk_live_'}…
                </code>
              </div>
              <pre className="overflow-x-auto rounded-md border border-border/60 bg-muted/40 p-3 font-mono text-xs leading-relaxed">
                {snippet}
              </pre>
              <Button type="button" variant="outline" size="sm" onClick={() => void copySnippet()}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? t.copied : t.copySnippet}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.endpointsTitle}</CardTitle>
              <CardDescription>{t.endpointsHint}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border/50 rounded-lg border border-border/60 overflow-hidden">
                {partnerEndpointCatalog.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5 text-sm bg-muted/20">
                    <Badge variant="secondary" className="font-mono text-[10px] tabular-nums">
                      {item.method}
                    </Badge>
                    <code className="font-mono text-xs">{item.path.replace('/api/v1/partner', '') || '/'}</code>
                    <span className="text-muted-foreground">
                      {partnerEndpointLabel(item.path, locale)}
                    </span>
                    <Badge variant="outline" className="ml-auto text-xs font-normal">
                      {item.scope.includes(' or ')
                        ? item.scope
                            .split(' or ')
                            .map((scope) => partnerScopeLabel(scope, locale))
                            .join(' / ')
                        : partnerScopeLabel(item.scope, locale)}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Webhook className="h-5 w-5 text-theme-accent" />
                {t.webhookTitle}
              </CardTitle>
              <CardDescription>{t.webhookHint}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {client?.webhook_url ? (
                <p className="text-sm">
                  <span className="text-muted-foreground">{t.webhookConfigured} · </span>
                  <span className="break-all font-mono text-xs">{client.webhook_url}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">{t.webhookNotSet}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {WEBHOOK_EVENTS.map((event) => (
                  <Badge key={event} variant="outline">
                    {partnerEventLabel(event, locale)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={!!revealed} onOpenChange={(open) => { if (!open) setRevealed(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.copyNowTitle}</DialogTitle>
            <DialogDescription>{t.copyNowDescription}</DialogDescription>
          </DialogHeader>
          {revealed && (
            <div className="space-y-4">
              <SecretValueField
                label={t.apiKeyLabel}
                value={revealed.api_key}
                showLabel={t.show}
                hideLabel={t.hide}
                copyLabel={t.copy}
                copiedLabel={t.copied}
              />
              <SecretValueField
                label={t.webhookSecretLabel}
                value={revealed.webhook_secret}
                showLabel={t.show}
                hideLabel={t.hide}
                copyLabel={t.copy}
                copiedLabel={t.copied}
              />
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setRevealed(null)}>{t.copiedConfirm}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.regenerateButton}</AlertDialogTitle>
            <AlertDialogDescription>{t.regenerateConfirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleGenerate()} disabled={generating}>
              {generating ? t.generating : t.confirmRegenerate}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
