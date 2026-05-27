import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

export async function GET(request: NextRequest) {
  const session = await requireAdminSessionWithDbCheck(request);
  if (!session) {
    return NextResponse.json({ error: 'Accès refusé — admin requis' }, { status: 403 });
  }

  const giveaways = await prisma.giveaway.findMany({
    include: {
      _count: { select: { entries: true } },
      entries: {
        include: {
          user: {
            select: { id: true, steamUsername: true, steamAvatar: true },
          },
        },
      },
      winners: {
        orderBy: { rank: 'asc' },
      },
    },
    orderBy: [{ status: 'asc' }, { endDate: 'asc' }],
  });

  // Fetch user details (including tradeLink) for all winners in a single batch
  const winnerUserIds = [
    ...new Set(giveaways.flatMap((g) => g.winners.map((w) => w.userId))),
  ];
  const winnerUsers =
    winnerUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: winnerUserIds } },
          select: {
            id: true,
            steamUsername: true,
            steamAvatar: true,
            tradeLink: true,
          },
        })
      : [];
  const userMap = new Map(winnerUsers.map((u) => [u.id, u]));

  const result = giveaways.map((g) => ({
    ...g,
    winners: g.winners.map((w) => ({
      ...w,
      user: userMap.get(w.userId) ?? null,
    })),
  }));

  return NextResponse.json(result);
}
