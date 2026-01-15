import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { mapTradeStatusFromDb } from '@/lib/status-mapper';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = session.user.id;

    // Statistiques de volume par jour (7 derniers jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const tradesLastWeek = await prisma.trade.findMany({
      where: {
        userId,
        createdAt: {
          gte: sevenDaysAgo,
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
      const dateKey = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      volumeByDay.set(dateKey, 0);
    }

    // Remplir avec les données réelles
    tradesLastWeek.forEach(trade => {
      const dateKey = trade.createdAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
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
      const status = mapTradeStatusFromDb(item.status);
      const count = item._count.id;
      
      let color = '#6B7280'; // gray par défaut
      
      switch (item.status) {
        case 'PAID':
          color = '#10B981'; // green
          break;
        case 'PAYOUT_PENDING':
        case 'AVAILABLE':
          color = '#F59E0B'; // orange
          break;
        case 'IN_TRADE_HOLD':
          color = '#EF4444'; // red
          break;
        case 'CREATED':
        case 'ACCEPTED_BY_BOT':
          color = '#3B82F6'; // blue
          break;
        case 'FAILED':
          color = '#DC2626'; // dark red
          break;
      }
      
      // Regrouper certains statuts pour l'affichage
      let groupedStatus: string = status;
      if (['créé', 'accepté_par_bot'].includes(status)) {
        groupedStatus = 'Créés';
      } else if (['paiement_en_cours', 'disponible'].includes(status)) {
        groupedStatus = 'En cours';
      } else if (status === 'en_trade_hold') {
        groupedStatus = 'Hold';
      } else if (status === 'payé') {
        groupedStatus = 'Payés';
      } else if (status === 'échoué') {
        groupedStatus = 'Échoués';
      }
      
      const existing = statusMap.get(groupedStatus);
      if (existing) {
        statusMap.set(groupedStatus, { count: existing.count + count, color: existing.color });
      } else {
        statusMap.set(groupedStatus, { count, color });
      }
    });

    const tradeStatusData = Array.from(statusMap.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      color: data.color,
    }));

    return NextResponse.json({
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
