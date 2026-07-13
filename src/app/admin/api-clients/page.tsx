'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Key, Trash2, Webhook, Plus } from 'lucide-react';

interface ApiClientRow {
  id: string;
  name: string;
  user_id: string;
  status: string;
  scopes: string[];
  rate_limit_per_min: number;
  webhook_url: string | null;
  key_prefix: string;
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

export default function AdminApiClientsPage() {
  const [clients, setClients] = useState<ApiClientRow[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<{ api_key: string; webhook_secret: string } | null>(null);
  const [form, setForm] = useState({ name: '', user_id: '', rate_limit: '100' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [clientsRes, deliveriesRes] = await Promise.all([
        fetch('/api/admin/api-clients'),
        fetch('/api/admin/api-clients/deliveries?limit=30'),
      ]);
      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data.clients ?? []);
      }
      if (deliveriesRes.ok) {
        const data = await deliveriesRes.json();
        setDeliveries(data.deliveries ?? []);
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
              <Label>ID utilisateur lié</Label>
              <Input
                value={form.user_id}
                onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}
                placeholder="cuid utilisateur MoonSkin"
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
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? 'Création…' : 'Générer la clé'}
          </Button>
          {newKey && (
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-sm space-y-2">
              <p className="font-semibold text-amber-700 dark:text-amber-300">
                Copiez ces valeurs maintenant — elles ne seront plus affichées.
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
                      {c.user.steam_username || c.user.email} — préfixe {c.key_prefix}…
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={c.status === 'ACTIVE' ? 'default' : 'secondary'}>{c.status}</Badge>
                      <Badge variant="outline">{c.rate_limit_per_min}/min</Badge>
                      <Badge variant="outline">{c.stats.api_calls} appels</Badge>
                    </div>
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
            <Webhook className="h-5 w-5" />
            Dernières livraisons webhook
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deliveries.length === 0 ? (
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
