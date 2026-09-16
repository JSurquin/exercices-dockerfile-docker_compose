import {
  CS2_RARITIES,
  extractCs2Exterior,
  extractCs2SkinName,
  extractCs2WeaponType,
  type CS2Exterior,
} from '@/lib/cs2-constants';

export type GiveawaySort = 'endingSoon' | 'highestValue' | 'lowestCost';
export type GiveawayTier = 'daily' | 'weekly' | 'monthly' | 'special';
export type GiveawayTierFilter = 'all' | GiveawayTier;

export const GIVEAWAY_TIER_ACCENTS: Record<GiveawayTier, string> = {
  daily: '#38bdf8',
  weekly: '#7eb8ff',
  monthly: '#a78bfa',
  special: '#fbbf24',
};

const DAY_MS = 24 * 60 * 60 * 1000;
const CHROME_HALO = '#7eb8ff';

export interface GiveawayPresentationInput {
  id: string;
  status?: string;
  isPrivate?: boolean;
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

export function getGiveawayTier(
  giveaway: Pick<GiveawayPresentationInput, 'durationType' | 'startDate' | 'createdAt' | 'endDate'>
): GiveawayTier {
  const durationType = (giveaway.durationType ?? '').toUpperCase();
  if (durationType === 'DAILY') return 'daily';
  if (durationType === 'WEEKLY') return 'weekly';
  if (durationType === 'MONTHLY') return 'monthly';
  if (durationType === 'YEARLY') return 'special';

  const end = toGiveawayDate(giveaway.endDate);
  const start = toGiveawayDate(giveaway.startDate) ?? toGiveawayDate(giveaway.createdAt);
  if (!end || !start) return 'special';

  const durationMs = end.getTime() - start.getTime();
  if (durationMs <= DAY_MS) return 'daily';
  if (durationMs <= 8 * DAY_MS) return 'weekly';
  if (durationMs <= 32 * DAY_MS) return 'monthly';
  return 'special';
}

export function getGiveawayTierAccent(tier: GiveawayTier): string {
  return GIVEAWAY_TIER_ACCENTS[tier];
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

export function fragmentsUntilCheapestEntry(
  giveaways: { status?: string; ticketPrice: number }[],
  available: number
): number | null {
  const active = giveaways.filter((giveaway) => giveaway.status === 'ACTIVE' && giveaway.ticketPrice > 0);
  if (active.length === 0) return null;
  const cheapest = Math.min(...active.map((giveaway) => giveaway.ticketPrice));
  const missing = cheapest - available;
  return missing > 0 ? Math.ceil(missing) : null;
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
