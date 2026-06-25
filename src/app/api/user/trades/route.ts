import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../prisma/prisma';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Récupérer les trades de l'utilisateur avec les items
    const trades = await prisma.trade.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        items: true,
        payouts: {
          include: {
            paymentMethod: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Fonction pour mapper les statuts de la DB vers le format frontend
    const mapStatus = (status: string) => {
      const statusMap: { [key: string]: string } = {
        'CREATED': 'créé',
        'ACCEPTED_BY_BOT': 'accepté_par_bot',
        'IN_TRADE_HOLD': 'en_trade_hold',
        'AVAILABLE': 'disponible',
        'PAYOUT_PENDING': 'paiement_en_cours',
        'PAID': 'payé',
        'FAILED': 'échoué',
        'CANCELLED': 'annulé',
      };
      return statusMap[status] || status.toLowerCase();
    };

    const TERMINAL_STATUSES = new Set(['CANCELLED', 'FAILED']);

    // Transformer les données pour correspondre au format attendu par le frontend
    const formattedTrades = trades.map(trade => ({
      id: trade.id,
      userId: trade.userId,
      status: mapStatus(trade.status),
      brutCentimes: trade.grossCents,
      frais: {
        cashout: trade.cashoutFees,
        réseau: trade.networkFees
      },
      netCentimes: trade.netCents,
      vipBonusCentimes: trade.vipBonusCents ?? 0,
      ticketId: trade.ticketId,
      tradeAcceptéLe: trade.tradeAcceptedAt,
      disponibleLe: trade.availableAt,
      créédLe: trade.createdAt,
      balanceCreditedAt: trade.balanceCreditedAt ?? null,
      items: trade.items.map(item => ({
        id: item.id,
        name: item.name,
        marketHashName: item.marketHashName,
        prixCentimes: item.priceCents,
        iconUrl: item.iconUrl,
        exterior: item.exterior,
        statTrak: item.statTrak,
        rarity: item.rarity
      }))
    }));

    return NextResponse.json({
      trades: formattedTrades,
      totalTrades: trades.length,
      totalVolume: trades
        .filter(trade => !TERMINAL_STATUSES.has(trade.status))
        .reduce(
          (sum, trade) => sum + trade.grossCents + (trade.vipBonusCents ?? 0),
          0,
        ),
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des trades:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
