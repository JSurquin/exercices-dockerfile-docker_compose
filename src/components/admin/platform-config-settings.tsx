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
import { Switch } from '@/components/ui/switch';
import {
  BellAlertIcon,
  UserGroupIcon,
  SparklesIcon,
  LinkIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';
import { queryKeys } from '@/lib/query-keys';
import type { PlatformConfig } from '@/lib/platform-config-constants';
import { PLATFORM_CONFIG_KEYS } from '@/lib/platform-config-constants';
import { useLocale } from '@/components/providers/locale-provider';

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

async function patchConfig(payload: { key: string; value: unknown } | { key: string; reset: true; value?: never }) {
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
  saveLabel: string;
  resetTitle: string;
}

function NumberField({
  label, description, dbKey, value, defaultValue, source,
  min = 0, max, step = 1, unit,
  onSave, onReset, isPending, saveLabel, resetTitle,
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
          {saveLabel}
        </Button>
        {source === 'db' && (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => { onReset(dbKey); setDraft(String(defaultValue)); }}
            className="border-slate-600 text-slate-400 hover:text-white shrink-0"
            title={resetTitle.replace('{value}', `${defaultValue}${unit ?? ''}`)}
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
  saveLabel: string;
  resetTitle: string;
}

function UrlField({
  label, description, dbKey, value, defaultValue, source,
  onSave, onReset, isPending, saveLabel, resetTitle,
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
          {saveLabel}
        </Button>
        {source === 'db' && (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => { onReset(dbKey); setDraft(defaultValue); }}
            className="border-slate-600 text-slate-400 hover:text-white shrink-0"
            title={resetTitle.replace('{value}', defaultValue)}
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
  const { messages } = useLocale();
  const t = messages.admin.platformConfig;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.adminPlatformConfig,
    queryFn: fetchPlatformConfig,
  });

  const mutation = useMutation({
    mutationFn: patchConfig,
    onSuccess: () => {
      toast.success(t.configUpdated);
      queryClient.invalidateQueries({ queryKey: queryKeys.adminPlatformConfig });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSave = (key: string, value: unknown) => mutation.mutate({ key, value } as { key: string; value: unknown });
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
          {t.infoText}
        </AlertDescription>
      </Alert>

      {/* System Alerts */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <BellAlertIcon className="w-5 h-5 text-red-400" />
            {t.alertsTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <NumberField
            label={t.failedPayoutsLabel}
            description={t.failedPayoutsDesc}
            dbKey={PLATFORM_CONFIG_KEYS.ALERT_FAILED_PAYOUTS}
            value={config.alertFailedPayouts}
            defaultValue={defaults.alertFailedPayouts}
            source={s(PLATFORM_CONFIG_KEYS.ALERT_FAILED_PAYOUTS)}
            min={1}
            unit={t.failedPayoutsUnit}
            onSave={handleSave}
            onReset={handleReset}
            isPending={mutation.isPending}
            saveLabel={t.save}
            resetTitle={t.resetTitle}
          />
          <Separator className="bg-slate-700" />
          <NumberField
            label={t.pendingKycLabel}
            description={t.pendingKycDesc}
            dbKey={PLATFORM_CONFIG_KEYS.ALERT_PENDING_KYC}
            value={config.alertPendingKyc}
            defaultValue={defaults.alertPendingKyc}
            source={s(PLATFORM_CONFIG_KEYS.ALERT_PENDING_KYC)}
            min={1}
            unit={t.pendingKycUnit}
            onSave={handleSave}
            onReset={handleReset}
            isPending={mutation.isPending}
            saveLabel={t.save}
            resetTitle={t.resetTitle}
          />
          <Separator className="bg-slate-700" />
          <NumberField
            label={t.pendingTradesLabel}
            description={t.pendingTradesDesc}
            dbKey={PLATFORM_CONFIG_KEYS.ALERT_PENDING_TRADES}
            value={config.alertPendingTrades}
            defaultValue={defaults.alertPendingTrades}
            source={s(PLATFORM_CONFIG_KEYS.ALERT_PENDING_TRADES)}
            min={1}
            unit={t.pendingTradesUnit}
            onSave={handleSave}
            onReset={handleReset}
            isPending={mutation.isPending}
            saveLabel={t.save}
            resetTitle={t.resetTitle}
          />
        </CardContent>
      </Card>

      {/* Affiliates */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <UserGroupIcon className="w-5 h-5 text-cyan-400" />
            {t.affiliatesTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NumberField
            label={t.defaultCommissionLabel}
            description={t.defaultCommissionDesc}
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
            saveLabel={t.save}
            resetTitle={t.resetTitle}
          />
        </CardContent>
      </Card>

      {/* Gamification */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <SparklesIcon className="w-5 h-5 text-purple-400" />
            {t.gamificationTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NumberField
            label={t.marginRateLabel}
            description={t.marginRateDesc}
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
            saveLabel={t.save}
            resetTitle={t.resetTitle}
          />
        </CardContent>
      </Card>

      {/* External URLs */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <LinkIcon className="w-5 h-5 text-orange-400" />
            {t.externalUrlsTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <UrlField
            label={t.skinplaceDashboardLabel}
            description={t.skinplaceDashboardDesc}
            dbKey={PLATFORM_CONFIG_KEYS.SKINPLACE_DASHBOARD_URL}
            value={config.skinplaceDashboardUrl}
            defaultValue={defaults.skinplaceDashboardUrl}
            source={s(PLATFORM_CONFIG_KEYS.SKINPLACE_DASHBOARD_URL)}
            onSave={handleSave}
            onReset={handleReset}
            isPending={mutation.isPending}
            saveLabel={t.save}
            resetTitle={t.resetTitle}
          />
          <Separator className="bg-slate-700" />
          <UrlField
            label={t.steamCdnLabel}
            description={t.steamCdnDesc}
            dbKey={PLATFORM_CONFIG_KEYS.STEAM_CDN_URL}
            value={config.steamCdnUrl}
            defaultValue={defaults.steamCdnUrl}
            source={s(PLATFORM_CONFIG_KEYS.STEAM_CDN_URL)}
            onSave={handleSave}
            onReset={handleReset}
            isPending={mutation.isPending}
            saveLabel={t.save}
            resetTitle={t.resetTitle}
          />
        </CardContent>
      </Card>

      {/* Page Visibility */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <CodeBracketIcon className="w-5 h-5 text-blue-400" />
            {t.pageVisibilityTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Label className="text-slate-200">{t.apiDocsLabel}</Label>
                <SourceBadge source={s(PLATFORM_CONFIG_KEYS.API_DOCS_ENABLED)} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.apiDocsDesc}
              </p>
            </div>
            <Switch
              checked={config.apiDocsEnabled}
              onCheckedChange={(checked) => handleSave(PLATFORM_CONFIG_KEYS.API_DOCS_ENABLED, checked)}
              disabled={mutation.isPending}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
