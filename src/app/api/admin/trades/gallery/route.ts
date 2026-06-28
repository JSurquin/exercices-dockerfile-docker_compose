import { NextRequest, NextResponse } from 'next/server';
import { startOfDay, subDays } from 'date-fns';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { prisma } from '~/prisma/prisma';

const ALLOWED_LIMITS = [5, 10, 20, 100] as const;
const ALLOWED_PERIODS = ['today', 'yesterday', 'week', 'month', 'all'] as const;

type GalleryPeriod = (typeof ALLOWED_PERIODS)[number];

function resolvePeriodDateFilter(period: GalleryPeriod) {
  const now = new Date();

  switch (period) {
    case 'today':
      return { gte: startOfDay(now) };
    case 'yesterday': {
      const yesterday = subDays(now, 1);
      return { gte: startOfDay(yesterday), lt: startOfDay(now) };
    }
    case 'week':
      return { gte: subDays(now, 7) };
    case 'month':
      return { gte: subDays(now, 30) };
    case 'all':
    default:
      return undefined;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);

    if (!session) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const rawLimit = parseInt(searchParams.get('limit') || '5', 10);
    const limit = ALLOWED_LIMITS.includes(rawLimit as (typeof ALLOWED_LIMITS)[number])
      ? rawLimit
      : 5;

    const rawPeriod = searchParams.get('period') || 'all';
    const period = ALLOWED_PERIODS.includes(rawPeriod as GalleryPeriod)
      ? (rawPeriod as GalleryPeriod)
      : 'all';

    const createdAtFilter = resolvePeriodDateFilter(period);

    const tradesRaw = await prisma.trade.findMany({
      where: createdAtFilter ? { createdAt: createdAtFilter } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        items: true,
      },
    });

    const trades = tradesRaw.map((trade) => ({
      id: trade.id,
      ticketId: trade.ticketId,
      créédLe: trade.createdAt,
      items: trade.items.map((item) => ({
        id: item.id,
        name: item.name,
        marketHashName: item.marketHashName,
        prixCentimes: item.priceCents,
        iconUrl: item.iconUrl,
        exterior: item.exterior || undefined,
        statTrak: item.statTrak,
        rarity: item.rarity,
      })),
    }));

    return NextResponse.json({ trades, limit, period });
  } catch (error) {
    console.error('Erreur lors de la récupération de la galerie trades:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
