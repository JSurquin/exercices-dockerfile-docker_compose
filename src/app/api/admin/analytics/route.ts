import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '../../../../../prisma/prisma';
import { skinplaceService } from '@/lib/skinplace';
import { logger } from '@/lib/logger';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    logger.info('Analytics API called');
    
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== 'ADMIN') {
      logger.warn('Unauthorized analytics access attempt');
      return NextResponse.json(
        { success: false, error: 'Accès refusé' },
        { status: 403 }
      );
    }

    logger.info('Admin analytics access granted', { userId: session.user.id });

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // Période en jours
    const periodDays = parseInt(period);

    const startDate = startOfDay(subDays(new Date(), periodDays));
    const endDate = endOfDay(new Date());

    // Statistiques générales
    const [
      totalUsers,
      totalTrades,
      totalVolumeCents,
      totalPayouts,
      pendingKyc,
      activeGiveaways,
      recentUsers,
      recentTrades
    ] = await Promise.all([
      // Total utilisateurs
      prisma.user.count(),
      
      // Total trades
      prisma.trade.count(),
      
      // Volume total en centimes (hors trades annulés/échoués)
      prisma.trade.aggregate({
        _sum: { grossCents: true },
        where: { status: { notIn: ['CANCELLED', 'FAILED'] } },
      }),
      
      // Total payouts
      prisma.payout.count({
        where: { status: 'PAID' }
      }),
      
      // KYC en attente
      prisma.user.count({
        where: { kycStatus: 'PENDING' }
      }),
      
      // Giveaways actifs
      prisma.giveaway.count({
        where: { status: 'ACTIVE' }
      }),
      
      // Nouveaux utilisateurs (période)
      prisma.user.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Nouveaux trades (période)
      prisma.trade.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      })
    ]);

    // Données pour les graphiques - Volume par jour
    const dailyVolumeData = await prisma.$queryRaw<Array<{
      date: string;
      volume: bigint;
      trades: bigint;
    }>>`
      SELECT 
        DATE("createdAt") as date,
        COALESCE(SUM("grossCents"), 0) as volume,
        COUNT(*) as trades
      FROM "Trade"
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
        AND "status" NOT IN ('CANCELLED', 'FAILED')
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Données pour les graphiques - Utilisateurs par jour
    const dailyUsersData = await prisma.$queryRaw<Array<{
      date: string;
      users: bigint;
    }>>`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as users
      FROM "user"
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Répartition des statuts de trades
    const tradeStatusData = await prisma.trade.groupBy({
      by: ['status'],
      _count: { status: true },
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Répartition des méthodes de paiement
    const paymentMethodsData = await prisma.paymentMethod.groupBy({
      by: ['type'],
      _count: { type: true }
    });

    // Top utilisateurs par volume
    const topUsersByVolume = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        steamUsername: true,
        totalVolumeCents: true,
        _count: {
          select: { trades: true }
        }
      },
      orderBy: { totalVolumeCents: 'desc' },
      take: 10
    });

    // Statistiques Skinplace (si disponible)
    let skinplaceStats = null;
    try {
      const [balance, history] = await Promise.all([
        skinplaceService.getBalance(),
        skinplaceService.getInstantHistory(1, 10)
      ]);

      skinplaceStats = {
        balance: balance.status === 'success' ? balance.data : null,
        recentTransactions: history.status === 'success' ? (history.data?.slice(0, 5) || []) : []
      };
    } catch (error) {
      console.warn('Erreur lors de la récupération des stats Skinplace:', error);
    }

    // Calculs de pourcentages de croissance
    const previousPeriodStart = startOfDay(subDays(startDate, periodDays));
    const previousPeriodEnd = endOfDay(subDays(endDate, periodDays));

    const [previousUsers, previousTrades, previousVolume] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lte: previousPeriodEnd
          }
        }
      }),
      prisma.trade.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lte: previousPeriodEnd
          }
        }
      }),
      prisma.trade.aggregate({
        _sum: { grossCents: true },
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lte: previousPeriodEnd
          },
          status: { notIn: ['CANCELLED', 'FAILED'] },
        }
      })
    ]);

    // Calcul des pourcentages de croissance
    const userGrowth = previousUsers > 0 ? ((recentUsers - previousUsers) / previousUsers) * 100 : 0;
    const tradeGrowth = previousTrades > 0 ? ((recentTrades - previousTrades) / previousTrades) * 100 : 0;
    const volumeGrowth = previousVolume._sum?.grossCents && totalVolumeCents._sum?.grossCents 
      ? ((Number(totalVolumeCents._sum.grossCents) - Number(previousVolume._sum.grossCents)) / Number(previousVolume._sum.grossCents)) * 100 
      : 0;

    const analytics = {
      overview: {
        totalUsers,
        totalTrades,
        totalVolumeCents: Number(totalVolumeCents._sum?.grossCents || 0),
        totalPayouts,
        pendingKyc,
        activeGiveaways,
        recentUsers,
        recentTrades,
        userGrowth: Math.round(userGrowth * 100) / 100,
        tradeGrowth: Math.round(tradeGrowth * 100) / 100,
        volumeGrowth: Math.round(volumeGrowth * 100) / 100
      },
      charts: {
        dailyVolume: dailyVolumeData.map((item: any) => ({
          date: format(new Date(item.date), 'dd/MM'),
          volume: Number(item.volume) / 100, // Convertir en euros
          trades: Number(item.trades)
        })),
        dailyUsers: dailyUsersData.map((item: any) => ({
          date: format(new Date(item.date), 'dd/MM'),
          users: Number(item.users)
        })),
        tradeStatus: tradeStatusData.map((item: any) => ({
          status: item.status,
          count: item._count.status,
          percentage: Math.round((item._count.status / totalTrades) * 100)
        })),
        paymentMethods: paymentMethodsData.map((item: any) => ({
          type: item.type,
          count: item._count.type
        }))
      },
      topUsers: topUsersByVolume.map((user: any) => ({
        id: user.id,
        name: user.name || user.steamUsername || 'Utilisateur anonyme',
        volume: user.totalVolumeCents / 100, // Convertir en euros
        trades: user._count.trades
      })),
      skinplace: skinplaceStats,
      period: periodDays,
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
