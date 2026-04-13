import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { GiveawayDurationType, GiveawayStatus } from '@prisma/client';
import { auth } from '~/lib/auth';
import { enrichGiveawayForViewer } from '@/lib/giveaway-public';
import { getPointsConfig } from '@/lib/points-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as GiveawayStatus | null;

    const session = await auth.api.getSession({ headers: request.headers });
    const viewerId = session?.user?.id ?? null;

    // Lire le code affilié depuis le cookie ou le query param
    const cookieHeader = request.headers.get('cookie') ?? '';
    const affiliateCookie = cookieHeader
      .split(';')
      .find((c) => c.trim().startsWith('ctf_affiliate_ref='))
      ?.split('=')[1]
      ?.trim();
    const affiliateRef = searchParams.get('ref') ?? affiliateCookie ?? null;

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

    // Filtrer les giveaways privés : visibles uniquement si le code affilié correspond
    const visible = giveaways.filter((g) => {
      if (!g.isPrivate) return true;
      if (!g.requiredAffiliateCode) return true;
      return affiliateRef === g.requiredAffiliateCode;
    });

    return NextResponse.json(visible.map((g) => enrichGiveawayForViewer(g, viewerId)));
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
    const session = await auth.api.getSession({ headers: request.headers });
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé — admin requis' }, { status: 403 });
    }

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
      isPrivate,
      requiredAffiliateCode,
    } = body;

    if (!title || !description || !prize || !maxTickets || !endDate) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    const allowed = Object.values(GiveawayDurationType) as string[];
    const dType =
      typeof durationType === 'string' && allowed.includes(durationType)
        ? (durationType as GiveawayDurationType)
        : GiveawayDurationType.CUSTOM;

    // Coût d'entrée : priorité au champ fourni, sinon valeur par défaut selon durationType
    const config = await getPointsConfig();
    const resolvedTicketPrice =
      typeof ticketPrice === 'number' && ticketPrice > 0
        ? ticketPrice
        : config.giveawayCosts[dType] ?? config.giveawayCosts.CUSTOM;

    if (resolvedTicketPrice <= 0 || maxTickets <= 0) {
      return NextResponse.json(
        { error: "Le coût en fragments et le nombre maximum d'entrées doivent être positifs" },
        { status: 400 }
      );
    }

    const giveaway = await prisma.giveaway.create({
      data: {
        title,
        description,
        prize,
        prizeImageUrl: prizeImageUrl ?? null,
        steamMarketHashName: steamMarketHashName ?? null,
        ticketPrice: resolvedTicketPrice,
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
        isPrivate: isPrivate === true,
        requiredAffiliateCode: isPrivate && typeof requiredAffiliateCode === 'string' && requiredAffiliateCode.trim()
          ? requiredAffiliateCode.trim()
          : null,
      },
    });

    return NextResponse.json(giveaway, { status: 201 });
  } catch (error) {
    console.error('Error creating giveaway:', error);
    return NextResponse.json({ error: 'Erreur lors de la création du giveaway' }, { status: 500 });
  }
}
