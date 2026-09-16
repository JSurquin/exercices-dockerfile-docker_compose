import {
  CS2_RARITIES,
  extractCs2Exterior,
  extractCs2SkinName,
  extractCs2WeaponType,
  type CS2Exterior,
} from '@/lib/cs2-constants';

export type GiveawaySort = 'endingSoon' | 'highestValue' | 'lowestCost';
export type GiveawayTier = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'special';
export type GiveawayTierFilter = 'all' | GiveawayTier;

export interface GiveawayTierTokens {
  bg: string;
  fg: string;
  border: string;
}

/** Thème sombre : fond teinté + texte clair (contraste AA ≥ 4.5:1). */
export const GIVEAWAY_TIER_TOKENS_DARK: Record<GiveawayTier, GiveawayTierTokens> = {
  daily: { bg: '#082f44', fg: '#7dd3fc', border: '#38bdf8' },
  weekly: { bg: '#0b2744', fg: '#bfdbfe', border: '#7eb8ff' },
  monthly: { bg: '#1e1248', fg: '#ddd6fe', border: '#a78bfa' },
  yearly: { bg: '#422006', fg: '#fef3c7', border: '#fbbf24' },
  special: { bg: '#4c0519', fg: '#fecdd3', border: '#fb7185' },
};

/** Thème clair : fond clair + texte foncé (contraste AA ≥ 4.5:1). */
export const GIVEAWAY_TIER_TOKENS_LIGHT: Record<GiveawayTier, GiveawayTierTokens> = {
  daily: { bg: '#e0f2fe', fg: '#0c4a6e', border: '#0284c7' },
  weekly: { bg: '#dbeafe', fg: '#1e3a8a', border: '#3b82f6' },
  monthly: { bg: '#ede9fe', fg: '#4c1d95', border: '#8b5cf6' },
  yearly: { bg: '#fef3c7', fg: '#78350f', border: '#d97706' },
  special: { bg: '#ffe4e6', fg: '#9f1239', border: '#e11d48' },
};

export const GIVEAWAY_TIER_TOKENS = GIVEAWAY_TIER_TOKENS_DARK;

/** Badge partenaire : fond sombre teinté + texte clair (contraste AA ≥ 4.5:1). */
export const GIVEAWAY_PARTNER_TOKENS = {
  bg: '#2e1065',
  fg: '#f3e8ff',
  border: '#d8b4fe',
} as const;

export const GIVEAWAY_TIER_ACCENTS: Record<GiveawayTier, string> = {
  daily: GIVEAWAY_TIER_TOKENS.daily.border,
  weekly: GIVEAWAY_TIER_TOKENS.weekly.border,
  monthly: GIVEAWAY_TIER_TOKENS.monthly.border,
  yearly: GIVEAWAY_TIER_TOKENS.yearly.border,
  special: GIVEAWAY_TIER_TOKENS.special.border,
};

function srgbChannelToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function hexRelativeLuminance(hex: string): number {
  const raw = hex.replace('#', '');
  const normalized =
    raw.length === 3
      ? raw
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : raw;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return (
    0.2126 * srgbChannelToLinear(r) +
    0.7152 * srgbChannelToLinear(g) +
    0.0722 * srgbChannelToLinear(b)
  );
}

export function hexContrastRatio(foreground: string, background: string): number {
  const first = hexRelativeLuminance(foreground);
  const second = hexRelativeLuminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface GiveawayLeaderboardRow {
  username: string | null;
  avatar: string | null;
  entries: number;
  isYou?: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const CHROME_HALO = '#7eb8ff';

export interface GiveawayPresentationInput {
  id: string;
  status?: string;
  isPrivate?: boolean;
  requiredAffiliateCode?: string | null;
  ticketPrice: number;
  rewardValueCents?: number | null;
  durationType?: string | null;
  startDate?: Date | string | null;
  createdAt?: Date | string | null;
  endDate: Date | string;
  prize: string;
  prizeImageUrl?: string | null;
  steamMarketHashName?: string | null;
}

export function toGiveawayDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getPrizeValueCents(
  giveaway: Pick<GiveawayPresentationInput, 'rewardValueCents'>
): number | null {
  const value = giveaway.rewardValueCents;
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null;
  return Math.floor(value);
}

function tierFromDurationMs(durationMs: number): GiveawayTier {
  if (durationMs <= DAY_MS) return 'daily';
  if (durationMs <= 8 * DAY_MS) return 'weekly';
  if (durationMs <= 32 * DAY_MS) return 'monthly';
  if (durationMs < 180 * DAY_MS) return 'special';
  return 'yearly';
}

function tierFromDurationType(durationType: string): GiveawayTier | null {
  if (durationType === 'DAILY') return 'daily';
  if (durationType === 'WEEKLY') return 'weekly';
  if (durationType === 'MONTHLY') return 'monthly';
  if (durationType === 'YEARLY') return 'yearly';
  return null;
}

export function getGiveawayTier(
  giveaway: Pick<GiveawayPresentationInput, 'durationType' | 'startDate' | 'createdAt' | 'endDate'>
): GiveawayTier {
  const end = toGiveawayDate(giveaway.endDate);
  const start = toGiveawayDate(giveaway.startDate) ?? toGiveawayDate(giveaway.createdAt);
  if (end && start) {
    return tierFromDurationMs(end.getTime() - start.getTime());
  }

  return tierFromDurationType((giveaway.durationType ?? '').toUpperCase()) ?? 'special';
}

export function getGiveawayTierLabel(
  tier: GiveawayTier,
  labels: Record<GiveawayTier, string>
): string {
  return labels[tier];
}

export function giveawayTierLabels(layout: {
  tierDaily: string;
  tierWeekly: string;
  tierMonthly: string;
  tierYearly: string;
  tierSpecial: string;
}): Record<GiveawayTier, string> {
  return {
    daily: layout.tierDaily,
    weekly: layout.tierWeekly,
    monthly: layout.tierMonthly,
    yearly: layout.tierYearly,
    special: layout.tierSpecial,
  };
}

export function getGiveawayKicker(
  tier: GiveawayTier,
  layout: {
    kickerDaily: string;
    kickerWeekly: string;
    kickerMonthly: string;
    kickerYearly: string;
    kickerSpecial: string;
  }
): string {
  if (tier === 'daily') return layout.kickerDaily;
  if (tier === 'weekly') return layout.kickerWeekly;
  if (tier === 'monthly') return layout.kickerMonthly;
  if (tier === 'yearly') return layout.kickerYearly;
  return layout.kickerSpecial;
}

export function formatChanceNumber(value: number, locale: string): string {
  const amount = Number.isFinite(value) ? value : 0;
  const formatted = amount.toFixed(2);
  if (locale === 'fr') {
    return formatted.replace('.', ',');
  }
  return formatted;
}

export function formatChancePercent(value: number, locale: string): string {
  const formatted = formatChanceNumber(value, locale);
  if (locale === 'fr') {
    return `${formatted} %`;
  }
  return `${formatted}%`;
}

export function visibleLeaderboardRows(
  rows: GiveawayLeaderboardRow[],
  topN = 5,
  participantCount?: number
): GiveawayLeaderboardRow[] {
  const cap = Math.max(
    0,
    Math.min(topN, participantCount ?? topN, rows.length)
  );
  const sorted = [...rows].sort((a, b) => {
    if (b.entries !== a.entries) return b.entries - a.entries;
    return (a.username ?? '').localeCompare(b.username ?? '');
  });
  const top = sorted.slice(0, cap);
  const you = sorted.find((row) => row.isYou);
  if (you && !top.some((row) => row.isYou) && cap > 0) {
    return [...top.slice(0, cap - 1), you];
  }
  return top;
}

export function getGiveawayTierAccent(tier: GiveawayTier): string {
  return GIVEAWAY_TIER_TOKENS[tier].border;
}

export function getGiveawayTierTokens(tier: GiveawayTier): GiveawayTierTokens {
  return GIVEAWAY_TIER_TOKENS[tier];
}

export interface PrizeDisplay {
  weapon: string;
  finish: string;
  exterior: CS2Exterior | null;
  fallbackName: string;
  hasStructuredName: boolean;
}

export function parsePrizeDisplay(
  prize: string,
  steamMarketHashName?: string | null
): PrizeDisplay {
  const source = (steamMarketHashName || prize || '').trim();
  const weapon = source ? extractCs2WeaponType(source) : '';
  const finish = source ? extractCs2SkinName(source) : '';
  const exterior = source ? extractCs2Exterior(source) : null;
  const hasStructuredName = Boolean(weapon && finish && finish !== weapon);
  return {
    weapon,
    finish: hasStructuredName ? finish : '',
    exterior,
    fallbackName: prize || source,
    hasStructuredName,
  };
}

export function getPrizeHaloColor(prize: string, steamMarketHashName?: string | null): string {
  const source = `${steamMarketHashName ?? ''} ${prize}`;
  if (/★/.test(source) || /\b(knife|gloves|wraps)\b/i.test(source)) {
    return CS2_RARITIES['Exceedingly Rare'].color;
  }
  return CHROME_HALO;
}

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
  totalMs: number;
}

export function getTimeRemaining(endDate: Date | string, now = Date.now()): TimeRemaining {
  const end = toGiveawayDate(endDate);
  if (!end) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true, totalMs: 0 };
  }
  const totalMs = end.getTime() - now;
  if (totalMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true, totalMs: 0 };
  }
  const days = Math.floor(totalMs / DAY_MS);
  const hours = Math.floor((totalMs % DAY_MS) / (1000 * 60 * 60));
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, expired: false, totalMs };
}

export interface CompactDurationLabels {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

export function formatCompactCountdown(
  remaining: TimeRemaining,
  labels: CompactDurationLabels,
  expiredLabel: string
): string {
  if (remaining.expired) return expiredLabel;
  if (remaining.days > 0) {
    return `${remaining.days}${labels.days} ${remaining.hours}${labels.hours}`;
  }
  if (remaining.hours > 0) {
    return `${remaining.hours}${labels.hours} ${remaining.minutes}${labels.minutes}`;
  }
  return `${remaining.minutes}${labels.minutes} ${remaining.seconds}${labels.seconds}`;
}

export function localeToDateLocale(locale: string): string {
  if (locale === 'fr') return 'fr-FR';
  if (locale === 'cn') return 'zh-CN';
  return 'en-US';
}

export function formatGiveawayDate(value: Date | string, locale: string): string {
  const date = toGiveawayDate(value);
  if (!date) return '';
  return date.toLocaleDateString(localeToDateLocale(locale), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getDisplayInitials(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return '';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0]?.[0] ?? '';
    const second = parts[1]?.[0] ?? '';
    return `${first}${second}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export function formatWinnerCount(count: number, one: string, other: string): string {
  return (count === 1 ? one : other).replace('{count}', String(count));
}

export function cheapestActiveTicketPrice(
  giveaways: { status?: string; ticketPrice: number }[]
): number | null {
  const active = giveaways.filter((giveaway) => giveaway.status === 'ACTIVE' && giveaway.ticketPrice > 0);
  if (active.length === 0) return null;
  return Math.min(...active.map((giveaway) => giveaway.ticketPrice));
}

export function fragmentsUntilCheapestEntry(
  giveaways: { status?: string; ticketPrice: number }[],
  available: number
): number | null {
  const cheapest = cheapestActiveTicketPrice(giveaways);
  if (cheapest == null) return null;
  const missing = cheapest - available;
  return missing > 0 ? Math.ceil(missing) : null;
}

export function fragmentsEntryProgressPercent(
  available: number,
  cheapest: number | null
): number {
  if (cheapest == null || cheapest <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((available / cheapest) * 100)));
}

export interface PastWinnerRow {
  key: string;
  username: string | null;
  avatar: string | null;
  prize: string;
  prizeImageUrl: string | null;
  steamMarketHashName?: string | null;
  tier: GiveawayTier;
  endDate: Date | string;
  giveawayId: string;
  rewardValueCents?: number | null;
}

export interface PastWinnerPerson {
  username: string | null;
  avatar: string | null;
}

export interface PastWinnerGroup {
  key: string;
  giveawayId: string;
  prize: string;
  prizeImageUrl: string | null;
  steamMarketHashName?: string | null;
  tier: GiveawayTier;
  endDate: Date | string;
  rewardValueCents?: number | null;
  isPrivate?: boolean;
  requiredAffiliateCode?: string | null;
  winners: PastWinnerPerson[];
}

export const CAROUSEL_MAX_OFFSET = 2;
export const LOCAL_DAILY_GIVEAWAY_FIXTURE_ID = 'local-daily-fixture';

export type CarouselBreakpoint = 'mobile' | 'tablet' | 'desktop';

export function getCarouselBreakpoint(width: number): CarouselBreakpoint {
  if (width < 768) return 'mobile';
  if (width < 1200) return 'tablet';
  return 'desktop';
}

export function carouselMaxVisibleOffset(breakpoint: CarouselBreakpoint): number {
  return breakpoint === 'desktop' ? CAROUSEL_MAX_OFFSET : 1;
}

export function carouselCoverflowTransform(
  offset: number,
  breakpoint: CarouselBreakpoint = 'desktop'
): {
  scale: number;
  translateY: number;
  opacity: number;
  visible: boolean;
} {
  const abs = Math.abs(offset);
  const maxVisible = carouselMaxVisibleOffset(breakpoint);
  if (abs > maxVisible) return { scale: 0.5, translateY: 40, opacity: 0, visible: false };
  if (breakpoint === 'mobile') {
    if (abs === 0) return { scale: 1, translateY: 0, opacity: 1, visible: true };
    return { scale: 0.94, translateY: 12, opacity: 0.82, visible: true };
  }
  if (abs === 0) return { scale: 1, translateY: -24, opacity: 1, visible: true };
  if (abs === 1) return { scale: 0.82, translateY: 16, opacity: 0.7, visible: true };
  return { scale: 0.68, translateY: 32, opacity: 0.4, visible: true };
}

export function findPartnerLogo<T extends { name: string; logoUrl: string }>(
  code: string | null | undefined,
  logos: T[]
): T | null {
  const needle = (code ?? '').trim().toLowerCase();
  if (!needle) return null;
  return (
    logos.find((logo) => logo.name.trim().toLowerCase() === needle) ??
    logos.find((logo) => {
      const name = logo.name.trim().toLowerCase();
      return name.includes(needle) || needle.includes(name);
    }) ??
    null
  );
}

export function splitCurrencyDisplay(
  cents: number,
  locale: string,
  currency: 'EUR' | 'USD' | 'CNY'
): { integer: string; fraction: string; symbol: string; symbolFirst: boolean } {
  const amount = Math.max(0, Math.floor(Number.isFinite(cents) ? cents : 0));
  const integerValue = Math.floor(amount / 100);
  const fractionValue = amount % 100;
  const integer = integerValue.toLocaleString(localeToDateLocale(locale), { maximumFractionDigits: 0 });
  const separator = locale === 'fr' ? ',' : '.';
  const fraction = `${separator}${String(fractionValue).padStart(2, '0')}`;
  const symbol = currency === 'USD' ? '$' : currency === 'CNY' ? '¥' : '€';
  return {
    integer,
    fraction,
    symbol,
    symbolFirst: currency === 'USD' || currency === 'CNY',
  };
}

export type GiveawayCardAction =
  | { type: 'reserved' }
  | { type: 'maxReached' }
  | { type: 'unaffordable'; missing: number }
  | { type: 'participate' };

const TIER_SORT_ORDER: Record<GiveawayTier, number> = {
  daily: 0,
  weekly: 1,
  monthly: 2,
  special: 3,
  yearly: 4,
};

export const RECURRING_GIVEAWAY_TIERS: Exclude<GiveawayTier, 'special'>[] = [
  'daily',
  'weekly',
  'monthly',
  'yearly',
];

const RECURRING_TIER_SORT_ORDER: Record<Exclude<GiveawayTier, 'special'>, number> = {
  daily: 0,
  weekly: 1,
  monthly: 2,
  yearly: 3,
};

export function isRecurringGiveawayTier(
  tier: GiveawayTier
): tier is Exclude<GiveawayTier, 'special'> {
  return tier !== 'special';
}

export function hasConfiguredUserEntryLimit(
  maxEntriesPerUser: number | null | undefined
): boolean {
  return typeof maxEntriesPerUser === 'number' && Number.isFinite(maxEntriesPerUser) && maxEntriesPerUser > 0;
}

export function resolveAvatarSrc(avatar: string | null | undefined): string | undefined {
  const raw = (avatar ?? '').trim();
  if (!raw) return undefined;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (raw.startsWith('http://')) return `https://${raw.slice('http://'.length)}`;
  return raw;
}

export function collectPastWinners<
  T extends GiveawayPresentationInput & {
    winners?: { rank: number; user?: { steamUsername?: string | null; steamAvatar?: string | null } | null }[];
  },
>(giveaways: T[]): PastWinnerRow[] {
  const rows: PastWinnerRow[] = [];
  for (const giveaway of giveaways) {
    if (giveaway.status !== 'ENDED') continue;
    const winners = giveaway.winners ?? [];
    for (const winner of winners) {
      rows.push({
        key: `${giveaway.id}-${winner.rank}`,
        username: winner.user?.steamUsername ?? null,
        avatar: winner.user?.steamAvatar ?? null,
        prize: giveaway.prize,
        prizeImageUrl: giveaway.prizeImageUrl ?? null,
        steamMarketHashName: giveaway.steamMarketHashName,
        tier: getGiveawayTier(giveaway),
        endDate: giveaway.endDate,
        giveawayId: giveaway.id,
        rewardValueCents: giveaway.rewardValueCents,
      });
    }
  }
  rows.sort((a, b) => {
    const aTime = toGiveawayDate(a.endDate)?.getTime() ?? 0;
    const bTime = toGiveawayDate(b.endDate)?.getTime() ?? 0;
    return bTime - aTime;
  });
  return rows;
}

export function collectPastWinnerGroups<
  T extends GiveawayPresentationInput & {
    winners?: { rank: number; user?: { steamUsername?: string | null; steamAvatar?: string | null } | null }[];
  },
>(giveaways: T[]): PastWinnerGroup[] {
  const groups: PastWinnerGroup[] = [];
  for (const giveaway of giveaways) {
    if (giveaway.status !== 'ENDED') continue;
    const winners = [...(giveaway.winners ?? [])]
      .sort((a, b) => a.rank - b.rank)
      .map((winner) => ({
        username: winner.user?.steamUsername ?? null,
        avatar: winner.user?.steamAvatar ?? null,
      }));
    if (winners.length === 0) continue;
    groups.push({
      key: giveaway.id,
      giveawayId: giveaway.id,
      prize: giveaway.prize,
      prizeImageUrl: giveaway.prizeImageUrl ?? null,
      steamMarketHashName: giveaway.steamMarketHashName,
      tier: getGiveawayTier(giveaway),
      endDate: giveaway.endDate,
      rewardValueCents: giveaway.rewardValueCents,
      isPrivate: giveaway.isPrivate === true,
      requiredAffiliateCode: giveaway.requiredAffiliateCode ?? null,
      winners,
    });
  }
  groups.sort((a, b) => {
    const aTime = toGiveawayDate(a.endDate)?.getTime() ?? 0;
    const bTime = toGiveawayDate(b.endDate)?.getTime() ?? 0;
    return bTime - aTime;
  });
  return groups;
}

export function formatCommunityName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function nextUtcMidnightMs(now = Date.now()): number {
  const date = new Date(now);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1, 0, 0, 0, 0);
}

export function viewerIsWinner(
  giveaway: {
    winners?: { user?: { steamUsername?: string | null } | null }[];
  },
  username: string | null | undefined
): boolean {
  const needle = (username ?? '').trim();
  if (!needle) return false;
  return (giveaway.winners ?? []).some((winner) => (winner.user?.steamUsername ?? '').trim() === needle);
}

export function getGiveawayEntryLimits(
  giveaway: {
    ticketPrice: number;
    maxTickets: number;
    soldTickets: number;
    maxEntriesPerUser?: number | null;
    myEntries?: number;
  },
  userFragments: number
): {
  myEntries: number;
  poolLeft: number;
  maxByRules: number;
  maxAffordable: number;
  maxSelectable: number;
  userLimitReached: boolean;
  poolSoldOut: boolean;
  maxReached: boolean;
} {
  const myEntries = giveaway.myEntries ?? 0;
  const hasUserLimit = hasConfiguredUserEntryLimit(giveaway.maxEntriesPerUser);
  const remainingPerUser = hasUserLimit
    ? Math.max(0, (giveaway.maxEntriesPerUser ?? 0) - myEntries)
    : null;
  const hasPoolCap = typeof giveaway.maxTickets === 'number' && giveaway.maxTickets > 0;
  const poolLeft = hasPoolCap
    ? Math.max(0, giveaway.maxTickets - (giveaway.soldTickets ?? 0))
    : Number.POSITIVE_INFINITY;
  const finitePoolLeft = Number.isFinite(poolLeft) ? poolLeft : 0;
  const maxAffordable =
    giveaway.ticketPrice > 0 ? Math.floor(Math.max(0, userFragments) / giveaway.ticketPrice) : 0;
  const maxByRules = Math.max(
    0,
    Math.min(
      Number.isFinite(poolLeft) ? poolLeft : Number.MAX_SAFE_INTEGER,
      remainingPerUser ?? Number.MAX_SAFE_INTEGER
    )
  );
  const maxSelectable = Math.max(0, Math.min(maxByRules, maxAffordable));
  const userLimitReached = hasUserLimit && myEntries >= (giveaway.maxEntriesPerUser ?? 0);
  const poolSoldOut = hasPoolCap && poolLeft < 1;
  return {
    myEntries,
    poolLeft: finitePoolLeft,
    maxByRules,
    maxAffordable,
    maxSelectable,
    userLimitReached,
    poolSoldOut,
    maxReached: userLimitReached,
  };
}

export function getGiveawayCardAction(
  giveaway: {
    isPrivate?: boolean;
    canParticipate?: boolean;
    ticketPrice: number;
    maxTickets: number;
    soldTickets: number;
    maxEntriesPerUser?: number | null;
    myEntries?: number;
  },
  userFragments: number
): GiveawayCardAction {
  if (giveaway.isPrivate && giveaway.canParticipate === false) {
    return { type: 'reserved' };
  }
  const limits = getGiveawayEntryLimits(giveaway, userFragments);
  if (limits.userLimitReached) {
    return { type: 'maxReached' };
  }
  const missing = Math.max(0, giveaway.ticketPrice - userFragments);
  if (missing > 0) {
    return { type: 'unaffordable', missing };
  }
  return { type: 'participate' };
}

export function selectRecurringActiveGiveaways<T extends GiveawayPresentationInput>(
  giveaways: T[]
): T[] {
  const recurring = giveaways.filter((giveaway) => {
    if (giveaway.status !== 'ACTIVE' || giveaway.isPrivate) return false;
    return isRecurringGiveawayTier(getGiveawayTier(giveaway));
  });
  return [...recurring].sort((a, b) => {
    const aTier = getGiveawayTier(a);
    const bTier = getGiveawayTier(b);
    const aOrder = isRecurringGiveawayTier(aTier) ? RECURRING_TIER_SORT_ORDER[aTier] : 99;
    const bOrder = isRecurringGiveawayTier(bTier) ? RECURRING_TIER_SORT_ORDER[bTier] : 99;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return compareEndingSoon(a, b);
  });
}

export function selectHighestValueIndex<T extends GiveawayPresentationInput>(giveaways: T[]): number {
  if (giveaways.length === 0) return -1;
  let best = 0;
  for (let index = 1; index < giveaways.length; index += 1) {
    const current = giveaways[index];
    const leader = giveaways[best];
    if (!current || !leader) continue;
    if (compareHighestValue(current, leader) < 0) {
      best = index;
    }
  }
  return best;
}

export function carouselSignedOffset(index: number, active: number, count: number): number {
  if (count <= 1) return 0;
  let diff = index - active;
  const half = count / 2;
  if (diff > half) diff -= count;
  if (diff < -half) diff += count;
  return diff;
}

export function carouselCoverflowXPercent(
  offset: number,
  breakpoint: CarouselBreakpoint = 'desktop'
): number {
  const abs = Math.min(Math.abs(offset), CAROUSEL_MAX_OFFSET + 1);
  if (breakpoint === 'mobile') {
    const shift = abs === 0 ? 0 : abs === 1 ? 98 : 118;
    return Math.sign(offset) * shift;
  }
  const shift = abs === 0 ? 0 : abs === 1 ? 74 : abs === 2 ? 132 : 160;
  return Math.sign(offset) * shift;
}

export function createLocalDailyGiveawayFixture<T extends GiveawayPresentationInput>(
  template: T,
  now = Date.now()
): T {
  const start = new Date(now);
  const end = new Date(now + 20 * 60 * 60 * 1000);
  return {
    ...template,
    id: LOCAL_DAILY_GIVEAWAY_FIXTURE_ID,
    durationType: 'DAILY',
    startDate: start.toISOString(),
    createdAt: start.toISOString(),
    endDate: end.toISOString(),
    status: 'ACTIVE',
    isPrivate: false,
    rewardValueCents:
      typeof template.rewardValueCents === 'number' && template.rewardValueCents > 0
        ? Math.min(template.rewardValueCents, 250)
        : 250,
  };
}

export function insertLocalDailyGiveawayIfMissing<T extends GiveawayPresentationInput>(
  giveaways: T[],
  now = Date.now()
): T[] {
  const recurring = selectRecurringActiveGiveaways(giveaways);
  if (recurring.some((item) => getGiveawayTier(item) === 'daily')) return recurring;
  const template = recurring[0];
  if (!template) return recurring;
  return selectRecurringActiveGiveaways([...recurring, createLocalDailyGiveawayFixture(template, now)]);
}

export function sortGiveawaysByTierThenEnd<T extends GiveawayPresentationInput>(giveaways: T[]): T[] {
  return [...giveaways].sort((a, b) => {
    const tierDiff = TIER_SORT_ORDER[getGiveawayTier(a)] - TIER_SORT_ORDER[getGiveawayTier(b)];
    if (tierDiff !== 0) return tierDiff;
    return compareEndingSoon(a, b);
  });
}

function compareEndingSoon(a: GiveawayPresentationInput, b: GiveawayPresentationInput): number {
  const aEnd = toGiveawayDate(a.endDate)?.getTime() ?? Number.POSITIVE_INFINITY;
  const bEnd = toGiveawayDate(b.endDate)?.getTime() ?? Number.POSITIVE_INFINITY;
  return aEnd - bEnd;
}

function compareHighestValue(a: GiveawayPresentationInput, b: GiveawayPresentationInput): number {
  const aValue = getPrizeValueCents(a) ?? -1;
  const bValue = getPrizeValueCents(b) ?? -1;
  if (bValue !== aValue) return bValue - aValue;
  return b.ticketPrice - a.ticketPrice;
}

function compareLowestCost(a: GiveawayPresentationInput, b: GiveawayPresentationInput): number {
  if (a.ticketPrice !== b.ticketPrice) return a.ticketPrice - b.ticketPrice;
  return compareEndingSoon(a, b);
}

export function sortGiveaways<T extends GiveawayPresentationInput>(
  giveaways: T[],
  sort: GiveawaySort
): T[] {
  const copy = [...giveaways];
  copy.sort((a, b) => {
    if (sort === 'highestValue') return compareHighestValue(a, b);
    if (sort === 'lowestCost') return compareLowestCost(a, b);
    return compareEndingSoon(a, b);
  });
  return copy;
}

export function selectFeaturedGiveaway<T extends GiveawayPresentationInput>(
  giveaways: T[]
): T | null {
  const publicActive = giveaways.filter(
    (giveaway) => giveaway.status === 'ACTIVE' && !giveaway.isPrivate
  );
  if (publicActive.length === 0) return null;
  return sortGiveaways(publicActive, 'highestValue')[0] ?? null;
}

export function filterGiveawaysByTier<T extends GiveawayPresentationInput>(
  giveaways: T[],
  filter: GiveawayTierFilter
): T[] {
  if (filter === 'all') return giveaways;
  return giveaways.filter((giveaway) => getGiveawayTier(giveaway) === filter);
}
