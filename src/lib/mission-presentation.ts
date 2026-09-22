import {
  getTimeRemaining,
  localeToDateLocale,
  type CompactDurationLabels,
} from '@/lib/giveaway-presentation';

export type { CompactDurationLabels };

export type MissionCategory = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SOCIAL' | 'BONUS';
export type MissionSectionId = 'TODAY' | 'WEEKLY' | 'MONTHLY' | 'SOCIAL';
export type MissionResetPeriod = 'day' | 'week' | 'month' | 'once';

export const WELCOME_BONUS_MISSION_KEY = 'WELCOME_BONUS';

export type MissionRow = {
  key: string;
  category: MissionCategory;
  rewardFragments: number;
  periodKey: string;
  completed: boolean;
  eligible: boolean;
  progressCurrent?: number;
  progressTarget?: number;
  thresholdCents?: number;
};

/** Récompenses gratuites du jour — regroupement d'affichage uniquement. */
export const TODAY_MISSION_KEYS = ['BONUS_DAILY_SURPRISE', 'DAILY_CLAIM', 'DAILY_VISIT'] as const;
export type TodayMissionKey = (typeof TODAY_MISSION_KEYS)[number];

export const MISSION_SECTIONS: MissionSectionId[] = ['TODAY', 'WEEKLY', 'MONTHLY', 'SOCIAL'];

export const SECTION_RESET_PERIOD: Record<MissionSectionId, MissionResetPeriod> = {
  TODAY: 'day',
  WEEKLY: 'week',
  MONTHLY: 'month',
  SOCIAL: 'once',
};

export const SOCIAL_VISIT_STORAGE_KEY = 'moonskin.socialMissionVisited';

/** Accents par type d’action (contraste ≥ 4.5:1 sur texte blanc). */
export type MissionKind = 'sell' | 'giveaway' | 'social' | 'daily';

export const MISSION_KIND_ACCENT: Record<MissionKind, string> = {
  sell: '#0D9488',
  giveaway: '#7C3AED',
  social: '#DB2777',
  daily: '#2563EB',
};

export const MISSION_CATEGORY_ACCENT: Record<MissionCategory, string> = {
  DAILY: MISSION_KIND_ACCENT.daily,
  WEEKLY: MISSION_KIND_ACCENT.sell,
  MONTHLY: MISSION_KIND_ACCENT.sell,
  SOCIAL: MISSION_KIND_ACCENT.social,
  BONUS: MISSION_KIND_ACCENT.daily,
};

export type MissionUiStatus = 'claimable' | 'in_progress' | 'claimed' | 'blocked';

const STATUS_ORDER: Record<MissionUiStatus, number> = {
  claimable: 0,
  in_progress: 1,
  claimed: 2,
  blocked: 3,
};

export type MissionActionKind = 'sell' | 'giveaway' | 'social' | 'newsletter' | null;

export type MissionClaimErrorCopy = {
  errorAlreadyClaimed: string;
  errorRequirements: string;
  errorUnknown: string;
  errorAuth: string;
  errorServer: string;
  genericError: string;
};

export function isTodayMissionKey(key: string): key is TodayMissionKey {
  return (TODAY_MISSION_KEYS as readonly string[]).includes(key);
}

export function isMissionClaimable(mission: Pick<MissionRow, 'eligible' | 'completed'>): boolean {
  return mission.eligible && !mission.completed;
}

export function countClaimable(missions: MissionRow[]): number {
  return missions.filter(isMissionClaimable).length;
}

export function sumClaimableRewards(missions: Pick<MissionRow, 'eligible' | 'completed' | 'rewardFragments'>[]): number {
  return missions.reduce(
    (total, mission) => total + (isMissionClaimable(mission) ? mission.rewardFragments : 0),
    0
  );
}

export function isWelcomeMissionKey(key: string): boolean {
  return key === WELCOME_BONUS_MISSION_KEY;
}

export function isDailyActionMission(mission: Pick<MissionRow, 'key' | 'category'>): boolean {
  return mission.category === 'DAILY' && !isTodayMissionKey(mission.key) && !isWelcomeMissionKey(mission.key);
}

const MISSIONS_WITH_CONDITION_HINT = new Set(['WEEKLY_GIVEAWAY_3', 'DAILY_SELL_SKIN']);

export function hasUsefulMissionDescription(
  mission: Pick<MissionRow, 'key' | 'category'>
): boolean {
  if (mission.category === 'SOCIAL') return false;
  if (isTodayMissionKey(mission.key) || isWelcomeMissionKey(mission.key)) return false;
  return MISSIONS_WITH_CONDITION_HINT.has(mission.key);
}

export function areAllMissionsClaimed(missions: Pick<MissionRow, 'eligible' | 'completed'>[]): boolean {
  return missions.length > 0 && missions.every((mission) => mission.completed);
}

export function partitionMissionsByClaimed<T extends Pick<MissionRow, 'eligible' | 'completed'>>(
  missions: T[]
): { active: T[]; claimed: T[] } {
  const sorted = sortMissionsByStatus(missions);
  return {
    active: sorted.filter((mission) => getMissionUiStatus(mission) !== 'claimed'),
    claimed: sorted.filter((mission) => getMissionUiStatus(mission) === 'claimed'),
  };
}

export function groupMissionsForPage(missions: MissionRow[]): {
  welcome: MissionRow | undefined;
  todayTiles: MissionRow[];
  dailyActions: MissionRow[];
  weekly: MissionRow[];
  monthly: MissionRow[];
  social: MissionRow[];
} {
  const welcome = missions.find((mission) => isWelcomeMissionKey(mission.key));
  const todayTiles = TODAY_MISSION_KEYS.map((key) => missions.find((mission) => mission.key === key)).filter(
    (mission): mission is MissionRow => Boolean(mission)
  );
  const dailyActions: MissionRow[] = [];
  const weekly: MissionRow[] = [];
  const monthly: MissionRow[] = [];
  const social: MissionRow[] = [];

  for (const mission of missions) {
    if (isWelcomeMissionKey(mission.key) || isTodayMissionKey(mission.key)) continue;
    if (isDailyActionMission(mission)) dailyActions.push(mission);
    else if (mission.category === 'WEEKLY') weekly.push(mission);
    else if (mission.category === 'MONTHLY') monthly.push(mission);
    else if (mission.category === 'SOCIAL') social.push(mission);
  }

  return { welcome, todayTiles, dailyActions, weekly, monthly, social };
}

export function formatClaimableBadge(template: string, count: number): string | null {
  if (count <= 0) return null;
  return template.replace('{n}', String(count));
}

export function formatSectionAllDone(template: string, resetLabel: string): string {
  return template.replace('{reset}', resetLabel);
}

function readJsonArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function readVisitedSocialMissions(storage?: Pick<Storage, 'getItem'> | null): string[] {
  const store = storage ?? (typeof window === 'undefined' ? null : window.localStorage);
  if (!store) return [];
  try {
    return readJsonArray(store.getItem(SOCIAL_VISIT_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function hasVisitedSocialMission(
  key: string,
  storage?: Pick<Storage, 'getItem'> | null
): boolean {
  return readVisitedSocialMissions(storage).includes(key);
}

export function markSocialMissionVisited(
  key: string,
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null
): string[] {
  const store = storage ?? (typeof window === 'undefined' ? null : window.localStorage);
  const next = Array.from(new Set([...readVisitedSocialMissions(store), key]));
  try {
    store?.setItem(SOCIAL_VISIT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
  return next;
}

/**
 * Prochaine réinitialisation, alignée sur les périodes serveur (UTC).
 * L'affichage convertit ensuite la durée restante en horloge locale.
 */
export function nextMissionResetAt(period: MissionResetPeriod, at = new Date()): Date | null {
  if (period === 'once') return null;

  if (period === 'day') {
    return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate() + 1, 0, 0, 0, 0));
  }

  if (period === 'week') {
    const day = at.getUTCDay();
    const diffFromMonday = (day + 6) % 7;
    const thisMonday = new Date(
      Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate() - diffFromMonday, 0, 0, 0, 0)
    );
    const nextMonday = new Date(thisMonday);
    nextMonday.setUTCDate(nextMonday.getUTCDate() + 7);
    return nextMonday;
  }

  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}

export function formatMissionDuration(
  resetAt: Date,
  labels: CompactDurationLabels,
  now = Date.now()
): string {
  const remaining = getTimeRemaining(resetAt, now);
  if (remaining.expired) return `0${labels.minutes}`;
  if (remaining.days > 0) {
    return `${remaining.days}${labels.days} ${remaining.hours}${labels.hours}`;
  }
  if (remaining.hours > 0) {
    return `${remaining.hours}${labels.hours} ${remaining.minutes}${labels.minutes}`;
  }
  return `${Math.max(1, remaining.minutes)}${labels.minutes}`;
}

export function formatMissionResetLine(
  template: string,
  resetAt: Date | null,
  labels: CompactDurationLabels,
  emptyLabel: string,
  now = Date.now()
): string {
  if (!resetAt) return emptyLabel;
  return template.replace('{duration}', formatMissionDuration(resetAt, labels, now));
}

export function getMissionKind(key: string): MissionKind {
  if (key.startsWith('SOCIAL_')) return 'social';
  if (key.includes('GIVEAWAY')) return 'giveaway';
  if (key.includes('SELL')) return 'sell';
  return 'daily';
}

export function getMissionAccent(key: string, category?: MissionCategory): string {
  return MISSION_KIND_ACCENT[getMissionKind(key)] ?? (category ? MISSION_CATEGORY_ACCENT[category] : MISSION_KIND_ACCENT.daily);
}

/**
 * Audit V1 : aucune mission n’est gated (pas de KYC, pas de niveau).
 * `eligible: false` = objectif pas encore atteint, jamais un verrou.
 */
export function getMissionBlockReason(
  _mission: Pick<MissionRow, 'eligible' | 'completed'> & Partial<Pick<MissionRow, 'key'>>
): string | null {
  return null;
}

export function getMissionUiStatus(
  mission: Pick<MissionRow, 'eligible' | 'completed'> & Partial<Pick<MissionRow, 'key'>>
): MissionUiStatus {
  if (mission.completed) return 'claimed';
  if (getMissionBlockReason(mission)) return 'blocked';
  if (mission.eligible) return 'claimable';
  return 'in_progress';
}

export function sortMissionsByStatus<T extends Pick<MissionRow, 'eligible' | 'completed'>>(
  missions: T[]
): T[] {
  return [...missions].sort(
    (a, b) => STATUS_ORDER[getMissionUiStatus(a)] - STATUS_ORDER[getMissionUiStatus(b)]
  );
}

export function getMissionActionKind(key: string): MissionActionKind {
  if (key === 'SOCIAL_NEWSLETTER') return 'newsletter';
  if (key.startsWith('SOCIAL_')) return 'social';
  if (key.includes('GIVEAWAY')) return 'giveaway';
  if (key.includes('SELL')) return 'sell';
  return null;
}

export function getMissionActionHref(key: string, socialUrl?: string | null): string | null {
  const kind = getMissionActionKind(key);
  if (kind === 'sell') return '/sell';
  if (kind === 'giveaway') return '/giveaways';
  if (kind === 'newsletter') return '/#newsletter';
  if (kind === 'social') return socialUrl ?? null;
  return null;
}

export function isQuantitativeMission(
  mission: Pick<MissionRow, 'progressTarget' | 'completed'>
): boolean {
  return !mission.completed && mission.progressTarget != null && mission.progressTarget > 0;
}

export function formatMissionEur(cents: number, locale = 'fr'): string {
  const amount = Math.max(0, Math.round((Number.isFinite(cents) ? cents : 0) / 100));
  return new Intl.NumberFormat(localeToDateLocale(locale), {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatMissionTitle(
  template: string,
  mission: Pick<MissionRow, 'thresholdCents'>,
  locale = 'fr'
): string {
  if (!template.includes('{amount}')) return template;
  if (mission.thresholdCents == null) return template.replace('{amount}', '').replace(/\s+/g, ' ').trim();
  return template.replace('{amount}', formatMissionEur(mission.thresholdCents, locale));
}

export function formatMissionProgressLabel(
  mission: Pick<MissionRow, 'progressCurrent' | 'progressTarget' | 'thresholdCents'>,
  locale = 'fr'
): string | null {
  if (mission.progressTarget == null || mission.progressCurrent == null) return null;
  if (mission.thresholdCents != null) {
    return `${formatMissionEur(mission.progressCurrent, locale)} / ${formatMissionEur(mission.progressTarget, locale)}`;
  }
  return `${mission.progressCurrent} / ${mission.progressTarget}`;
}

export function formatClaimRewardLabel(template: string, amount: number): string {
  return template.replace('{n}', String(amount));
}

export function mapMissionClaimError(message: string, t: MissionClaimErrorCopy): string {
  const normalized = message.trim().toLowerCase();
  if (normalized === 'already claimed for this period') return t.errorAlreadyClaimed;
  if (normalized === 'requirements not met') return t.errorRequirements;
  if (normalized === 'unknown mission') return t.errorUnknown;
  if (normalized === 'non authentifié' || normalized === 'unauthorized') return t.errorAuth;
  if (normalized === 'erreur serveur' || normalized === 'internal server error') return t.errorServer;
  if (!message || normalized === 'erreur' || normalized === 'error') return t.genericError;
  return message;
}
