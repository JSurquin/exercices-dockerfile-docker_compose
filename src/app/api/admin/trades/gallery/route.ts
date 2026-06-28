import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { prisma } from '~/prisma/prisma';

const ALLOWED_LIMITS = [5, 10, 20, 100] as const;

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

    const tradesRaw = await prisma.trade.findMany({
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

    return NextResponse.json({ trades, limit });
  } catch (error) {
    console.error('Erreur lors de la récupération de la galerie trades:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
