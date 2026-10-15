import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';

const COMPLETED_TRADE_STATUSES = ['PAID', 'PAYOUT_PENDING', 'AVAILABLE'] as const;

/** Clé de jour locale YYYY-MM-DD, indépendante de la langue d’affichage. */
function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Regroupe les statuts Prisma pour le camembert (libellés traduits côté client). */
function statusGroupKey(dbStatus: string): string {
  switch (dbStatus) {
    case 'CREATED':
    case 'ACCEPTED_BY_BOT':
      return 'created';
    case 'PAYOUT_PENDING':
    case 'AVAILABLE':
      return 'in_progress';
    case 'IN_TRADE_HOLD':
      return 'hold';
    case 'PAID':
      return 'paid';
    case 'FAILED':
      return 'failed';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return dbStatus;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = session.user.id;

    const [collectedResult, skinsSoldCount] = await Promise.all([
      prisma.trade.aggregate({
        where: {
          userId,
          status: { in: [...COMPLETED_TRADE_STATUSES] },
        },
        _sum: { netCents: true },
      }),
      prisma.tradeItem.count({
        where: {
          trade: {
            userId,
            status: { in: [...COMPLETED_TRADE_STATUSES] },
          },
        },
      }),
    ]);

    const totalCollectedCents = collectedResult._sum.netCents ?? 0;
    const totalSkinsSold = skinsSoldCount;

    // Statistiques de volume par jour (7 derniers jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const tradesLastWeek = await prisma.trade.findMany({
      where: {
        userId,
        createdAt: {
          gte: sevenDaysAgo,
        },
        status: {
          notIn: ['CANCELLED', 'FAILED'],
        },
      },
      select: {
        createdAt: true,
        grossCents: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Créer un map par jour
    const volumeByDay = new Map<string, number>();
    
    // Initialiser les 7 derniers jours
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = localDayKey(date);
      volumeByDay.set(dateKey, 0);
    }

    // Remplir avec les données réelles
    tradesLastWeek.forEach(trade => {
      const dateKey = localDayKey(trade.createdAt);
      const currentVolume = volumeByDay.get(dateKey) || 0;
      volumeByDay.set(dateKey, currentVolume + trade.grossCents);
    });

    const volumeData = Array.from(volumeByDay.entries()).map(([date, volume]) => ({
      date,
      volume,
    }));

    // Statistiques de répartition des trades par statut
    const tradesByStatus = await prisma.trade.groupBy({
      by: ['status'],
      where: {
        userId,
      },
      _count: {
        id: true,
      },
    });

    // Mapper les statuts et créer les données pour le graphique
    const statusMap = new Map<string, { count: number; color: string }>();
    
    tradesByStatus.forEach(item => {
      const count = item._count.id;
      
      let color = '#7a7a8c';
      
      switch (item.status) {
        case 'PAID':
          color = '#6eb8a8';
          break;
        case 'PAYOUT_PENDING':
        case 'AVAILABLE':
          color = '#b8d8f8';
          break;
        case 'IN_TRADE_HOLD':
          color = '#c9a84c';
          break;
        case 'CREATED':
        case 'ACCEPTED_BY_BOT':
          color = '#7eb3e8';
          break;
        case 'FAILED':
          color = '#c47a7a';
          break;
        case 'CANCELLED':
          color = '#8a8a9c';
          break;
      }

      const groupedStatus = statusGroupKey(item.status);
      
      const existing = statusMap.get(groupedStatus);
      if (existing) {
        statusMap.set(groupedStatus, { count: existing.count + count, color: existing.color });
      } else {
        statusMap.set(groupedStatus, { count, color });
      }
    });

    const tradeStatusData = Array.from(statusMap.entries()).map(([key, data]) => ({
      key,
      count: data.count,
      color: data.color,
    }));

    return NextResponse.json({
      totalCollectedCents,
      totalSkinsSold,
      volumeData,
      tradeStatusData,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques du dashboard:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
