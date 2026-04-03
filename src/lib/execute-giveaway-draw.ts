import { prisma } from '../../prisma/prisma';
import { pickWeightedUniqueWinners, generateGiveawayRandomSeed } from '@/lib/giveaway-draw';

export async function executeGiveawayDraw(giveawayId: string) {
  const giveaway = await prisma.giveaway.findUnique({
    where: { id: giveawayId },
    include: {
      entries: true,
      winners: true,
    },
  });

  if (!giveaway) return { ok: false as const, error: 'Giveaway introuvable' };
  if (giveaway.status !== 'ACTIVE') return { ok: false as const, error: "Ce giveaway n'est plus actif" };
  if (giveaway.entries.length === 0) return { ok: false as const, error: 'Aucune participation' };
  if (giveaway.winners.length > 0) return { ok: false as const, error: 'Tirage déjà effectué' };

  const weights = giveaway.entries.map((e) => ({ userId: e.userId, entries: e.ticketsUsed }));
  const randomSeed = generateGiveawayRandomSeed();
  const want = Math.max(1, giveaway.winnerCount);
  const winnerIds = pickWeightedUniqueWinners(weights, want, randomSeed);

  const updated = await prisma.$transaction(async (tx) => {
    for (let i = 0; i < winnerIds.length; i++) {
      await tx.giveawayWinner.create({
        data: {
          giveawayId,
          userId: winnerIds[i],
          rank: i + 1,
        },
      });
    }
    return tx.giveaway.update({
      where: { id: giveawayId },
      data: {
        status: 'ENDED',
        winnerId: winnerIds[0] ?? null,
        randomSeed,
      },
      include: {
        entries: {
          include: {
            user: {
              select: { id: true, steamUsername: true, steamAvatar: true },
            },
          },
        },
        winners: true,
      },
    });
  });

  const users = await prisma.user.findMany({
    where: { id: { in: winnerIds } },
    select: { id: true, steamUsername: true, steamAvatar: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return {
    ok: true as const,
    giveaway: updated,
    winners: winnerIds.map((id, idx) => ({
      userId: id,
      rank: idx + 1,
      user: userMap.get(id),
    })),
    totalParticipants: giveaway.entries.length,
    totalEntries: giveaway.soldTickets,
    randomSeed,
  };
}
