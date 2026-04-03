import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { GiveawayDurationType, GiveawayStatus } from '@prisma/client';
import { auth } from '~/lib/auth';
import { enrichGiveawayForViewer } from '@/lib/giveaway-public';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as GiveawayStatus | null;

    const where = status ? { status } : {};

    const session = await auth.api.getSession({ headers: request.headers });
    const viewerId = session?.user?.id ?? null;

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
              },
            },
          },
        },
        winners: {
          select: { userId: true, rank: true },
          orderBy: { rank: 'asc' },
        },
      },
      orderBy: [{ status: 'asc' }, { endDate: 'asc' }],
    });

    return NextResponse.json(giveaways.map((g) => enrichGiveawayForViewer(g, viewerId)));
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
    const {
      title,
      description,
      prize,
      prizeImageUrl,
      steamMarketHashName,
      ticketPrice,
      maxTickets,
      endDate,
      rewardValueCents,
      durationType,
      winnerCount,
      maxEntriesPerUser,
    } = body;

    if (!title || !description || !prize || !ticketPrice || !maxTickets || !endDate) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    if (ticketPrice <= 0 || maxTickets <= 0) {
      return NextResponse.json(
        { error: 'Le coût en fragments et le nombre maximum d’entrées doivent être positifs' },
        { status: 400 }
      );
    }

    const allowed = Object.values(GiveawayDurationType) as string[];
    const dType =
      typeof durationType === 'string' && allowed.includes(durationType)
        ? (durationType as GiveawayDurationType)
        : GiveawayDurationType.CUSTOM;

    const giveaway = await prisma.giveaway.create({
      data: {
        title,
        description,
        prize,
        prizeImageUrl: prizeImageUrl ?? null,
        steamMarketHashName: steamMarketHashName ?? null,
        ticketPrice,
        maxTickets,
        endDate: new Date(endDate),
        status: 'ACTIVE',
        rewardValueCents:
          typeof rewardValueCents === 'number' && rewardValueCents >= 0 ? Math.floor(rewardValueCents) : 0,
        durationType: dType,
        winnerCount: typeof winnerCount === 'number' && winnerCount >= 1 ? Math.floor(winnerCount) : 1,
        maxEntriesPerUser:
          typeof maxEntriesPerUser === 'number' && maxEntriesPerUser >= 1
            ? Math.floor(maxEntriesPerUser)
            : null,
      },
    });

    return NextResponse.json(giveaway, { status: 201 });
  } catch (error) {
    console.error('Error creating giveaway:', error);
    return NextResponse.json({ error: 'Erreur lors de la création du giveaway' }, { status: 500 });
  }
}
