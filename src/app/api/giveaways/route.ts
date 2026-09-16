import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '~/prisma/prisma';
import { GiveawayDurationType } from '@prisma/client';
import { enrichGiveawayForViewer, GIVEAWAY_PUBLIC_ENTRY_INCLUDE, redactGiveawayForPublic } from '@/lib/giveaway-public';
import { withPublicWinnerProfiles } from '@/lib/giveaway-winners-public';
import {
  buildGiveawayVisibilityOr,
  checkPrivateGiveawayParticipation,
  loadGiveawayParticipationEligibility,
} from '@/lib/giveaway-private-access';
import { resolveGiveawayViewerContext } from '@/lib/giveaway-viewer-context';
import { getPointsConfig } from '@/lib/points-service';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { processDueRecurringGiveaways } from '@/lib/giveaway-recurrence';
import { safeParseJson, safeParseSearchParams } from '@/lib/validation/helpers';
import {
  giveawayCreateBodySchema,
  giveawaysPublicListQuerySchema,
} from '@/lib/validation/schemas/integrations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsedQ = safeParseSearchParams(searchParams, giveawaysPublicListQuerySchema);
    if (!parsedQ.ok) {
      return parsedQ.response;
    }
    const status = parsedQ.data.status ?? null;

    const { viewerUserId: viewerId, affiliateRef, viewerIsAdmin } =
      await resolveGiveawayViewerContext(request);

    try {
      await processDueRecurringGiveaways();
    } catch (recurrenceError) {
      console.error('Error spawning due recurring giveaways:', recurrenceError);
    }

    const accessOr = buildGiveawayVisibilityOr(affiliateRef, viewerId, viewerIsAdmin);
    const where: Prisma.GiveawayWhereInput = {
      AND: [
        ...(status ? [{ status }] : []),
        { OR: accessOr },
      ],
    };

    const giveaways = await prisma.giveaway.findMany({
      where,
      include: {
        _count: { select: { entries: true } },
        entries: GIVEAWAY_PUBLIC_ENTRY_INCLUDE,
        winners: { orderBy: { rank: 'asc' } },
      },
      orderBy: [{ status: 'asc' }, { endDate: 'asc' }],
    });

    const withWinners = await withPublicWinnerProfiles(giveaways);

    const eligibility =
      viewerId && !viewerIsAdmin
        ? await loadGiveawayParticipationEligibility(viewerId)
        : null;

    return NextResponse.json(
      withWinners.map((g) => {
        const enriched = enrichGiveawayForViewer(g, viewerId) as Record<string, unknown>;
        const canParticipate = checkPrivateGiveawayParticipation(
          {
            id: g.id,
            isPrivate: g.isPrivate,
            requiredAffiliateCode: g.requiredAffiliateCode,
          },
          { viewerUserId: viewerId, viewerIsAdmin, eligibility }
        );
        return redactGiveawayForPublic({ ...enriched, canParticipate }, 'list');
      })
    );
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
    // SÉCURITÉ: Revalider le rôle admin depuis DB (session peut être obsolète)
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé — admin requis' }, { status: 403 });
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, giveawayCreateBodySchema);
    if (!parsed.ok) {
      return parsed.response;
    }
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
    } = parsed.data;

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
