import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '../../../../../prisma/prisma';
import { skinplaceService } from '@/lib/skinplace';
import { subHours, subDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Accès refusé' },
        { status: 403 }
      );
    }

    const now = new Date();
    const last24h = subHours(now, 24);
    const last7d = subDays(now, 7);

    // Métriques en temps réel
    const [
      // Activité des dernières 24h
      tradesLast24h,
      usersLast24h,
      volumeLast24h,
      
      // Activité des 7 derniers jours
      tradesLast7d,
      usersLast7d,
      volumeLast7d,
      
      // Statuts actuels
      pendingTrades,
      processingPayouts,
      failedPayouts,
      
      // KYC
      pendingKyc,
      rejectedKyc,
      
      // Sessions actives (approximation basée sur les sessions récentes)
      activeSessions
    ] = await Promise.all([
      // 24h
      prisma.trade.count({
        where: { createdAt: { gte: last24h } }
      }),
      prisma.user.count({
        where: { createdAt: { gte: last24h } }
      }),
      prisma.trade.aggregate({
        _sum: { grossCents: true },
        where: { createdAt: { gte: last24h } }
      }),
      
      // 7d
      prisma.trade.count({
        where: { createdAt: { gte: last7d } }
      }),
      prisma.user.count({
        where: { createdAt: { gte: last7d } }
      }),
      prisma.trade.aggregate({
        _sum: { grossCents: true },
        where: { createdAt: { gte: last7d } }
      }),
      
      // Statuts
      prisma.trade.count({
        where: { 
          status: { 
            in: ['CREATED', 'ACCEPTED_BY_BOT', 'IN_TRADE_HOLD'] 
          } 
        }
      }),
      prisma.payout.count({
        where: { status: 'PROCESSING' }
      }),
      prisma.payout.count({
        where: { status: 'FAILED' }
      }),
      
      // KYC
      prisma.user.count({
        where: { kycStatus: 'PENDING' }
      }),
      prisma.user.count({
        where: { kycStatus: 'REJECTED' }
      }),
      
      // Sessions actives (dernière heure)
      prisma.session.count({
        where: { 
          updatedAt: { gte: subHours(now, 1) }
        }
      })
    ]);

    // Métriques par heure pour les dernières 24h
    const hourlyMetrics = await prisma.$queryRaw<Array<{
      hour: string;
      trades: bigint;
      volume: bigint;
      users: bigint;
    }>>`
      SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(CASE WHEN 'Trade' = 'Trade' THEN 1 END) as trades,
        COALESCE(SUM(CASE WHEN 'Trade' = 'Trade' THEN gross_cents END), 0) as volume,
        0 as users
      FROM "Trade"
      WHERE created_at >= ${last24h}
      GROUP BY DATE_TRUNC('hour', created_at)
      
      UNION ALL
      
      SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        0 as trades,
        0 as volume,
        COUNT(*) as users
      FROM "user"
      WHERE created_at >= ${last24h}
      GROUP BY DATE_TRUNC('hour', created_at)
      
      ORDER BY hour DESC
    `;

    // Agrégation des métriques par heure
    const hourlyData = new Map<string, { trades: number; volume: number; users: number }>();
    
    hourlyMetrics.forEach(metric => {
      const hour = new Date(metric.hour).toISOString();
      const existing = hourlyData.get(hour) || { trades: 0, volume: 0, users: 0 };
      
      hourlyData.set(hour, {
        trades: existing.trades + Number(metric.trades),
        volume: existing.volume + Number(metric.volume),
        users: existing.users + Number(metric.users)
      });
    });

    // Conversion en tableau trié
    const sortedHourlyData = Array.from(hourlyData.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([hour, data]) => ({
        hour: new Date(hour).toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        ...data,
        volume: data.volume / 100 // Convertir en euros
      }));

    // Statistiques Skinplace en temps réel
    let skinplaceMetrics = null;
    try {
      const [balance, recentHistory] = await Promise.all([
        skinplaceService.getBalance(),
        skinplaceService.getInstantHistory(1, 5)
      ]);

      if (balance.success && balance.data) {
        skinplaceMetrics = {
          balance: balance.data.balance,
          currency: balance.data.currency,
          lastUpdated: new Date().toISOString(), // Utiliser timestamp actuel
          recentTransactions: recentHistory.success ? (recentHistory.data?.items?.length || 0) : 0
        };
      }
    } catch (error) {
      console.warn('Erreur Skinplace metrics:', error);
    }

    // Alertes système
    const alerts = [];
    
    if (failedPayouts > 5) {
      alerts.push({
        type: 'error',
        message: `${failedPayouts} paiements échoués nécessitent une attention`,
        priority: 'high'
      });
    }
    
    if (pendingKyc > 10) {
      alerts.push({
        type: 'warning',
        message: `${pendingKyc} demandes KYC en attente de validation`,
        priority: 'medium'
      });
    }
    
    if (pendingTrades > 20) {
      alerts.push({
        type: 'info',
        message: `${pendingTrades} trades en cours de traitement`,
        priority: 'low'
      });
    }

    const metrics = {
      realtime: {
        activeSessions,
        pendingTrades,
        processingPayouts,
        failedPayouts,
        pendingKyc,
        rejectedKyc
      },
      last24h: {
        trades: tradesLast24h,
        users: usersLast24h,
        volume: Number(volumeLast24h._sum?.grossCents || 0) / 100
      },
      last7d: {
        trades: tradesLast7d,
        users: usersLast7d,
        volume: Number(volumeLast7d._sum?.grossCents || 0) / 100
      },
      hourly: sortedHourlyData,
      skinplace: skinplaceMetrics,
      alerts,
      timestamp: now.toISOString()
    };

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des métriques:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
