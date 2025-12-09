import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../prisma/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    // Récupérer toutes les participations de l'utilisateur avec les détails du giveaway
    const entries = await prisma.giveawayEntry.findMany({
      where: {
        userId
      },
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
            createdAt: true,
            updatedAt: true
          }
        }
      },
      orderBy: {
        enteredAt: 'desc'
      }
    });

    // Enrichir les données avec le statut de participation
    const enrichedEntries = entries.map(entry => {
      let participationStatus: 'in_progress' | 'won' | 'lost';
      
      if (entry.giveaway.status === 'ACTIVE' || !entry.giveaway.winnerId) {
        participationStatus = 'in_progress';
      } else if (entry.giveaway.winnerId === userId) {
        participationStatus = 'won';
      } else {
        participationStatus = 'lost';
      }

      return {
        ...entry,
        participationStatus
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedEntries
    });

  } catch (error) {
    console.error('Erreur récupération participations:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

