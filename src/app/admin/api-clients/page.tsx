'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Key, Trash2, Webhook, Plus, Activity, Save } from 'lucide-react';
import { AdminUserCombobox } from '@/components/admin/admin-user-combobox';
import { SecretValueField } from '@/components/ui/secret-value-field';

interface ApiClientRow {
  id: string;
  name: string;
  user_id: string;
  status: string;
  scopes: string[];
  rate_limit_per_min: number;
  webhook_url: string | null;
  key_prefix: string;
  api_key: string | null;
  webhook_secret: string | null;
  user: { steam_username: string | null; steam_id: string | null; email: string };
  stats: { api_calls: number; webhook_deliveries: number };
}

interface WebhookDelivery {
  id: string;
  partner_name: string;
  event_type: string;
  resource_id: string;
  status: string;
  http_status: number | null;
  attempts: number;
  created_at: string;
}

interface ApiCallLog {
  id: string;
  api_client_id: string;
  partner_name: string;
  endpoint: string;
  method: string;
  status_code: number;
  ip_address: string | null;
  duration_ms: number | null;
  created_at: string;
}

export default function AdminApiClientsPage() {
  const [clients, setClients] = useState<ApiClientRow[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiCallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<{ api_key: string; webhook_secret: string } | null>(null);
  const [form, setForm] = useState({ name: '', user_id: '', rate_limit: '100' });
  const [rateLimitEdits, setRateLimitEdits] = useState<Record<string, string>>({});
  const [savingRateLimit, setSavingRateLimit] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [clientsRes, deliveriesRes, logsRes] = await Promise.all([
        fetch('/api/admin/api-clients'),
        fetch('/api/admin/api-clients/deliveries?limit=30'),
        fetch('/api/admin/api-clients/logs?limit=50'),
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
    if (!form.name.trim() || !form.user_id.trim()) return;
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
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewKey({ api_key: data.api_key, webhook_secret: data.webhook_secret });
        setForm({ name: '', user_id: '', rate_limit: '100' });
        await load();
      } else {
        alert(data.error || 'Erreur création');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Révoquer cette clé API ?')) return;
    await fetch(`/api/admin/api-clients/${id}`, { method: 'DELETE' });
    await load();
  };

  const handleSaveRateLimit = async (id: string) => {
    const value = rateLimitEdits[id];
    const parsed = parseInt(value, 10);
    if (!value || Number.isNaN(parsed) || parsed < 10 || parsed > 1000) {
      alert('Limite invalide (10–1000 req/min)');
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
        alert(data.error || 'Erreur mise à jour');
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

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Key className="h-6 w-6" />
          Clés API partenaires
        </h1>
        <p className="text-muted-foreground mt-1">
          Gestion des accès API privés (Bearer token) pour les comptes professionnels.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5" />
            Créer une clé
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Nom partenaire</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Acme Trading"
              />
            </div>
            <div>
              <Label>Utilisateur lié</Label>
              <AdminUserCombobox
                value={form.user_id}
                onChange={(userId) => setForm((f) => ({ ...f, user_id: userId }))}
                placeholder="Rechercher par pseudo Steam, email ou Steam ID…"
                disabled={creating}
              />
            </div>
            <div>
              <Label>Limite req/min</Label>
              <Input
                type="number"
                value={form.rate_limit}
                onChange={(e) => setForm((f) => ({ ...f, rate_limit: e.target.value }))}
              />
            </div>
          </div>
          <Button
            onClick={handleCreate}
            disabled={creating || !form.name.trim() || !form.user_id}
          >
            {creating ? 'Création…' : 'Générer la clé'}
          </Button>
          {newKey && (
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-sm space-y-2">
              <p className="font-semibold text-amber-700 dark:text-amber-300">
                Clé générée — elle reste visible ci-dessous et sur la fiche utilisateur.
              </p>
              <p>
                <span className="text-muted-foreground">Clé API :</span>{' '}
                <code className="break-all">{newKey.api_key}</code>
              </p>
              <p>
                <span className="text-muted-foreground">Secret webhook :</span>{' '}
                <code className="break-all">{newKey.webhook_secret}</code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clés actives ({clients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Chargement…</p>
          ) : clients.length === 0 ? (
            <p className="text-muted-foreground">Aucune clé API.</p>
          ) : (
            <div className="space-y-3">
              {clients.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.user.steam_username || c.user.email}
                    </p>
                    <div className="mt-3 space-y-3 max-w-xl">
                      <SecretValueField
                        label="Clé API"
                        value={c.api_key}
                        emptyHint={`${c.key_prefix}… — régénérer pour afficher la clé complète`}
                        showLabel="Afficher"
                        hideLabel="Masquer"
                        copyLabel="Copier"
                        copiedLabel="Copié"
                      />
                      <SecretValueField
                        label="Secret webhook"
                        value={c.webhook_secret}
                        emptyHint="Aucun secret webhook"
                        showLabel="Afficher"
                        hideLabel="Masquer"
                        copyLabel="Copier"
                        copiedLabel="Copié"
                      />
                    </div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <Badge variant={c.status === 'ACTIVE' ? 'default' : 'secondary'}>{c.status}</Badge>
                      {c.scopes.map((scope) => (
                        <Badge key={scope} variant="outline">{scope}</Badge>
                      ))}
                      <Badge variant="outline">{c.stats.api_calls} appels</Badge>
                    </div>
                    {c.status === 'ACTIVE' && (
                      <div className="flex items-center gap-2 mt-2">
                        <Label className="text-xs shrink-0">Req/min</Label>
                        <Input
                          type="number"
                          className="h-8 w-24"
                          value={rateLimitEdits[c.id] ?? String(c.rate_limit_per_min)}
                          onChange={(e) =>
                            setRateLimitEdits((prev) => ({ ...prev, [c.id]: e.target.value }))
                          }
                        />
                        {(rateLimitEdits[c.id] !== undefined &&
                          rateLimitEdits[c.id] !== String(c.rate_limit_per_min)) && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={savingRateLimit === c.id}
                            onClick={() => handleSaveRateLimit(c.id)}
                          >
                            <Save className="h-3 w-3 mr-1" />
                            {savingRateLimit === c.id ? '…' : 'OK'}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  {c.status === 'ACTIVE' && (
                    <Button variant="destructive" size="sm" onClick={() => handleRevoke(c.id)}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Révoquer
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Journal des appels API ({apiLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Chargement…</p>
          ) : apiLogs.length === 0 ? (
            <p className="text-muted-foreground">Aucun appel enregistré.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3">Partenaire</th>
                    <th className="py-2 pr-3">Méthode</th>
                    <th className="py-2 pr-3">Endpoint</th>
                    <th className="py-2 pr-3">HTTP</th>
                    <th className="py-2 pr-3">IP</th>
                    <th className="py-2 pr-3">Durée</th>
                    <th className="py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {apiLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border/50">
                      <td className="py-2 pr-3">{log.partner_name}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{log.method}</td>
                      <td className="py-2 pr-3 font-mono text-xs max-w-[200px] truncate">{log.endpoint}</td>
                      <td className="py-2 pr-3">
                        <Badge variant={log.status_code < 400 ? 'default' : 'destructive'}>
                          {log.status_code}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">{log.ip_address ?? '—'}</td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {log.duration_ms != null ? `${log.duration_ms} ms` : '—'}
                      </td>
                      <td className="py-2 text-muted-foreground whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Dernières livraisons webhook
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Chargement…</p>
          ) : deliveries.length === 0 ? (
            <p className="text-muted-foreground">Aucune livraison.</p>
          ) : (
            <div className="space-y-2 text-sm">
              {deliveries.map((d) => (
                <div key={d.id} className="flex flex-wrap gap-2 items-center border-b py-2">
                  <Badge variant={d.status === 'success' ? 'default' : d.status === 'failed' ? 'destructive' : 'secondary'}>
                    {d.status}
                  </Badge>
                  <span className="font-medium">{d.partner_name}</span>
                  <span className="text-muted-foreground">{d.event_type}</span>
                  <span>{d.resource_id}</span>
                  {d.http_status != null && <span>HTTP {d.http_status}</span>}
                  <span className="text-muted-foreground">{d.attempts} tent.</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
