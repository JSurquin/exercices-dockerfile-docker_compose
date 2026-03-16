import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { AdminStats, type SEPADetails, type CryptoDetails } from '@/lib/types';
import { prisma } from '~/prisma/prisma';
import { mapTradeStatusFromDb, mapPayoutStatusFromDb, mapPaymentMethodTypeFromDb } from '@/lib/status-mapper';
import { getPublicSepaDetails } from '@/lib/payment-method-sepa';
import type { SepaDetailsStored } from '@/lib/payment-method-sepa';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Statistiques globales (toutes issues de la BDD)
    const [totalUsers, totalTrades, totalVolumeResult, totalPayoutsResult] = await Promise.all([
      prisma.user.count(),
      prisma.trade.count(),
      prisma.trade.aggregate({ _sum: { grossCents: true } }),
      // Total payouts = uniquement les payouts effectivement payés (PAID, FLEXIFY_PAID, WHITEPAY_COMPLETE)
      prisma.payout.aggregate({
        _sum: { amountCents: true },
        where: {
          status: { in: ['PAID', 'FLEXIFY_PAID', 'WHITEPAY_COMPLETE'] },
        },
      }),
    ]);

    // Stats actives (en attente)
    const [activeTrades, failedTrades, pendingPayouts, kycPending] = await Promise.all([
      prisma.trade.count({
        where: {
          status: { in: ['CREATED', 'ACCEPTED_BY_BOT', 'IN_TRADE_HOLD', 'AVAILABLE'] },
        },
      }),
      prisma.trade.count({ where: { status: 'FAILED' } }),
      // Payouts en attente : PENDING, PENDING_APPROVAL, et statuts Flexify/Whitepay en cours
      prisma.payout.count({
        where: {
          status: {
            in: [
              'PENDING',
              'PENDING_APPROVAL',
              'FLEXIFY_PENDING',
              'FLEXIFY_PROCESSING',
              'WHITEPAY_WAITING_CONFIRMATION',
              'WHITEPAY_PENDING_WITHDRAWAL',
              'WHITEPAY_PROCESSING_WITHDRAWAL',
            ],
          },
        },
      }),
      // KYC en attente : PENDING, KYCAID_PENDING, IN_PROGRESS
      prisma.user.count({
        where: {
          kycStatus: { in: ['PENDING', 'KYCAID_PENDING', 'IN_PROGRESS'] },
        },
      }),
    ]);

    // Statistiques mensuelles (6 derniers mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const tradesGrouped = await prisma.trade.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      _count: { id: true },
      _sum: { grossCents: true },
    });

    const payoutsGrouped = await prisma.payout.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      _sum: { amountCents: true },
    });

    const usersGrouped = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      _count: { id: true },
    });

    // Créer un map par mois
    const monthlyStatsMap = new Map<string, {
      month: string;
      trades: number;
      volumeCentimes: number;
      payoutsCentimes: number;
      newUsers: number;
    }>();

    // Initialiser les 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyStatsMap.set(monthKey, {
        month: monthKey,
        trades: 0,
        volumeCentimes: 0,
        payoutsCentimes: 0,
        newUsers: 0,
      });
    }

    // Remplir les données de trades
    tradesGrouped.forEach((item) => {
      const monthKey = `${item.createdAt.getFullYear()}-${String(item.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const stat = monthlyStatsMap.get(monthKey);
      if (stat) {
        stat.trades += item._count.id;
        stat.volumeCentimes += item._sum.grossCents || 0;
      }
    });

    // Remplir les données de payouts
    payoutsGrouped.forEach((item) => {
      const monthKey = `${item.createdAt.getFullYear()}-${String(item.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const stat = monthlyStatsMap.get(monthKey);
      if (stat) {
        stat.payoutsCentimes += item._sum.amountCents || 0;
      }
    });

    // Remplir les données d'utilisateurs
    usersGrouped.forEach((item) => {
      const monthKey = `${item.createdAt.getFullYear()}-${String(item.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const stat = monthlyStatsMap.get(monthKey);
      if (stat) {
        stat.newUsers += item._count.id;
      }
    });

    const monthlyStats = Array.from(monthlyStatsMap.values());

    // Top users (volume total réel en BDD)
    const topUsersData = await prisma.user.findMany({
      orderBy: { totalVolumeCents: 'desc' },
      take: 3,
      select: {
        id: true,
        name: true,
        steamUsername: true,
        steamId: true,
        totalVolumeCents: true,
        level: true,
        xp: true,
        _count: { select: { trades: true } },
      },
    });

    const topUsers = topUsersData.map(user => ({
      id: user.id,
      username: (user.steamUsername || user.name || 'Inconnu').trim() || 'Inconnu',
      steamId64: user.steamId || '',
      totalVolumeCentimes: user.totalVolumeCents,
      totalTrades: user._count?.trades ?? 0,
      level: user.level,
      xp: user.xp,
    }));

    // Recent trades
    const recentTradesData = await prisma.trade.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        items: true,
      },
    });

    const recentTrades = recentTradesData.map(trade => ({
      id: trade.id,
      userId: trade.userId,
      status: mapTradeStatusFromDb(trade.status),
      brutCentimes: trade.grossCents,
      frais: { 
        cashout: trade.cashoutFees, 
        réseau: trade.networkFees 
      },
      netCentimes: trade.netCents,
      ticketId: trade.ticketId,
      créédLe: trade.createdAt,
      items: trade.items.map(item => ({
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

    // Recent payouts
    const recentPayoutsData = await prisma.payout.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        paymentMethod: true,
      },
    });

    const recentPayouts = recentPayoutsData.map(payout => {
      const details = payout.paymentMethod.details as SepaDetailsStored | null;
      const publicDetails =
        details?.type === 'SEPA' ? getPublicSepaDetails(details) : (payout.paymentMethod.details as object | null);
      const safeDetails: SEPADetails | CryptoDetails =
        (publicDetails ?? payout.paymentMethod.details) as SEPADetails | CryptoDetails | null
        ?? { iban: '—', accountHolder: '—', bankName: '—' };
      return {
        id: payout.id,
        userId: payout.userId,
        status: mapPayoutStatusFromDb(payout.status),
        montantCentimes: payout.amountCents,
        methodePaiement: {
          id: payout.paymentMethod.id,
          type: mapPaymentMethodTypeFromDb(payout.paymentMethod.type),
          details: safeDetails,
          isVerified: payout.paymentMethod.isVerified,
          isDefault: payout.paymentMethod.isDefault,
          createdAt: payout.paymentMethod.createdAt,
        },
        referencePaiement: payout.paymentReference || undefined,
        créédLe: payout.createdAt,
        payéLe: payout.paidAt || undefined,
      };
    });

    const stats: AdminStats = {
      totalUsers,
      totalTrades,
      failedTrades,
      totalVolumeCentimes: totalVolumeResult._sum.grossCents || 0,
      totalPayoutsCentimes: totalPayoutsResult._sum.amountCents || 0,
      activeTrades,
      pendingPayouts,
      kycPending,
      monthlyStats,
      topUsers,
      recentTrades,
      recentPayouts,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
