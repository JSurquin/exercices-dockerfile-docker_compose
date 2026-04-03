import { prisma } from '../../prisma/prisma';
import type { Prisma } from '@prisma/client';

export interface PointsConfig {
  // Points gagnés par euro de vente (ex: 100 = 100 pts par €)
  pointsPerEuro: number;
  // Tickets gagnés par euro de vente (ex: 0.1 = 1 ticket par 10€)
  ticketsPerEuro: number;
  // Points pour la connexion quotidienne
  dailyLoginPoints: number;
  // Tickets pour la connexion quotidienne
  dailyLoginTickets: number;
  // Multiplicateur de streak (ex: 1.5 = +50% par jour consécutif, max streakMaxMultiplier)
  streakMultiplier: number;
  // Streak max pour le multiplicateur
  streakMaxDays: number;
  // Points bonus niveau supérieur
  levelUpBonusPoints: number;
  // Fragments gagnés par euro de vente (ex: 0.2 = 200 fragments pour 1000€)
  fragmentsPerEuro: number;
}

const POINTS_CONFIG_KEY = 'points_config';
const GIVEAWAYS_ENABLED_KEY = 'giveaways_enabled';

export const DEFAULT_POINTS_CONFIG: PointsConfig = {
  pointsPerEuro: 100,
  ticketsPerEuro: 0.1,
  dailyLoginPoints: 50,
  dailyLoginTickets: 0,
  streakMultiplier: 1.1,
  streakMaxDays: 7,
  levelUpBonusPoints: 500,
  fragmentsPerEuro: 0.2,
};

export async function getPointsConfig(): Promise<PointsConfig> {
  const row = await prisma.siteSettings.findUnique({
    where: { key: POINTS_CONFIG_KEY },
  });
  if (!row?.valueJson || typeof row.valueJson !== 'object') {
    return DEFAULT_POINTS_CONFIG;
  }
  const v = row.valueJson as Record<string, unknown>;
  return {
    pointsPerEuro: typeof v.pointsPerEuro === 'number' ? v.pointsPerEuro : DEFAULT_POINTS_CONFIG.pointsPerEuro,
    ticketsPerEuro: typeof v.ticketsPerEuro === 'number' ? v.ticketsPerEuro : DEFAULT_POINTS_CONFIG.ticketsPerEuro,
    dailyLoginPoints: typeof v.dailyLoginPoints === 'number' ? v.dailyLoginPoints : DEFAULT_POINTS_CONFIG.dailyLoginPoints,
    dailyLoginTickets: typeof v.dailyLoginTickets === 'number' ? v.dailyLoginTickets : DEFAULT_POINTS_CONFIG.dailyLoginTickets,
    streakMultiplier: typeof v.streakMultiplier === 'number' ? v.streakMultiplier : DEFAULT_POINTS_CONFIG.streakMultiplier,
    streakMaxDays: typeof v.streakMaxDays === 'number' ? v.streakMaxDays : DEFAULT_POINTS_CONFIG.streakMaxDays,
    levelUpBonusPoints: typeof v.levelUpBonusPoints === 'number' ? v.levelUpBonusPoints : DEFAULT_POINTS_CONFIG.levelUpBonusPoints,
    fragmentsPerEuro: typeof v.fragmentsPerEuro === 'number' ? v.fragmentsPerEuro : DEFAULT_POINTS_CONFIG.fragmentsPerEuro,
  };
}

export async function setPointsConfig(
  config: Partial<PointsConfig>,
  updatedBy?: string
): Promise<PointsConfig> {
  const current = await getPointsConfig();
  const next: PointsConfig = { ...current, ...config };
  const valueJson = next as unknown as Prisma.InputJsonValue;
  await prisma.siteSettings.upsert({
    where: { key: POINTS_CONFIG_KEY },
    create: { key: POINTS_CONFIG_KEY, valueJson, updatedBy: updatedBy ?? null },
    update: { valueJson, updatedBy: updatedBy ?? null },
  });
  return next;
}

export async function getGiveawaysEnabled(): Promise<boolean> {
  const row = await prisma.siteSettings.findUnique({
    where: { key: GIVEAWAYS_ENABLED_KEY },
  });
  if (!row?.valueJson || typeof row.valueJson !== 'object') return true;
  const v = row.valueJson as Record<string, unknown>;
  return typeof v.enabled === 'boolean' ? v.enabled : true;
}

export async function setGiveawaysEnabled(enabled: boolean, updatedBy?: string): Promise<boolean> {
  const valueJson = { enabled } as unknown as Prisma.InputJsonValue;
  await prisma.siteSettings.upsert({
    where: { key: GIVEAWAYS_ENABLED_KEY },
    create: { key: GIVEAWAYS_ENABLED_KEY, valueJson, updatedBy: updatedBy ?? null },
    update: { valueJson, updatedBy: updatedBy ?? null },
  });
  return enabled;
}

/**
 * Attribution de points et tickets lors d'une vente réussie.
 * Appelé depuis TradeHooks.onTradeAccepted.
 */
export async function awardTradePoints(
  userId: string,
  tradeId: string,
  grossCents: number
): Promise<{ points: number; tickets: number; fragments: number }> {
  const config = await getPointsConfig();
  const euros = grossCents / 100;
  const points = Math.floor(euros * config.pointsPerEuro);
  const tickets = Math.floor(euros * config.ticketsPerEuro);
  const fragments = Math.floor(euros * config.fragmentsPerEuro);

  await prisma.$transaction(async (tx) => {
    await tx.pointTransaction.create({
      data: {
        userId,
        type: 'TRADE_SALE',
        points,
        tickets,
        reason: `Vente de skins CS2 (${euros.toFixed(2)}€)`,
        metadata: { tradeId, grossCents },
      },
    });
    if (fragments > 0) {
      await tx.fragmentTransaction.create({
        data: {
          userId,
          type: 'GENERATED_SALE',
          amount: fragments,
          reason: `Fragments vente (${euros.toFixed(2)}€)`,
          metadata: { tradeId, grossCents } as Prisma.InputJsonValue,
        },
      });
    }
    await tx.user.update({
      where: { id: userId },
      data: {
        xp: { increment: points },
        tickets: { increment: tickets },
        ...(fragments > 0 ? { fragments: { increment: fragments } } : {}),
      },
    });
  });

  return { points, tickets, fragments };
}

/**
 * Bonus de connexion quotidienne avec système de streak.
 * Retourne null si le bonus a déjà été réclamé aujourd'hui.
 */
export async function claimDailyLogin(
  userId: string
): Promise<{ points: number; tickets: number; streak: number } | null> {
  const config = await getPointsConfig();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.dailyLogin.findUnique({
    where: { userId_loginDate: { userId, loginDate: today } },
  });

  if (existing) return null;

  // Calculer le streak
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayLogin = await prisma.dailyLogin.findUnique({
    where: { userId_loginDate: { userId, loginDate: yesterday } },
  });

  const streak = yesterdayLogin ? yesterdayLogin.streak + 1 : 1;

  // Multiplicateur de streak (plafonné)
  const effectiveStreak = Math.min(streak, config.streakMaxDays);
  const multiplier = 1 + (effectiveStreak - 1) * (config.streakMultiplier - 1);
  const points = Math.round(config.dailyLoginPoints * multiplier);
  const tickets = config.dailyLoginTickets;

  await prisma.$transaction(async (tx) => {
    await tx.dailyLogin.create({
      data: { userId, loginDate: today, streak },
    });
    await tx.pointTransaction.create({
      data: {
        userId,
        type: 'DAILY_LOGIN',
        points,
        tickets,
        reason: `Connexion quotidienne (Jour ${streak})`,
        metadata: { streak, multiplier },
      },
    });
    await tx.user.update({
      where: { id: userId },
      data: {
        xp: { increment: points },
        tickets: { increment: tickets },
      },
    });
  });

  return { points, tickets, streak };
}

/**
 * Métriques du système de points pour l'admin.
 */
export async function getPointsMetrics() {
  const [
    totalPointsDistributed,
    totalTicketsDistributed,
    tradePointsTotal,
    dailyLoginPointsTotal,
    topUsers,
    recentTransactions,
    byType,
    dailyLoginStreak,
  ] = await Promise.all([
    prisma.pointTransaction.aggregate({ _sum: { points: true } }),
    prisma.pointTransaction.aggregate({ _sum: { tickets: true } }),
    prisma.pointTransaction.aggregate({
      where: { type: 'TRADE_SALE' },
      _sum: { points: true, tickets: true },
      _count: true,
    }),
    prisma.pointTransaction.aggregate({
      where: { type: 'DAILY_LOGIN' },
      _sum: { points: true },
      _count: true,
    }),
    prisma.user.findMany({
      take: 10,
      orderBy: { xp: 'desc' },
      select: {
        id: true,
        steamUsername: true,
        steamAvatar: true,
        xp: true,
        tickets: true,
        level: true,
      },
    }),
    prisma.pointTransaction.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, steamUsername: true, steamAvatar: true },
        },
      },
    }),
    prisma.pointTransaction.groupBy({
      by: ['type'],
      _sum: { points: true, tickets: true },
      _count: true,
    }),
    prisma.dailyLogin.aggregate({
      _max: { streak: true },
      _avg: { streak: true },
    }),
  ]);

  return {
    totals: {
      points: totalPointsDistributed._sum.points ?? 0,
      tickets: totalTicketsDistributed._sum.tickets ?? 0,
    },
    bySource: {
      tradeSale: {
        points: tradePointsTotal._sum.points ?? 0,
        tickets: tradePointsTotal._sum.tickets ?? 0,
        count: tradePointsTotal._count,
      },
      dailyLogin: {
        points: dailyLoginPointsTotal._sum.points ?? 0,
        count: dailyLoginPointsTotal._count,
      },
    },
    byType,
    topUsers,
    recentTransactions,
    streakStats: {
      maxStreak: dailyLoginStreak._max.streak ?? 0,
      avgStreak: Math.round((dailyLoginStreak._avg.streak ?? 0) * 10) / 10,
    },
  };
}
