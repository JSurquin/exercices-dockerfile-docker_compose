import { format, getISOWeek, getISOWeekYear } from 'date-fns';
import type { FragmentTransactionType, Prisma } from '@prisma/client';
import { prisma } from '../../prisma/prisma';

export type MissionCategory = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SOCIAL' | 'BONUS';

export interface MissionDef {
  key: string;
  category: MissionCategory;
  rewardFragments: number;
  fragmentType: FragmentTransactionType;
  /** day | week | month | once */
  period: 'day' | 'week' | 'month' | 'once';
  thresholdCents?: number;
  minGiveawayParticipations?: number;
  /** Mission bonus : récompense variable tirée aléatoirement entre min et max */
  bonusRange?: { min: number; max: number };
}

/** Génère le reward aléatoire du jour pour la mission bonus, déterministe via seed date+userId */
function getDailyBonusReward(userId: string, dateStr: string, range: { min: number; max: number }): number {
  let hash = 0;
  const seed = `${dateStr}:${userId}:bonus`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const rand = Math.abs(hash) / 0x7fffffff;
  const steps = Math.floor((range.max - range.min) / 5);
  return range.min + Math.floor(rand * (steps + 1)) * 5;
}

export const MISSION_DEFINITIONS: MissionDef[] = [
  { key: 'DAILY_CLAIM', category: 'DAILY', rewardFragments: 10, fragmentType: 'GENERATED_MISSION_DAILY', period: 'day' },
  { key: 'DAILY_SELL_SKIN', category: 'DAILY', rewardFragments: 15, fragmentType: 'GENERATED_MISSION_DAILY', period: 'day' },
  { key: 'DAILY_VISIT', category: 'DAILY', rewardFragments: 5, fragmentType: 'GENERATED_MISSION_DAILY', period: 'day' },
  { key: 'WEEKLY_SELL_500', category: 'WEEKLY', rewardFragments: 50, fragmentType: 'GENERATED_MISSION_WEEKLY', period: 'week', thresholdCents: 50_000 },
  { key: 'WEEKLY_SELL_1000', category: 'WEEKLY', rewardFragments: 100, fragmentType: 'GENERATED_MISSION_WEEKLY', period: 'week', thresholdCents: 100_000 },
  {
    key: 'WEEKLY_GIVEAWAY_3',
    category: 'WEEKLY',
    rewardFragments: 30,
    fragmentType: 'GENERATED_MISSION_WEEKLY',
    period: 'week',
    minGiveawayParticipations: 3,
  },
  { key: 'MONTHLY_SELL_5000', category: 'MONTHLY', rewardFragments: 200, fragmentType: 'GENERATED_MISSION_MONTHLY', period: 'month', thresholdCents: 500_000 },
  { key: 'MONTHLY_SELL_10000', category: 'MONTHLY', rewardFragments: 400, fragmentType: 'GENERATED_MISSION_MONTHLY', period: 'month', thresholdCents: 1_000_000 },
  { key: 'SOCIAL_NEWSLETTER', category: 'SOCIAL', rewardFragments: 20, fragmentType: 'GENERATED_MISSION_SOCIAL', period: 'once' },
  { key: 'SOCIAL_TWITTER', category: 'SOCIAL', rewardFragments: 15, fragmentType: 'GENERATED_MISSION_SOCIAL', period: 'once' },
  { key: 'SOCIAL_INSTAGRAM', category: 'SOCIAL', rewardFragments: 15, fragmentType: 'GENERATED_MISSION_SOCIAL', period: 'once' },
  { key: 'SOCIAL_DISCORD', category: 'SOCIAL', rewardFragments: 25, fragmentType: 'GENERATED_MISSION_SOCIAL', period: 'once' },
  { key: 'SOCIAL_TIKTOK', category: 'SOCIAL', rewardFragments: 15, fragmentType: 'GENERATED_MISSION_SOCIAL', period: 'once' },
  { key: 'SOCIAL_YOUTUBE', category: 'SOCIAL', rewardFragments: 15, fragmentType: 'GENERATED_MISSION_SOCIAL', period: 'once' },
  { key: 'SOCIAL_TELEGRAM', category: 'SOCIAL', rewardFragments: 20, fragmentType: 'GENERATED_MISSION_SOCIAL', period: 'once' },
  { key: 'SOCIAL_STEAM_GROUP', category: 'SOCIAL', rewardFragments: 20, fragmentType: 'GENERATED_MISSION_SOCIAL', period: 'once' },
  {
    key: 'BONUS_DAILY_SURPRISE',
    category: 'BONUS',
    rewardFragments: 0, // override dynamique via bonusRange
    fragmentType: 'GENERATED_MISSION_BONUS',
    period: 'day',
    bonusRange: { min: 20, max: 50 },
  },
];

function utcCalendarDate(at: Date): Date {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate(), 12, 0, 0, 0));
}

export function periodKeyFor(def: MissionDef, at = new Date()): string {
  const u = utcCalendarDate(at);
  if (def.period === 'once') return 'once';
  if (def.period === 'day') return `day:${format(u, 'yyyy-MM-dd')}`;
  if (def.period === 'week') return `week:${getISOWeekYear(u)}-W${String(getISOWeek(u)).padStart(2, '0')}`;
  return `month:${format(u, 'yyyy-MM')}`;
}

function startEndForPeriod(def: MissionDef, at = new Date()): { start: Date; end: Date } {
  if (def.period === 'day') {
    const start = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate(), 0, 0, 0, 0));
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  }
  if (def.period === 'week') {
    const d = new Date(at);
    const day = d.getUTCDay();
    const diff = (day + 6) % 7;
    const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff, 0, 0, 0, 0));
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    return { start, end };
  }
  if (def.period === 'month') {
    const start = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth() + 1, 1, 0, 0, 0, 0));
    return { start, end };
  }
  return { start: new Date(0), end: new Date(8640000000000000) };
}

async function userVolumeCentsInRange(userId: string, start: Date, end: Date): Promise<number> {
  const agg = await prisma.trade.aggregate({
    where: {
      userId,
      status: 'PAID',
      updatedAt: { gte: start, lt: end },
    },
    _sum: { grossCents: true },
  });
  return agg._sum.grossCents ?? 0;
}

async function userGiveawayParticipationCountInRange(userId: string, start: Date, end: Date): Promise<number> {
  return prisma.giveawayEntry.count({
    where: {
      userId,
      enteredAt: { gte: start, lt: end },
    },
  });
}

export async function isMissionEligible(userId: string, def: MissionDef, at = new Date()): Promise<boolean> {
  const { start, end } = startEndForPeriod(def, at);

  if (def.key === 'DAILY_CLAIM') return true;
  if (def.key === 'DAILY_VISIT') return true;
  if (def.key === 'BONUS_DAILY_SURPRISE') return true;

  if (def.key === 'DAILY_SELL_SKIN') {
    const c = await prisma.trade.count({
      where: {
        userId,
        status: 'PAID',
        updatedAt: { gte: start, lt: end },
      },
    });
    return c >= 1;
  }

  if (def.thresholdCents != null) {
    const vol = await userVolumeCentsInRange(userId, start, end);
    return vol >= def.thresholdCents;
  }

  if (def.minGiveawayParticipations != null) {
    const n = await userGiveawayParticipationCountInRange(userId, start, end);
    return n >= def.minGiveawayParticipations;
  }

  if (def.period === 'once' && def.category === 'SOCIAL') {
    return true;
  }

  return false;
}

export async function claimMission(userId: string, missionKey: string): Promise<{ ok: true; fragments: number } | { ok: false; error: string }> {
  const def = MISSION_DEFINITIONS.find((m) => m.key === missionKey);
  if (!def) return { ok: false, error: 'Unknown mission' };

  const pKey = periodKeyFor(def);

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.userMissionCompletion.findUnique({
        where: {
          userId_missionKey_periodKey: { userId, missionKey, periodKey: pKey },
        },
      });
      if (existing) {
        return { ok: false as const, error: 'Already claimed for this period' };
      }

      const eligible = await isMissionEligible(userId, def);
      if (!eligible) {
        return { ok: false as const, error: 'Requirements not met' };
      }

      const dateStr = pKey.replace('day:', '');
      const reward = def.bonusRange
        ? getDailyBonusReward(userId, dateStr, def.bonusRange)
        : def.rewardFragments;

      const meta: Prisma.InputJsonValue = { missionKey: def.key, periodKey: pKey, reward };

      await tx.userMissionCompletion.create({
        data: {
          userId,
          missionKey,
          periodKey: pKey,
          rewardFragments: reward,
        },
      });
      await tx.fragmentTransaction.create({
        data: {
          userId,
          type: def.fragmentType,
          amount: reward,
          reason: `Mission ${def.key}`,
          metadata: meta,
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: { fragments: { increment: reward } },
      });

      return { ok: true as const, fragments: reward };
    });
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === 'P2002') {
      return { ok: false, error: 'Already claimed for this period' };
    }
    throw error;
  }
}

export async function listMissionsForUser(userId: string) {
  const now = new Date();

  // Calculer toutes les period keys d'un coup
  const periodKeys = MISSION_DEFINITIONS.map((def) => periodKeyFor(def, now));

  // Récupérer toutes les completions en une seule requête
  const completions = await prisma.userMissionCompletion.findMany({
    where: {
      userId,
      missionKey: { in: MISSION_DEFINITIONS.map((d) => d.key) },
    },
  });
  const completionMap = new Map(
    completions.map((c) => [`${c.missionKey}:${c.periodKey}`, c])
  );

  // Calculer les périodes nécessaires pour les missions volumétriques/giveaway
  const { start: dayStart, end: dayEnd } = startEndForPeriod(
    { period: 'day', key: '', category: 'DAILY', rewardFragments: 0, fragmentType: 'GENERATED_MISSION_DAILY' } as MissionDef,
    now
  );
  const { start: weekStart, end: weekEnd } = startEndForPeriod(
    { period: 'week', key: '', category: 'WEEKLY', rewardFragments: 0, fragmentType: 'GENERATED_MISSION_WEEKLY' } as MissionDef,
    now
  );
  const { start: monthStart, end: monthEnd } = startEndForPeriod(
    { period: 'month', key: '', category: 'MONTHLY', rewardFragments: 0, fragmentType: 'GENERATED_MISSION_MONTHLY' } as MissionDef,
    now
  );

  // Batch des données volumétriques en 3 requêtes parallèles
  const [dayTrades, weekVolume, monthVolume, weekGiveaways, daySells] = await Promise.all([
    prisma.trade.count({ where: { userId, status: 'PAID', updatedAt: { gte: dayStart, lt: dayEnd } } }),
    prisma.trade.aggregate({ where: { userId, status: 'PAID', updatedAt: { gte: weekStart, lt: weekEnd } }, _sum: { grossCents: true } }),
    prisma.trade.aggregate({ where: { userId, status: 'PAID', updatedAt: { gte: monthStart, lt: monthEnd } }, _sum: { grossCents: true } }),
    prisma.giveawayEntry.count({ where: { userId, enteredAt: { gte: weekStart, lt: weekEnd } } }),
    prisma.trade.count({ where: { userId, status: 'PAID', updatedAt: { gte: dayStart, lt: dayEnd } } }),
  ]);

  const weekVolumeCents = weekVolume._sum.grossCents ?? 0;
  const monthVolumeCents = monthVolume._sum.grossCents ?? 0;

  const results = [];

  for (let i = 0; i < MISSION_DEFINITIONS.length; i++) {
    const def = MISSION_DEFINITIONS[i];
    const pKey = periodKeys[i];
    const completed = completionMap.get(`${def.key}:${pKey}`) ?? null;

    // Éligibilité calculée depuis les données batch (pas de requêtes supplémentaires)
    let eligible = false;
    if (!completed) {
      if (def.key === 'DAILY_CLAIM' || def.key === 'DAILY_VISIT' || def.key === 'BONUS_DAILY_SURPRISE') {
        eligible = true;
      } else if (def.key === 'DAILY_SELL_SKIN') {
        eligible = daySells >= 1;
      } else if (def.thresholdCents != null) {
        const vol = def.period === 'week' ? weekVolumeCents : monthVolumeCents;
        eligible = vol >= def.thresholdCents;
      } else if (def.minGiveawayParticipations != null) {
        eligible = weekGiveaways >= def.minGiveawayParticipations;
      } else if (def.period === 'once' && def.category === 'SOCIAL') {
        eligible = true;
      }
    }

    const dateStr = pKey.replace('day:', '');
    const rewardFragments = def.bonusRange
      ? completed
        ? completed.rewardFragments
        : getDailyBonusReward(userId, dateStr, def.bonusRange)
      : def.rewardFragments;

    // Données de progression pour les missions volumétriques
    let progressCurrent: number | undefined;
    let progressTarget: number | undefined;
    if (def.thresholdCents != null) {
      const vol = def.period === 'week' ? weekVolumeCents : monthVolumeCents;
      progressCurrent = vol;
      progressTarget = def.thresholdCents;
    } else if (def.minGiveawayParticipations != null) {
      progressCurrent = weekGiveaways;
      progressTarget = def.minGiveawayParticipations;
    } else if (def.key === 'DAILY_SELL_SKIN') {
      progressCurrent = dayTrades;
      progressTarget = 1;
    }

    results.push({
      ...def,
      rewardFragments,
      periodKey: pKey,
      completed: !!completed,
      eligible,
      progressCurrent,
      progressTarget,
    });
  }

  return results;
}
