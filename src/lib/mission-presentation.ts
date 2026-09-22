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

export const MISSION_CATEGORY_ACCENT: Record<MissionCategory, string> = {
  DAILY: '#4F8CFF',
  WEEKLY: '#22D3EE',
  MONTHLY: '#9B5CFF',
  SOCIAL: '#FF4FA3',
  BONUS: '#F5B83D',
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
