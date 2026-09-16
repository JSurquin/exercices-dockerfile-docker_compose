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
