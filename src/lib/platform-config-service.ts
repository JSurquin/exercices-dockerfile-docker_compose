/**
 * Service de configuration plateforme.
 *
 * Priorité de lecture : DB (SiteSettings) → variable d'environnement → constante par défaut.
 * Un cache mémoire TTL 5 min évite une requête Prisma sur chaque appel API.
 */

import { prisma } from '~/prisma/prisma';
import {
  ALERT_THRESHOLD_FAILED_PAYOUTS,
  ALERT_THRESHOLD_PENDING_KYC,
  ALERT_THRESHOLD_PENDING_TRADES,
  AFFILIATE_DEFAULT_COMMISSION_RATE_PERCENT,
  GAMIFICATION_DEFAULT_MARGIN_RATE,
  SKINPLACE_DASHBOARD_URL,
  STEAM_CDN_IMAGE_BASE,
} from '@/lib/admin-constants';

// ─── Clés DB ────────────────────────────────────────────────────────────────
export const PLATFORM_CONFIG_KEYS = {
  ALERT_FAILED_PAYOUTS:     'platform.alert_failed_payouts',
  ALERT_PENDING_KYC:        'platform.alert_pending_kyc',
  ALERT_PENDING_TRADES:     'platform.alert_pending_trades',
  AFFILIATE_COMMISSION_RATE:'platform.affiliate_commission_rate',
  GAMIFICATION_MARGIN_RATE: 'platform.gamification_margin_rate',
  SKINPLACE_DASHBOARD_URL:  'platform.skinplace_dashboard_url',
  STEAM_CDN_URL:            'platform.steam_cdn_url',
} as const;

export type PlatformConfigKey = typeof PLATFORM_CONFIG_KEYS[keyof typeof PLATFORM_CONFIG_KEYS];

export interface PlatformConfig {
  alertFailedPayouts:     number;
  alertPendingKyc:        number;
  alertPendingTrades:     number;
  affiliateCommissionRate:number; // en %
  gamificationMarginRate: number; // décimal 0-1
  skinplaceDashboardUrl:  string;
  steamCdnUrl:            string;
}

// ─── Defaults (fallback ultime) ──────────────────────────────────────────────
const DEFAULTS: PlatformConfig = {
  alertFailedPayouts:     ALERT_THRESHOLD_FAILED_PAYOUTS,
  alertPendingKyc:        ALERT_THRESHOLD_PENDING_KYC,
  alertPendingTrades:     ALERT_THRESHOLD_PENDING_TRADES,
  affiliateCommissionRate:AFFILIATE_DEFAULT_COMMISSION_RATE_PERCENT,
  gamificationMarginRate: GAMIFICATION_DEFAULT_MARGIN_RATE,
  skinplaceDashboardUrl:  SKINPLACE_DASHBOARD_URL,
  steamCdnUrl:            STEAM_CDN_IMAGE_BASE,
};

// ─── Cache mémoire ───────────────────────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  config: PlatformConfig;
  expiresAt: number;
}

let cache: CacheEntry | null = null;

export function invalidatePlatformConfigCache() {
  cache = null;
}

// ─── Lecture ─────────────────────────────────────────────────────────────────
export async function getPlatformConfig(): Promise<PlatformConfig> {
  if (cache && Date.now() < cache.expiresAt) {
    return cache.config;
  }

  const rows = await prisma.siteSettings.findMany({
    where: {
      key: { in: Object.values(PLATFORM_CONFIG_KEYS) },
    },
  });

  const byKey = Object.fromEntries(rows.map(r => [r.key, r.valueJson]));

  const get = <T>(key: PlatformConfigKey, fallback: T): T => {
    const raw = byKey[key];
    if (raw === undefined || raw === null) return fallback;
    return raw as T;
  };

  const config: PlatformConfig = {
    alertFailedPayouts:     get(PLATFORM_CONFIG_KEYS.ALERT_FAILED_PAYOUTS,     DEFAULTS.alertFailedPayouts),
    alertPendingKyc:        get(PLATFORM_CONFIG_KEYS.ALERT_PENDING_KYC,        DEFAULTS.alertPendingKyc),
    alertPendingTrades:     get(PLATFORM_CONFIG_KEYS.ALERT_PENDING_TRADES,     DEFAULTS.alertPendingTrades),
    affiliateCommissionRate:get(PLATFORM_CONFIG_KEYS.AFFILIATE_COMMISSION_RATE,DEFAULTS.affiliateCommissionRate),
    gamificationMarginRate: get(PLATFORM_CONFIG_KEYS.GAMIFICATION_MARGIN_RATE, DEFAULTS.gamificationMarginRate),
    skinplaceDashboardUrl:  get(PLATFORM_CONFIG_KEYS.SKINPLACE_DASHBOARD_URL,  DEFAULTS.skinplaceDashboardUrl) as string,
    steamCdnUrl:            get(PLATFORM_CONFIG_KEYS.STEAM_CDN_URL,            DEFAULTS.steamCdnUrl) as string,
  };

  cache = { config, expiresAt: Date.now() + CACHE_TTL_MS };
  return config;
}

// ─── Écriture ─────────────────────────────────────────────────────────────────
export async function setPlatformConfigValue(
  key: PlatformConfigKey,
  value: string | number,
  updatedBy: string,
  description?: string,
): Promise<void> {
  const jsonValue = value as Parameters<typeof prisma.siteSettings.upsert>[0]['create']['valueJson'];
  await prisma.siteSettings.upsert({
    where: { key },
    create: { key, valueJson: jsonValue, description: description ?? null, updatedBy },
    update: { valueJson: jsonValue, updatedBy },
  });
  invalidatePlatformConfigCache();
}

// ─── Réinitialisation (supprime la ligne DB → repasse sur env/constante) ──────
export async function resetPlatformConfigValue(key: PlatformConfigKey): Promise<void> {
  await prisma.siteSettings.deleteMany({ where: { key } });
  invalidatePlatformConfigCache();
}

export { DEFAULTS as PLATFORM_CONFIG_DEFAULTS };
