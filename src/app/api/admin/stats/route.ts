import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { AdminStats } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // TODO: Vérifier que l'utilisateur est admin
    // if (!session.user.isAdmin) {
    //   return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    // }

    // Données mockées pour l'instant - à remplacer par de vraies requêtes DB
    const stats: AdminStats = {
      totalUsers: 1250,
      totalTrades: 3420,
      totalVolumeCentimes: 125000000, // 1,250,000 €
      totalPayoutsCentimes: 118000000, // 1,180,000 €
      activeTrades: 45,
      pendingPayouts: 12,
      kycPending: 8,
      monthlyStats: [
        {
          month: '2024-01',
          trades: 280,
          volumeCentimes: 10500000,
          payoutsCentimes: 9800000,
          newUsers: 95,
        },
        {
          month: '2024-02',
          trades: 320,
          volumeCentimes: 12000000,
          payoutsCentimes: 11200000,
          newUsers: 110,
        },
        {
          month: '2024-03',
          trades: 380,
          volumeCentimes: 14500000,
          payoutsCentimes: 13800000,
          newUsers: 125,
        },
        {
          month: '2024-04',
          trades: 420,
          volumeCentimes: 16800000,
          payoutsCentimes: 15900000,
          newUsers: 140,
        },
        {
          month: '2024-05',
          trades: 450,
          volumeCentimes: 18500000,
          payoutsCentimes: 17500000,
          newUsers: 155,
        },
        {
          month: '2024-06',
          trades: 480,
          volumeCentimes: 20200000,
          payoutsCentimes: 19200000,
          newUsers: 170,
        },
      ],
      topUsers: [
        {
          id: 'user_1',
          username: 'ProTrader_CS2',
          steamId64: '76561198000000001',
          totalVolumeCentimes: 2500000,
          totalTrades: 45,
          level: 15,
          xp: 12500,
        },
        {
          id: 'user_2',
          username: 'SkinMaster',
          steamId64: '76561198000000002',
          totalVolumeCentimes: 2200000,
          totalTrades: 38,
          level: 14,
          xp: 11200,
        },
        {
          id: 'user_3',
          username: 'CS2Collector',
          steamId64: '76561198000000003',
          totalVolumeCentimes: 1950000,
          totalTrades: 42,
          level: 13,
          xp: 9800,
        },
      ],
      recentTrades: [
        {
          id: 'trade_1',
          userId: 'user_1',
          status: 'payé',
          brutCentimes: 15000,
          frais: { cashout: 75, réseau: 200 },
          netCentimes: 14725,
          ticketId: 'TICK-20241201-0001',
          créédLe: new Date('2024-12-01T10:30:00Z'),
          items: [],
        },
        {
          id: 'trade_2',
          userId: 'user_2',
          status: 'paiement_en_cours',
          brutCentimes: 25000,
          frais: { cashout: 125, réseau: 300 },
          netCentimes: 24575,
          ticketId: 'TICK-20241201-0002',
          créédLe: new Date('2024-12-01T11:15:00Z'),
          items: [],
        },
      ],
      recentPayouts: [
        {
          id: 'payout_1',
          userId: 'user_1',
          status: 'payé',
          montantCentimes: 14725,
          methodePaiement: {
            id: 'pm_1',
            type: 'sepa',
            details: {
              iban: 'FR76****1234',
              accountHolder: 'ProTrader_CS2',
              bankName: 'Banque Populaire',
            },
            isVerified: true,
            isDefault: true,
            createdAt: new Date('2024-11-15T00:00:00Z'),
          },
          referencePaiement: 'PAY-20241201-001',
          créédLe: new Date('2024-12-01T10:30:00Z'),
          payéLe: new Date('2024-12-01T14:30:00Z'),
        },
      ],
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
