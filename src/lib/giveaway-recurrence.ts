import type { GiveawayDurationType, GiveawaySeries, Prisma } from '@prisma/client';
import { prisma } from '~/prisma/prisma';

const RECURRING_FREQUENCIES = new Set<GiveawayDurationType>([
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'YEARLY',
]);

export function isRecurringFrequency(frequency: GiveawayDurationType): boolean {
  return RECURRING_FREQUENCIES.has(frequency);
}

export function computeNextSpawnAt(frequency: GiveawayDurationType, after: Date): Date {
  const next = new Date(after);
  switch (frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + 1);
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setDate(next.getDate() + 7);
  }
  return next;
}

/** Calcule la prochaine date de spawn après un tirage (ancrage = dernier spawn, pas la fin du tirage). */
export function computeNextSpawnAtAfterDraw(
  frequency: GiveawayDurationType,
  lastSpawnAt: Date | null,
  startDate: Date,
  endedAt: Date
): Date {
  const anchor = lastSpawnAt ?? startDate;
  let nextSpawnAt = computeNextSpawnAt(frequency, anchor);
  if (nextSpawnAt <= endedAt) {
    nextSpawnAt = endedAt;
  }
  return nextSpawnAt;
}

export function computeInstanceEndAt(startAt: Date, durationMinutes: number): Date {
  const endAt = new Date(startAt);
  endAt.setMinutes(endAt.getMinutes() + durationMinutes);
  return endAt;
}

export function seriesHasCapacityForInstance(
  series: Pick<GiveawaySeries, 'endDate' | 'durationMinutes'>,
  startAt: Date
): boolean {
  if (!series.endDate) return true;
  if (startAt >= series.endDate) return false;
  return computeInstanceEndAt(startAt, series.durationMinutes) <= series.endDate;
}

export function seriesDataToGiveawayCreate(
  seriesId: string,
  series: Pick<
    GiveawaySeries,
    | 'title'
    | 'description'
    | 'prize'
    | 'prizeImageUrl'
    | 'steamMarketHashName'
    | 'ticketPrice'
    | 'maxTickets'
    | 'durationMinutes'
    | 'frequency'
    | 'winnerCount'
    | 'maxEntriesPerUser'
    | 'rewardValueCents'
    | 'isPrivate'
    | 'requiredAffiliateCode'
  >,
  startDate: Date
): Prisma.GiveawayCreateInput {
  const endDate = computeInstanceEndAt(startDate, series.durationMinutes);

  return {
    title: series.title,
    description: series.description,
    prize: series.prize,
    prizeImageUrl: series.prizeImageUrl,
    steamMarketHashName: series.steamMarketHashName,
    ticketPrice: series.ticketPrice,
    maxTickets: series.maxTickets,
    startDate,
    endDate,
    status: 'ACTIVE',
    durationType: series.frequency,
    winnerCount: series.winnerCount,
    maxEntriesPerUser: series.maxEntriesPerUser,
    rewardValueCents: series.rewardValueCents,
    isPrivate: series.isPrivate,
    requiredAffiliateCode: series.requiredAffiliateCode,
    series: { connect: { id: seriesId } },
  };
}

async function closeStaleSeriesInstances(seriesId: string) {
  const now = new Date();
  const stale = await prisma.giveaway.findMany({
    where: {
      seriesId,
      status: { in: ['ACTIVE', 'PAUSED'] },
      endDate: { lte: now },
    },
    include: { _count: { select: { entries: true } } },
  });

  for (const instance of stale) {
    await prisma.giveaway.update({
      where: { id: instance.id },
      data: { status: instance._count.entries > 0 ? 'ENDED' : 'CANCELLED' },
    });
  }
}

export async function spawnGiveawayFromSeries(seriesId: string, startAt = new Date()) {
  const series = await prisma.giveawaySeries.findUnique({ where: { id: seriesId } });
  if (!series) {
    return { ok: false as const, error: 'Série introuvable' };
  }
  if (series.status !== 'ACTIVE') {
    return { ok: false as const, error: 'Série inactive' };
  }
  if (!isRecurringFrequency(series.frequency)) {
    return { ok: false as const, error: 'Fréquence non récurrente' };
  }

  const now = new Date();
  if (series.startDate > now) {
    return { ok: false as const, error: 'Série pas encore démarrée' };
  }
  if (series.endDate && series.endDate <= now) {
    return { ok: false as const, error: 'Série terminée' };
  }
  if (!seriesHasCapacityForInstance(series, startAt)) {
    return { ok: false as const, error: 'Limite de la série atteinte' };
  }

  await closeStaleSeriesInstances(seriesId);

  const activeInstance = await prisma.giveaway.findFirst({
    where: { seriesId, status: { in: ['ACTIVE', 'PAUSED'] } },
  });
  if (activeInstance) {
    return { ok: false as const, error: 'Instance déjà active', giveawayId: activeInstance.id };
  }

  const giveaway = await prisma.$transaction(async (tx) => {
    const created = await tx.giveaway.create({
      data: seriesDataToGiveawayCreate(seriesId, series, startAt),
    });
    await tx.giveawaySeries.update({
      where: { id: seriesId },
      data: {
        lastSpawnAt: startAt,
        nextSpawnAt: null,
        spawnCount: { increment: 1 },
      },
    });
    return created;
  });

  return { ok: true as const, giveaway };
}

export async function scheduleNextSpawnAfterDraw(seriesId: string, endedAt = new Date()) {
  const series = await prisma.giveawaySeries.findUnique({ where: { id: seriesId } });
  if (!series || series.status !== 'ACTIVE') return null;

  const nextSpawnAt = computeNextSpawnAtAfterDraw(
    series.frequency,
    series.lastSpawnAt,
    series.startDate,
    endedAt
  );

  if (!seriesHasCapacityForInstance(series, nextSpawnAt)) {
    await prisma.giveawaySeries.update({
      where: { id: seriesId },
      data: { nextSpawnAt: null, status: 'DISABLED' },
    });
    return null;
  }

  await prisma.giveawaySeries.update({
    where: { id: seriesId },
    data: { nextSpawnAt },
  });

  if (nextSpawnAt <= new Date()) {
    await spawnGiveawayFromSeries(seriesId, nextSpawnAt);
  }

  return nextSpawnAt;
}

export async function processDueRecurringGiveaways() {
  const now = new Date();
  const dueSeries = await prisma.giveawaySeries.findMany({
    where: {
      status: 'ACTIVE',
      frequency: { in: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] },
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gt: now } }],
      nextSpawnAt: { lte: now },
    },
  });

  const results: { seriesId: string; status: string; giveawayId?: string; error?: string }[] = [];

  for (const series of dueSeries) {
    const spawnAt = series.nextSpawnAt ?? now;
    const spawn = await spawnGiveawayFromSeries(series.id, spawnAt);
    if (spawn.ok) {
      results.push({ seriesId: series.id, status: 'spawned', giveawayId: spawn.giveaway.id });
    } else if (spawn.error === 'Instance déjà active') {
      results.push({ seriesId: series.id, status: 'skipped', giveawayId: spawn.giveawayId });
    } else {
      results.push({ seriesId: series.id, status: 'error', error: spawn.error });
    }
  }

  return { processedCount: dueSeries.length, results };
}

export async function pauseGiveawaySeries(seriesId: string) {
  return prisma.$transaction(async (tx) => {
    const series = await tx.giveawaySeries.update({
      where: { id: seriesId },
      data: { status: 'PAUSED', nextSpawnAt: null },
    });
    await tx.giveaway.updateMany({
      where: { seriesId, status: 'ACTIVE' },
      data: { status: 'PAUSED' },
    });
    return series;
  });
}

export async function resumeGiveawaySeries(seriesId: string) {
  const series = await prisma.giveawaySeries.update({
    where: { id: seriesId },
    data: { status: 'ACTIVE' },
  });

  const pausedInstance = await prisma.giveaway.findFirst({
    where: { seriesId, status: 'PAUSED' },
  });
  if (pausedInstance) {
    await prisma.giveaway.update({
      where: { id: pausedInstance.id },
      data: { status: 'ACTIVE' },
    });
    return { series, resumedGiveawayId: pausedInstance.id };
  }

  const spawn = await spawnGiveawayFromSeries(seriesId);
  return { series, spawnedGiveawayId: spawn.ok ? spawn.giveaway.id : undefined };
}

export async function disableGiveawaySeries(seriesId: string) {
  return prisma.$transaction(async (tx) => {
    const series = await tx.giveawaySeries.update({
      where: { id: seriesId },
      data: { status: 'DISABLED', nextSpawnAt: null },
    });
    await tx.giveaway.updateMany({
      where: { seriesId, status: { in: ['ACTIVE', 'PAUSED'] } },
      data: { status: 'DISABLED' },
    });
    return series;
  });
}

export async function restartGiveawaySeries(seriesId: string) {
  const series = await prisma.giveawaySeries.findUnique({ where: { id: seriesId } });
  if (!series) {
    return { ok: false as const, error: 'Série introuvable' };
  }

  await closeStaleSeriesInstances(seriesId);

  await prisma.giveawaySeries.update({
    where: { id: seriesId },
    data: { status: 'ACTIVE', nextSpawnAt: null },
  });

  return spawnGiveawayFromSeries(seriesId);
}
