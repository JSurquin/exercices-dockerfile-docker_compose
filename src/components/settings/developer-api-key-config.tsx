'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KeyIcon, ArrowPathIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useLocale } from '@/components/providers/locale-provider';
import { SecretValueField } from '@/components/ui/secret-value-field';
import { toast } from 'sonner';

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
  api_key: string | null;
  webhook_secret: string | null;
}

export default function DeveloperApiKeyConfig() {
  const { messages } = useLocale();
  const t = messages.settings.developer;

  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState(false);
  const [client, setClient] = useState<ApiClientInfo | null>(null);
  const [generating, setGenerating] = useState(false);

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

  const handleGenerate = async () => {
    const confirmMessage = client ? t.regenerateConfirm : t.createConfirm;
    if (!window.confirm(confirmMessage)) return;

    setGenerating(true);
    try {
      const res = await fetch('/api/user/developer/api-key', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t.errorGeneric);
        return;
      }
      setClient(data.client ?? null);
      toast.success(client ? t.regenerateSuccess : t.createSuccess);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t.loading}</p>;
  }

  if (!eligible) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyIcon className="w-5 h-5" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.notEligibleDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/api-docs">{t.viewDocs}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyIcon className="w-5 h-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {client ? (
          <div className="rounded-lg border bg-muted/40 p-4 space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={client.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {client.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{t.credentialsStayVisible}</p>
            <SecretValueField
              label={t.apiKeyLabel}
              value={client.api_key}
              emptyHint={`${client.key_prefix}… — ${t.apiKeyUnavailable}`}
              showLabel={t.show}
              hideLabel={t.hide}
              copyLabel={t.copy}
              copiedLabel={t.copied}
            />
            <SecretValueField
              label={t.webhookSecretLabel}
              value={client.webhook_secret}
              emptyHint={t.webhookSecretUnavailable}
              showLabel={t.show}
              hideLabel={t.hide}
              copyLabel={t.copy}
              copiedLabel={t.copied}
            />
            <p>
              <span className="text-muted-foreground">{t.scopesLabel}: </span>
              {client.scopes.join(', ')}
            </p>
            <p>
              <span className="text-muted-foreground">{t.rateLimitLabel}: </span>
              {client.rate_limit_per_min} req/min
            </p>
            {client.last_used_at && (
              <p>
                <span className="text-muted-foreground">{t.lastUsedLabel}: </span>
                {new Date(client.last_used_at).toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t.noKeyYet}</p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              t.generating
            ) : client ? (
              <>
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                {t.regenerateButton}
              </>
            ) : (
              <>
                <KeyIcon className="w-4 h-4 mr-2" />
                {t.createButton}
              </>
            )}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/api-docs">
              <DocumentTextIcon className="w-4 h-4 mr-2" />
              {t.viewDocs}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
