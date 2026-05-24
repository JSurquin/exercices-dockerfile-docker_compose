import { NextRequest, NextResponse } from 'next/server';
import { GiveawayDurationType } from '@prisma/client';
import { prisma } from '~/prisma/prisma';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { safeParseJson } from '@/lib/validation/helpers';
import { giveawaySeriesCreateBodySchema } from '@/lib/validation/schemas/admin-bodies';
import { isRecurringFrequency, spawnGiveawayFromSeries } from '@/lib/giveaway-recurrence';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé — admin requis' }, { status: 403 });
    }

    const series = await prisma.giveawaySeries.findMany({
      include: {
        instances: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            soldTickets: true,
            _count: { select: { entries: true } },
          },
        },
        _count: { select: { instances: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      series.map((s) => {
        const { _count, ...rest } = s;
        return { ...rest, instanceCount: _count.instances };
      })
    );
  } catch (error) {
    console.error('[admin/giveaway-series GET]', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé — admin requis' }, { status: 403 });
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, giveawaySeriesCreateBodySchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    const data = parsed.data;
    const frequency = data.frequency as GiveawayDurationType;
    if (!isRecurringFrequency(frequency)) {
      return NextResponse.json(
        { error: 'Fréquence invalide — choisir DAILY, WEEKLY, MONTHLY ou YEARLY' },
        { status: 400 }
      );
    }

    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const endDate = data.endDate ? new Date(data.endDate) : null;

    const series = await prisma.giveawaySeries.create({
      data: {
        title: data.title,
        description: data.description,
        prize: data.prize,
        prizeImageUrl: data.prizeImageUrl ?? null,
        steamMarketHashName: data.steamMarketHashName ?? null,
        ticketPrice: data.ticketPrice,
        maxTickets: data.maxTickets,
        durationMinutes: data.durationMinutes,
        frequency,
        winnerCount: data.winnerCount ?? 1,
        maxEntriesPerUser: data.maxEntriesPerUser ?? null,
        rewardValueCents: data.rewardValueCents ?? 0,
        isPrivate: data.isPrivate === true,
        requiredAffiliateCode:
          data.isPrivate && data.requiredAffiliateCode?.trim()
            ? data.requiredAffiliateCode.trim()
            : null,
        startDate,
        endDate,
        status: data.enabled === false ? 'DISABLED' : 'ACTIVE',
      },
    });

    let firstInstance = null;
    if (series.status === 'ACTIVE' && startDate <= new Date()) {
      const spawn = await spawnGiveawayFromSeries(series.id, startDate);
      if (spawn.ok) {
        firstInstance = spawn.giveaway;
      }
    }

    return NextResponse.json({ series, firstInstance }, { status: 201 });
  } catch (error) {
    console.error('[admin/giveaway-series POST]', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
