import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { GiveawayDurationType } from '@prisma/client';
import { prisma } from '~/prisma/prisma';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { safeParseJson } from '@/lib/validation/helpers';
import { giveawaySeriesPatchBodySchema } from '@/lib/validation/schemas/admin-bodies';
import {
  disableGiveawaySeries,
  isRecurringFrequency,
  pauseGiveawaySeries,
  restartGiveawaySeries,
  resumeGiveawaySeries,
  spawnGiveawayFromSeries,
} from '@/lib/giveaway-recurrence';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé — admin requis' }, { status: 403 });
    }

    const { id } = await params;
    const series = await prisma.giveawaySeries.findUnique({
      where: { id },
      include: {
        instances: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { _count: { select: { entries: true } } },
        },
      },
    });

    if (!series) {
      return NextResponse.json({ error: 'Série introuvable' }, { status: 404 });
    }

    return NextResponse.json(series);
  } catch (error) {
    console.error('[admin/giveaway-series/[id] GET]', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé — admin requis' }, { status: 403 });
    }

    const { id } = await params;
    const raw = await request.json();
    const parsed = safeParseJson(raw, giveawaySeriesPatchBodySchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    const body = parsed.data;

    if (body.action) {
      switch (body.action) {
        case 'pause': {
          const series = await pauseGiveawaySeries(id);
          return NextResponse.json({ series, action: 'pause' });
        }
        case 'resume': {
          const result = await resumeGiveawaySeries(id);
          return NextResponse.json({ ...result, action: 'resume' });
        }
        case 'disable': {
          const series = await disableGiveawaySeries(id);
          return NextResponse.json({ series, action: 'disable' });
        }
        case 'restart': {
          const spawn = await restartGiveawaySeries(id);
          if (!spawn.ok) {
            return NextResponse.json({ error: spawn.error }, { status: 400 });
          }
          return NextResponse.json({ series: spawn.giveaway.seriesId, giveaway: spawn.giveaway, action: 'restart' });
        }
        case 'spawn': {
          const spawn = await spawnGiveawayFromSeries(id);
          if (!spawn.ok) {
            return NextResponse.json({ error: spawn.error }, { status: 400 });
          }
          return NextResponse.json({ giveaway: spawn.giveaway, action: 'spawn' });
        }
        default:
          return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
      }
    }

    const updateData: Prisma.GiveawaySeriesUpdateInput = {};
    const scalarFields = [
      'title',
      'description',
      'prize',
      'prizeImageUrl',
      'steamMarketHashName',
      'ticketPrice',
      'maxTickets',
      'durationMinutes',
      'winnerCount',
      'maxEntriesPerUser',
      'rewardValueCents',
      'isPrivate',
      'requiredAffiliateCode',
      'status',
    ] as const;

    for (const key of scalarFields) {
      if (body[key] !== undefined) {
        (updateData as Record<string, unknown>)[key] = body[key];
      }
    }

    if (body.frequency !== undefined) {
      const frequency = body.frequency as GiveawayDurationType;
      if (!isRecurringFrequency(frequency)) {
        return NextResponse.json({ error: 'Fréquence invalide' }, { status: 400 });
      }
      updateData.frequency = frequency;
    }
    if (body.startDate !== undefined) {
      updateData.startDate = new Date(body.startDate);
    }
    if (body.endDate !== undefined) {
      updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    }

    const series = await prisma.giveawaySeries.update({
      where: { id },
      data: updateData,
    });

    const activeInstance = await prisma.giveaway.findFirst({
      where: { seriesId: id, status: { in: ['ACTIVE', 'PAUSED'] } },
    });
    if (activeInstance && body.syncActiveInstance) {
      await prisma.giveaway.update({
        where: { id: activeInstance.id },
        data: {
          title: series.title,
          description: series.description,
          prize: series.prize,
          prizeImageUrl: series.prizeImageUrl,
          steamMarketHashName: series.steamMarketHashName,
          ticketPrice: series.ticketPrice,
          maxTickets: series.maxTickets,
          winnerCount: series.winnerCount,
          maxEntriesPerUser: series.maxEntriesPerUser,
          rewardValueCents: series.rewardValueCents,
          isPrivate: series.isPrivate,
          requiredAffiliateCode: series.requiredAffiliateCode,
          durationType: series.frequency,
        },
      });
    }

    return NextResponse.json(series);
  } catch (error) {
    console.error('[admin/giveaway-series/[id] PATCH]', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé — admin requis' }, { status: 403 });
    }

    const { id } = await params;
    const series = await prisma.giveawaySeries.findUnique({ where: { id } });
    if (!series) {
      return NextResponse.json({ error: 'Série introuvable' }, { status: 404 });
    }

    await disableGiveawaySeries(id);
    await prisma.giveawaySeries.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin/giveaway-series/[id] DELETE]', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
