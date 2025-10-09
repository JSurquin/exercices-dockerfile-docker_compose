import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Vérifier les giveaways qui doivent être tirés
    const now = new Date();
    
    // Chercher les giveaways actifs dont la date de fin est passée
    const expiredGiveaways = await prisma.giveaway.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: now
        }
      },
      include: {
        entries: {
          include: {
            user: {
              select: {
                id: true,
                steamUsername: true,
                steamAvatar: true,
              }
            }
          }
        }
      }
    });

    const results = [];

    for (const giveaway of expiredGiveaways) {
      try {
        if (giveaway.entries.length === 0) {
          // Pas de participants - marquer comme annulé
          await prisma.giveaway.update({
            where: { id: giveaway.id },
            data: { status: 'CANCELLED' }
          });
          
          results.push({
            giveawayId: giveaway.id,
            status: 'cancelled',
            reason: 'Aucun participant'
          });
          continue;
        }

        // Créer une liste pondérée des participants
        const weightedEntries: string[] = [];
        giveaway.entries.forEach(entry => {
          for (let i = 0; i < entry.ticketsUsed; i++) {
            weightedEntries.push(entry.userId);
          }
        });

        // Générer un seed aléatoire pour le tirage
        const randomSeed = crypto.randomBytes(32).toString('hex');
        
        // Utiliser le seed pour générer un index déterministe
        const hash = crypto.createHash('sha256').update(randomSeed).digest('hex');
        const randomIndex = parseInt(hash.substring(0, 8), 16) % weightedEntries.length;
        const winnerId = weightedEntries[randomIndex];

        // Mettre à jour le giveaway avec le gagnant
        const updatedGiveaway = await prisma.giveaway.update({
          where: { id: giveaway.id },
          data: {
            status: 'ENDED',
            winnerId,
            randomSeed
          }
        });

        const winner = giveaway.entries.find(entry => entry.userId === winnerId);

        results.push({
          giveawayId: giveaway.id,
          status: 'drawn',
          winnerId,
          winner: winner?.user,
          totalParticipants: giveaway.entries.length,
          totalTickets: weightedEntries.length,
          randomSeed
        });

      } catch (error) {
        console.error(`Error drawing giveaway ${giveaway.id}:`, error);
        results.push({
          giveawayId: giveaway.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      processedCount: expiredGiveaways.length,
      results
    });

  } catch (error) {
    console.error('Error in auto-draw:', error);
    return NextResponse.json(
      { error: 'Erreur lors du tirage automatique' },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour vérifier si un giveaway doit être tiré automatiquement
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    
    const expiredGiveaways = await prisma.giveaway.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: now
        }
      },
      select: {
        id: true,
        title: true,
        endDate: true,
        soldTickets: true
      }
    });

    return NextResponse.json({
      count: expiredGiveaways.length,
      giveaways: expiredGiveaways
    });

  } catch (error) {
    console.error('Error checking expired giveaways:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}