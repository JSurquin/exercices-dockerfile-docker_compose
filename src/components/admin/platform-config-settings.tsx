'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  BellAlertIcon,
  UserGroupIcon,
  SparklesIcon,
  LinkIcon,
  ArrowPathIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { queryKeys } from '@/lib/query-keys';
import type { PlatformConfig } from '@/lib/platform-config-service';
import { PLATFORM_CONFIG_KEYS } from '@/lib/platform-config-service';

interface PlatformConfigResponse {
  config: PlatformConfig;
  defaults: PlatformConfig;
  sources: Record<string, 'db' | 'env'>;
}

async function fetchPlatformConfig(): Promise<PlatformConfigResponse> {
  const res = await fetch('/api/admin/platform-config');
  if (!res.ok) throw new Error('Erreur chargement config plateforme');
  return res.json();
}

async function patchConfig(payload: { key: string; value: unknown } | { key: string; reset: true }) {
  const res = await fetch('/api/admin/platform-config', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'Erreur sauvegarde');
  }
  return res.json();
}

function SourceBadge({ source }: { source: 'db' | 'env' }) {
  return source === 'db' ? (
    <Badge variant="outline" className="bg-green-500/10 border-green-500/50 text-green-400 text-xs">
      DB
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-yellow-500/10 border-yellow-500/50 text-yellow-400 text-xs">
      env
    </Badge>
  );
}

interface NumberFieldProps {
  label: string;
  description: string;
  dbKey: string;
  value: number;
  defaultValue: number;
  source: 'db' | 'env';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onSave: (key: string, value: number) => void;
  onReset: (key: string) => void;
  isPending: boolean;
}

function NumberField({
  label, description, dbKey, value, defaultValue, source,
  min = 0, max, step = 1, unit,
  onSave, onReset, isPending,
}: NumberFieldProps) {
  const [draft, setDraft] = useState<string>(String(value));
  const isDirty = parseFloat(draft) !== value;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Label className="text-slate-200">{label}</Label>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
        <SourceBadge source={source} />
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="number"
            min={min}
            max={max}
            step={step}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className="bg-slate-900/50 border-slate-600 text-white pr-10"
          />
          {unit && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
              {unit}
            </span>
          )}
        </div>
        <Button
          size="sm"
          disabled={!isDirty || isPending || isNaN(parseFloat(draft))}
          onClick={() => onSave(dbKey, parseFloat(draft))}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shrink-0"
        >
          Sauvegarder
        </Button>
        {source === 'db' && (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => { onReset(dbKey); setDraft(String(defaultValue)); }}
            className="border-slate-600 text-slate-400 hover:text-white shrink-0"
            title={`Réinitialiser (défaut : ${defaultValue}${unit ?? ''})`}
          >
            <ArrowPathIcon className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface UrlFieldProps {
  label: string;
  description: string;
  dbKey: string;
  value: string;
  defaultValue: string;
  source: 'db' | 'env';
  onSave: (key: string, value: string) => void;
  onReset: (key: string) => void;
  isPending: boolean;
}

function UrlField({
  label, description, dbKey, value, defaultValue, source,
  onSave, onReset, isPending,
}: UrlFieldProps) {
  const [draft, setDraft] = useState(value);
  const isDirty = draft !== value;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Label className="text-slate-200">{label}</Label>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
        <SourceBadge source={source} />
      </div>
      <div className="flex gap-2">
        <Input
          type="url"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          className="bg-slate-900/50 border-slate-600 text-white flex-1"
          placeholder="https://..."
        />
        <Button
          size="sm"
          disabled={!isDirty || isPending || !draft}
          onClick={() => onSave(dbKey, draft)}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shrink-0"
        >
          Sauvegarder
        </Button>
        {source === 'db' && (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => { onReset(dbKey); setDraft(defaultValue); }}
            className="border-slate-600 text-slate-400 hover:text-white shrink-0"
            title={`Réinitialiser (défaut : ${defaultValue})`}
          >
            <ArrowPathIcon className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function PlatformConfigSettings() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.adminPlatformConfig,
    queryFn: fetchPlatformConfig,
  });

  const mutation = useMutation({
    mutationFn: patchConfig,
    onSuccess: () => {
      toast.success('Configuration mise à jour');
      queryClient.invalidateQueries({ queryKey: queryKeys.adminPlatformConfig });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSave = (key: string, value: unknown) => mutation.mutate({ key, value });
  const handleReset = (key: string) => mutation.mutate({ key, reset: true } as { key: string; reset: true });

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full bg-slate-800" />)}
      </div>
    );
  }

  const { config, defaults, sources } = data;
  const s = (key: string) => sources[key] ?? 'env';

  return (
    <div className="space-y-6">
      <Alert className="border-blue-500/50 bg-blue-500/10">
        <InformationCircleIcon className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-200 text-sm">
          Les valeurs marquées <span className="font-semibold text-green-400">DB</span> écrasent les variables d&apos;environnement.
          Les valeurs <span className="font-semibold text-yellow-400">env</span> viennent du <code>.env</code> ou de la constante par défaut.
          Cliquer sur <ArrowPathIcon className="w-3 h-3 inline" /> remet la valeur par défaut.
        </AlertDescription>
      </Alert>

      {/* Alertes système */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <BellAlertIcon className="w-5 h-5 text-red-400" />
            Seuils d&apos;alerte système
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <NumberField
            label="Paiements échoués"
            description="Nombre de payouts échoués déclenchant une alerte rouge"
            dbKey={PLATFORM_CONFIG_KEYS.ALERT_FAILED_PAYOUTS}
            value={config.alertFailedPayouts}
            defaultValue={defaults.alertFailedPayouts}
            source={s(PLATFORM_CONFIG_KEYS.ALERT_FAILED_PAYOUTS)}
            min={1}
            unit=" payouts"
            onSave={handleSave}
            onReset={handleReset}
            isPending={mutation.isPending}
          />
          <Separator className="bg-slate-700" />
          <NumberField
            label="KYC en attente"
            description="Nombre de dossiers KYC en attente déclenchant une alerte orange"
            dbKey={PLATFORM_CONFIG_KEYS.ALERT_PENDING_KYC}
            value={config.alertPendingKyc}
            defaultValue={defaults.alertPendingKyc}
            source={s(PLATFORM_CONFIG_KEYS.ALERT_PENDING_KYC)}
            min={1}
            unit=" dossiers"
            onSave={handleSave}
            onReset={handleReset}
            isPending={mutation.isPending}
          />
          <Separator className="bg-slate-700" />
          <NumberField
            label="Trades en cours"
            description="Nombre de trades en cours déclenchant une alerte bleue"
            dbKey={PLATFORM_CONFIG_KEYS.ALERT_PENDING_TRADES}
            value={config.alertPendingTrades}
            defaultValue={defaults.alertPendingTrades}
            source={s(PLATFORM_CONFIG_KEYS.ALERT_PENDING_TRADES)}
            min={1}
            unit=" trades"
            onSave={handleSave}
            onReset={handleReset}
            isPending={mutation.isPending}
          />
        </CardContent>
      </Card>

      {/* Affiliés */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <UserGroupIcon className="w-5 h-5 text-cyan-400" />
            Affiliés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NumberField
            label="Commission par défaut"
            description="Taux de commission appliqué lors de la création d'un nouvel affilié"
            dbKey={PLATFORM_CONFIG_KEYS.AFFILIATE_COMMISSION_RATE}
            value={config.affiliateCommissionRate}
            defaultValue={defaults.affiliateCommissionRate}
            source={s(PLATFORM_CONFIG_KEYS.AFFILIATE_COMMISSION_RATE)}
            min={0}
            max={100}
            step={0.5}
            unit="%"
            onSave={handleSave}
            onReset={handleReset}
            isPending={mutation.isPending}
          />
        </CardContent>
      </Card>

      {/* Gamification */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <SparklesIcon className="w-5 h-5 text-purple-400" />
            Gamification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NumberField
            label="Taux de marge par défaut"
            description="Taux utilisé dans le dashboard économie gamification (ex : 0.05 = 5 %)"
            dbKey={PLATFORM_CONFIG_KEYS.GAMIFICATION_MARGIN_RATE}
            value={config.gamificationMarginRate}
            defaultValue={defaults.gamificationMarginRate}
            source={s(PLATFORM_CONFIG_KEYS.GAMIFICATION_MARGIN_RATE)}
            min={0}
            max={1}
            step={0.01}
            onSave={handleSave}
            onReset={handleReset}
            isPending={mutation.isPending}
          />
        </CardContent>
      </Card>

      {/* URLs externes */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <LinkIcon className="w-5 h-5 text-orange-400" />
            URLs externes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <UrlField
            label="Dashboard Skinplace"
            description="URL du dashboard Skinplace affiché dans le lien externe de la section métriques"
            dbKey={PLATFORM_CONFIG_KEYS.SKINPLACE_DASHBOARD_URL}
            value={config.skinplaceDashboardUrl}
            defaultValue={defaults.skinplaceDashboardUrl}
            source={s(PLATFORM_CONFIG_KEYS.SKINPLACE_DASHBOARD_URL)}
            onSave={handleSave}
            onReset={handleReset}
            isPending={mutation.isPending}
          />
          <Separator className="bg-slate-700" />
          <UrlField
            label="Base URL Steam CDN"
            description="URL de base pour les images Steam (préfixe des icon_url Skinplace)"
            dbKey={PLATFORM_CONFIG_KEYS.STEAM_CDN_URL}
            value={config.steamCdnUrl}
            defaultValue={defaults.steamCdnUrl}
            source={s(PLATFORM_CONFIG_KEYS.STEAM_CDN_URL)}
            onSave={handleSave}
            onReset={handleReset}
            isPending={mutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
