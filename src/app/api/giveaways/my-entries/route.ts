import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../prisma/prisma';
import { auth } from '~/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const entries = await prisma.giveawayEntry.findMany({
      where: { userId },
      include: {
        giveaway: {
          select: {
            id: true,
            title: true,
            description: true,
            prize: true,
            ticketPrice: true,
            maxTickets: true,
            soldTickets: true,
            endDate: true,
            status: true,
            winnerId: true,
            randomSeed: true,
            rewardValueCents: true,
            durationType: true,
            winnerCount: true,
            maxEntriesPerUser: true,
            createdAt: true,
            updatedAt: true,
            winners: { select: { userId: true, rank: true } },
          },
        },
      },
      orderBy: { enteredAt: 'desc' },
    });

    const enrichedEntries = entries.map((entry) => {
      const g = entry.giveaway;
      let participationStatus: 'in_progress' | 'won' | 'lost';

      if (g.status === 'ACTIVE') {
        participationStatus = 'in_progress';
      } else {
        const won =
          g.winnerId === userId || g.winners.some((w) => w.userId === userId);
        participationStatus = won ? 'won' : 'lost';
      }

      return {
        ...entry,
        participationStatus,
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedEntries,
    });
  } catch (error) {
    console.error('Erreur récupération participations:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
