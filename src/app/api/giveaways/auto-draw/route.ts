import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { executeGiveawayDraw } from '@/lib/execute-giveaway-draw';

export async function POST(request: NextRequest) {
  try {
    const now = new Date();

    const expiredGiveaways = await prisma.giveaway.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { lte: now },
      },
      include: {
        entries: true,
        winners: true,
      },
    });

    const results: unknown[] = [];

    for (const giveaway of expiredGiveaways) {
      try {
        if (giveaway.entries.length === 0) {
          await prisma.giveaway.update({
            where: { id: giveaway.id },
            data: { status: 'CANCELLED' },
          });
          results.push({
            giveawayId: giveaway.id,
            status: 'cancelled',
            reason: 'Aucun participant',
          });
          continue;
        }

        const draw = await executeGiveawayDraw(giveaway.id);
        if (!draw.ok) {
          results.push({ giveawayId: giveaway.id, status: 'error', error: draw.error });
          continue;
        }

        results.push({
          giveawayId: giveaway.id,
          status: 'drawn',
          winnerIds: draw.winners.map((w) => w.userId),
          winners: draw.winners,
          totalParticipants: draw.totalParticipants,
          totalEntries: draw.totalEntries,
          randomSeed: draw.randomSeed,
        });
      } catch (error) {
        console.error(`Error drawing giveaway ${giveaway.id}:`, error);
        results.push({
          giveawayId: giveaway.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      processedCount: expiredGiveaways.length,
      results,
    });
  } catch (error) {
    console.error('Error in auto-draw:', error);
    return NextResponse.json({ error: 'Erreur lors du tirage automatique' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const now = new Date();

    const expiredGiveaways = await prisma.giveaway.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { lte: now },
      },
      select: {
        id: true,
        title: true,
        endDate: true,
        soldTickets: true,
      },
    });

    return NextResponse.json({
      count: expiredGiveaways.length,
      giveaways: expiredGiveaways,
    });
  } catch (error) {
    console.error('Error checking expired giveaways:', error);
    return NextResponse.json({ error: 'Erreur lors de la vérification' }, { status: 500 });
  }
}
