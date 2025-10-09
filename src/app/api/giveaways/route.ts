import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { GiveawayStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as GiveawayStatus | null;

    const where = status ? { status } : {};

    const giveaways = await prisma.giveaway.findMany({
      where,
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
      },
      orderBy: [
        { status: 'asc' }, // ACTIVE en premier
        { endDate: 'asc' }
      ]
    });

    return NextResponse.json(giveaways);
  } catch (error) {
    console.error('Error fetching giveaways:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des giveaways' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, prize, ticketPrice, maxTickets, endDate } = body;

    // Validation des données
    if (!title || !description || !prize || !ticketPrice || !maxTickets || !endDate) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    if (ticketPrice <= 0 || maxTickets <= 0) {
      return NextResponse.json(
        { error: 'Le prix des tickets et le nombre maximum doivent être positifs' },
        { status: 400 }
      );
    }

    const giveaway = await prisma.giveaway.create({
      data: {
        title,
        description,
        prize,
        ticketPrice,
        maxTickets,
        endDate: new Date(endDate),
        status: 'ACTIVE'
      }
    });

    return NextResponse.json(giveaway, { status: 201 });
  } catch (error) {
    console.error('Error creating giveaway:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du giveaway' },
      { status: 500 }
    );
  }
}