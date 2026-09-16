import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '~/prisma/prisma';
import { enrichGiveawayForViewer, GIVEAWAY_PUBLIC_ENTRY_INCLUDE, redactGiveawayForPublic } from '@/lib/giveaway-public';
import { withPublicWinnerProfile } from '@/lib/giveaway-winners-public';
import { canAccessPrivateGiveaway } from '@/lib/giveaway-private-access';
import { resolveGiveawayViewerContext } from '@/lib/giveaway-viewer-context';
import { safeParseJson } from '@/lib/validation/helpers';
import { giveawayPatchBodySchema } from '@/lib/validation/schemas/integrations';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await Promise.resolve(params);
    const { viewerUserId: viewerId, affiliateRef, viewerIsAdmin } =
      await resolveGiveawayViewerContext(request);

    const giveaway = await prisma.giveaway.findUnique({
      where: { id },
      include: {
        _count: { select: { entries: true } },
        entries: GIVEAWAY_PUBLIC_ENTRY_INCLUDE,
        winners: { orderBy: { rank: 'asc' } },
      },
    });

    if (!giveaway) {
      return NextResponse.json({ error: 'Giveaway introuvable' }, { status: 404 });
    }

    const canParticipate = await canAccessPrivateGiveaway({
      giveaway,
      affiliateRef,
      viewerUserId: viewerId,
      viewerIsAdmin,
    });

    const gWithWinners = await withPublicWinnerProfile(giveaway);

    return NextResponse.json(
      redactGiveawayForPublic(
        {
          ...(enrichGiveawayForViewer(gWithWinners, viewerId) as Record<string, unknown>),
          canParticipate,
        },
        'detail'
      )
    );
  } catch (error) {
    console.error('Error fetching giveaway:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du giveaway' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé — admin requis' }, { status: 403 });
    }

    const { id } = await Promise.resolve(params);
    const existing = await prisma.giveaway.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Giveaway introuvable' }, { status: 404 });
    }
    if (existing.status !== 'ACTIVE' && existing.status !== 'PAUSED') {
      return NextResponse.json(
        { error: 'Seuls les giveaways en cours peuvent être modifiés' },
        { status: 400 }
      );
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, giveawayPatchBodySchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const body = parsed.data;

    const allowed = new Set([
      'title',
      'description',
      'prize',
      'prizeImageUrl',
      'steamMarketHashName',
      'ticketPrice',
      'maxTickets',
      'endDate',
      'status',
      'durationType',
      'maxEntriesPerUser',
      'rewardValueCents',
      'winnerCount',
      'isPrivate',
      'requiredAffiliateCode',
    ]);
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      if (!allowed.has(k)) continue;
      if (k === 'endDate' && typeof v === 'string') {
        data[k] = new Date(v);
        continue;
      }
      if (
        (k === 'ticketPrice' ||
          k === 'maxTickets' ||
          k === 'rewardValueCents' ||
          k === 'winnerCount' ||
          k === 'maxEntriesPerUser' ||
          k === 'soldTickets') &&
        typeof v === 'number' &&
        Number.isFinite(v)
      ) {
        data[k] = Math.floor(v);
        continue;
      }
      if (k === 'isPrivate') {
        data[k] = v === true;
        continue;
      }
      if (k === 'requiredAffiliateCode' && (v === null || v === undefined)) {
        data[k] = null;
        continue;
      }
      if (typeof v === 'string' || typeof v === 'number' || v === null) {
        data[k] = v;
      }
    }

    if (
      typeof data.maxTickets === 'number' &&
      data.maxTickets < existing.soldTickets
    ) {
      return NextResponse.json(
        { error: 'Le nombre max d’entrées ne peut pas être inférieur aux tickets déjà vendus' },
        { status: 400 }
      );
    }

    const giveaway = await prisma.giveaway.update({
      where: { id },
      data: data as Prisma.GiveawayUpdateInput,
      include: {
        _count: { select: { entries: true } },
        winners: { orderBy: { rank: 'asc' } },
      },
    });

    const { _count, ...rest } = giveaway;
    return NextResponse.json({ ...rest, totalParticipants: _count.entries });
  } catch (error) {
    console.error('Error updating giveaway:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du giveaway' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé — admin requis' }, { status: 403 });
    }

    const { id } = await Promise.resolve(params);

    await prisma.giveaway.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting giveaway:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du giveaway' },
      { status: 500 }
    );
  }
}
