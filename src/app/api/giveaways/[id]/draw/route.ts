import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import crypto from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Vérifier que le giveaway existe et peut être tiré
    const giveaway = await prisma.giveaway.findUnique({
      where: { id },
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

    if (!giveaway) {
      return NextResponse.json(
        { error: 'Giveaway introuvable' },
        { status: 404 }
      );
    }

    if (giveaway.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Ce giveaway n\'est plus actif' },
        { status: 400 }
      );
    }

    if (giveaway.entries.length === 0) {
      return NextResponse.json(
        { error: 'Aucune participation pour ce giveaway' },
        { status: 400 }
      );
    }

    // Créer une liste pondérée des participants
    const weightedEntries: string[] = [];
    giveaway.entries.forEach(entry => {
      // Chaque ticket utilisé = une chance de gagner
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
      where: { id },
      data: {
        status: 'ENDED',
        winnerId,
        randomSeed
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

    // Retourner les résultats du tirage
    const winner = updatedGiveaway.entries.find(entry => entry.userId === winnerId);
    
    return NextResponse.json({
      giveaway: updatedGiveaway,
      winner: winner?.user,
      totalParticipants: giveaway.entries.length,
      totalTickets: weightedEntries.length,
      randomSeed
    });
  } catch (error) {
    console.error('Error drawing giveaway:', error);
    return NextResponse.json(
      { error: 'Erreur lors du tirage' },
      { status: 500 }
    );
  }
}