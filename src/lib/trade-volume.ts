import { TradeStatus } from '@prisma/client';
import { prisma } from '../../prisma/prisma';

/** Trades complétés et crédités — seule source de vérité pour le volume utilisateur. */
export const CREDITED_TRADE_STATUSES: TradeStatus[] = [
  'AVAILABLE',
  'PAYOUT_PENDING',
  'PAID',
];

export async function sumCreditedTradeVolumeCents(userId: string): Promise<number> {
  const result = await prisma.trade.aggregate({
    where: {
      userId,
      status: { in: CREDITED_TRADE_STATUSES },
    },
    _sum: { grossCents: true },
  });
  return result._sum.grossCents ?? 0;
}

export async function recalculateAllUserVolumes(options?: {
  dryRun?: boolean;
  userId?: string;
}): Promise<{ updated: number; corrections: Array<{ userId: string; before: number; after: number }> }> {
  const dryRun = options?.dryRun ?? false;
  const corrections: Array<{ userId: string; before: number; after: number }> = [];

  const volumeRows = await prisma.trade.groupBy({
    by: ['userId'],
    where: {
      status: { in: CREDITED_TRADE_STATUSES },
      ...(options?.userId ? { userId: options.userId } : {}),
    },
    _sum: { grossCents: true },
  });

  const volumeMap = new Map(
    volumeRows.map((row) => [row.userId, row._sum.grossCents ?? 0]),
  );

  const users = await prisma.user.findMany({
    where: options?.userId ? { id: options.userId } : undefined,
    select: { id: true, totalVolumeCents: true },
  });

  for (const user of users) {
    const expected = volumeMap.get(user.id) ?? 0;
    if (user.totalVolumeCents === expected) continue;

    corrections.push({
      userId: user.id,
      before: user.totalVolumeCents,
      after: expected,
    });

    if (!dryRun) {
      await prisma.user.update({
        where: { id: user.id },
        data: { totalVolumeCents: expected },
      });
    }
  }

  return { updated: corrections.length, corrections };
}
