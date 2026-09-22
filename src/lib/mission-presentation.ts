import {
  getTimeRemaining,
  type CompactDurationLabels,
} from '@/lib/giveaway-presentation';

export type { CompactDurationLabels };

export type MissionCategory = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SOCIAL' | 'BONUS';
export type MissionPeriodTab = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SOCIAL';
export type MissionResetPeriod = 'day' | 'week' | 'month' | 'once';

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

export const MISSION_PERIOD_TABS: MissionPeriodTab[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'SOCIAL'];

export const TAB_RESET_PERIOD: Record<MissionPeriodTab, MissionResetPeriod> = {
  DAILY: 'day',
  WEEKLY: 'week',
  MONTHLY: 'month',
  SOCIAL: 'once',
};

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

export function pickDefaultMissionTab(
  claimableByTab: Record<MissionPeriodTab, number>
): MissionPeriodTab {
  let best: MissionPeriodTab = 'DAILY';
  let max = claimableByTab.DAILY ?? 0;
  for (const tab of MISSION_PERIOD_TABS) {
    const n = claimableByTab[tab] ?? 0;
    if (n > max) {
      max = n;
      best = tab;
    }
  }
  return best;
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

export function formatMissionProgressLabel(
  mission: Pick<MissionRow, 'progressCurrent' | 'progressTarget' | 'thresholdCents'>
): string | null {
  if (mission.progressTarget == null || mission.progressCurrent == null) return null;
  if (mission.thresholdCents != null) {
    return `${Math.round(mission.progressCurrent / 100)} € / ${Math.round(mission.progressTarget / 100)} €`;
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
