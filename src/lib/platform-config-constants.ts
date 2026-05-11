/**
 * Constantes partagées pour la configuration plateforme.
 * Ce fichier ne doit jamais importer Prisma ni de code serveur.
 */

export const PLATFORM_CONFIG_KEYS = {
  ALERT_FAILED_PAYOUTS:     'platform.alert_failed_payouts',
  ALERT_PENDING_KYC:        'platform.alert_pending_kyc',
  ALERT_PENDING_TRADES:     'platform.alert_pending_trades',
  AFFILIATE_COMMISSION_RATE:'platform.affiliate_commission_rate',
  GAMIFICATION_MARGIN_RATE: 'platform.gamification_margin_rate',
  SKINPLACE_DASHBOARD_URL:  'platform.skinplace_dashboard_url',
  STEAM_CDN_URL:            'platform.steam_cdn_url',
  API_DOCS_ENABLED:         'platform.api_docs_enabled',
  DEFAULT_WITHDRAWAL_LIMIT: 'platform.default_withdrawal_limit',
  XP_ENABLED:               'platform.xp_enabled',
  FRAGMENTS_ENABLED:        'platform.fragments_enabled',
} as const;

export type PlatformConfigKey = typeof PLATFORM_CONFIG_KEYS[keyof typeof PLATFORM_CONFIG_KEYS];

export interface PlatformConfig {
  alertFailedPayouts:     number;
  alertPendingKyc:        number;
  alertPendingTrades:     number;
  affiliateCommissionRate:number;
  gamificationMarginRate: number;
  skinplaceDashboardUrl:  string;
  steamCdnUrl:            string;
  apiDocsEnabled:         boolean;
  defaultWithdrawalLimit: number;
  xpEnabled:              boolean;
  fragmentsEnabled:       boolean;
}
