// ─── Seuils d'alerte système ─────────────────────────────────────────────────
export const ALERT_THRESHOLD_FAILED_PAYOUTS = parseInt(
  process.env.ALERT_THRESHOLD_FAILED_PAYOUTS ?? '5',
  10
);
export const ALERT_THRESHOLD_PENDING_KYC = parseInt(
  process.env.ALERT_THRESHOLD_PENDING_KYC ?? '10',
  10
);
export const ALERT_THRESHOLD_PENDING_TRADES = parseInt(
  process.env.ALERT_THRESHOLD_PENDING_TRADES ?? '20',
  10
);

// ─── Pagination ───────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_SECURITY_ALERTS_PAGE_SIZE = 50;
export const DEFAULT_ANALYTICS_PERIOD_DAYS = 30;

// ─── Skinplace ────────────────────────────────────────────────────────────────
export const SKINPLACE_DASHBOARD_URL =
  process.env.NEXT_PUBLIC_SKINPLACE_DASHBOARD_URL ?? 'https://skin.place';
export const STEAM_CDN_IMAGE_BASE =
  process.env.NEXT_PUBLIC_STEAM_CDN_URL ??
  'https://community.cloudflare.steamstatic.com/economy/image/';
export const SKINPLACE_ITEMS_DEFAULT_LIMIT = 50;
export const SKINPLACE_ITEMS_MAX_LIMIT = 200;

// ─── Affiliés ─────────────────────────────────────────────────────────────────
/** Taux de commission par défaut en pourcentage (ex: 2 = 2 %) */
export const AFFILIATE_DEFAULT_COMMISSION_RATE_PERCENT = parseInt(
  process.env.AFFILIATE_DEFAULT_COMMISSION_RATE ?? '2',
  10
);
/** Taux de commission par défaut en décimal (0.02) */
export const AFFILIATE_DEFAULT_COMMISSION_RATE =
  AFFILIATE_DEFAULT_COMMISSION_RATE_PERCENT / 100;

// ─── Gamification ─────────────────────────────────────────────────────────────
/** Taux de marge par défaut pour le dashboard économie gamification */
export const GAMIFICATION_DEFAULT_MARGIN_RATE = parseFloat(
  process.env.GAMIFICATION_DEFAULT_MARGIN_RATE ?? '0.05'
);

// ─── Giveaway – valeurs par défaut du formulaire de création ──────────────────
export const GIVEAWAY_DEFAULT_TICKET_PRICE = 100;
export const GIVEAWAY_DEFAULT_MAX_TICKETS = 10_000;
export const GIVEAWAY_DEFAULT_DURATION_MINUTES = 60;
export const GIVEAWAY_DEFAULT_DURATION_TYPE = 'WEEKLY';
export const GIVEAWAY_DEFAULT_WINNER_COUNT = 1;

// ─── Paramètres admin par défaut ──────────────────────────────────────────────
export const ADMIN_DEFAULT_TIMEZONE = 'Europe/Paris';
export const ADMIN_DEFAULT_SESSION_TIMEOUT_MINUTES = 30;
export const ADMIN_DEFAULT_THEME = 'dark';
export const ADMIN_DEFAULT_LANGUAGE = 'fr';
export const ADMIN_DEFAULT_DASHBOARD_LAYOUT = 'grid';
export const ADMIN_MIN_PASSWORD_LENGTH = 8;

export const ADMIN_SUPPORTED_TIMEZONES = [
  'Europe/Paris',
  'Europe/London',
  'America/New_York',
  'Asia/Tokyo',
] as const;

export const ADMIN_SESSION_TIMEOUT_OPTIONS = [15, 30, 60, 120, 480] as const;

// ─── Polling / refetch intervals (ms) ────────────────────────────────────────
export const ADMIN_ANALYTICS_REFETCH_INTERVAL_MS = 30_000;
export const ADMIN_SKINPLACE_REFETCH_INTERVAL_MS = 60_000;
export const ADMIN_GAMIFICATION_REFETCH_INTERVAL_MS = 60_000;

// ─── Anti-deadlock Prisma (requêtes séquentielles) ────────────────────────────
/** Délai entre deux requêtes Prisma séquentielles pour éviter les deadlocks */
export const PRISMA_SEQUENTIAL_DELAY_MS = 25;
/** Délai plus long avant les requêtes coûteuses (top IPs, top users) */
export const PRISMA_HEAVY_QUERY_DELAY_MS = 100;
/** Délai avant les requêtes finales */
export const PRISMA_FINAL_QUERY_DELAY_MS = 50;
