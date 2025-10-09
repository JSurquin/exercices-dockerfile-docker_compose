import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { userId, ticketsUsed } = body;

    // Validation des données
    if (!userId || !ticketsUsed || ticketsUsed <= 0) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }

    // Vérifier que le giveaway existe et est actif
    const giveaway = await prisma.giveaway.findUnique({
      where: { id }
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

    if (new Date() > giveaway.endDate) {
      return NextResponse.json(
        { error: 'Ce giveaway est terminé' },
        { status: 400 }
      );
    }

    // Vérifier qu'il reste des places
    if (giveaway.soldTickets + ticketsUsed > giveaway.maxTickets) {
      return NextResponse.json(
        { error: 'Pas assez de places disponibles' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur a assez de tickets
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    if (user.tickets < ticketsUsed) {
      return NextResponse.json(
        { error: 'Pas assez de tickets disponibles' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur a déjà participé
    const existingEntry = await prisma.giveawayEntry.findUnique({
      where: {
        userId_giveawayId: {
          userId,
          giveawayId: id
        }
      }
    });

    // Transaction pour assurer la cohérence
    const result = await prisma.$transaction(async (tx) => {
      // Créer ou mettre à jour l'entrée
      let entry;
      if (existingEntry) {
        // Mettre à jour l'entrée existante
        entry = await tx.giveawayEntry.update({
          where: {
            userId_giveawayId: {
              userId,
              giveawayId: id
            }
          },
          data: {
            ticketsUsed: existingEntry.ticketsUsed + ticketsUsed
          }
        });
      } else {
        // Créer une nouvelle entrée
        entry = await tx.giveawayEntry.create({
          data: {
            userId,
            giveawayId: id,
            ticketsUsed
          }
        });
      }

      // Déduire les tickets de l'utilisateur
      await tx.user.update({
        where: { id: userId },
        data: {
          tickets: {
            decrement: ticketsUsed
          }
        }
      });

      // Mettre à jour le nombre de tickets vendus
      await tx.giveaway.update({
        where: { id },
        data: {
          soldTickets: {
            increment: ticketsUsed
          }
        }
      });

      return entry;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error participating in giveaway:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la participation' },
      { status: 500 }
    );
  }
}