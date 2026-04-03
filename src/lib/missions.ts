import { format, getISOWeek, getISOWeekYear } from 'date-fns';
import type { FragmentTransactionType, Prisma } from '@prisma/client';
import { prisma } from '../../prisma/prisma';

export type MissionCategory = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SOCIAL';

export interface MissionDef {
  key: string;
  category: MissionCategory;
  rewardFragments: number;
  fragmentType: FragmentTransactionType;
  /** day | week | month | once */
  period: 'day' | 'week' | 'month' | 'once';
  thresholdCents?: number;
  minGiveawayParticipations?: number;
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
  if (!def) return { ok: false, error: 'Mission inconnue' };

  const pKey = periodKeyFor(def);
  const existing = await prisma.userMissionCompletion.findUnique({
    where: {
      userId_missionKey_periodKey: { userId, missionKey, periodKey: pKey },
    },
  });
  if (existing) return { ok: false, error: 'Déjà réclamée pour cette période' };

  const eligible = await isMissionEligible(userId, def);
  if (!eligible) return { ok: false, error: "Conditions non remplies" };

  const meta: Prisma.InputJsonValue = { missionKey: def.key, periodKey: pKey };

  await prisma.$transaction(async (tx) => {
    await tx.userMissionCompletion.create({
      data: {
        userId,
        missionKey,
        periodKey: pKey,
        rewardFragments: def.rewardFragments,
      },
    });
    await tx.fragmentTransaction.create({
      data: {
        userId,
        type: def.fragmentType,
        amount: def.rewardFragments,
        reason: `Mission ${def.key}`,
        metadata: meta,
      },
    });
    await tx.user.update({
      where: { id: userId },
      data: { fragments: { increment: def.rewardFragments } },
    });
  });

  return { ok: true, fragments: def.rewardFragments };
}

export async function listMissionsForUser(userId: string) {
  const now = new Date();
  const results = [];

  for (const def of MISSION_DEFINITIONS) {
    const pKey = periodKeyFor(def, now);
    const completed = await prisma.userMissionCompletion.findUnique({
      where: {
        userId_missionKey_periodKey: { userId, missionKey: def.key, periodKey: pKey },
      },
    });
    const eligible = completed ? false : await isMissionEligible(userId, def, now);
    results.push({
      ...def,
      periodKey: pKey,
      completed: !!completed,
      eligible: !!eligible,
    });
  }

  return results;
}
