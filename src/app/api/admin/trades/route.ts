import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { Trade, AdminFilters } from '@/lib/types';

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

    const { searchParams } = new URL(request.url);
    const filters: AdminFilters = {
      status: searchParams.get('status') || undefined,
      userId: searchParams.get('userId') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    // Données mockées pour l'instant - à remplacer par de vraies requêtes DB
    const mockTrades: Trade[] = [
      {
        id: 'trade_1',
        userId: 'user_1',
        status: 'payé',
        brutCentimes: 15000,
        frais: { cashout: 75, réseau: 200 },
        netCentimes: 14725,
        ticketId: 'TICK-20241201-0001',
        tradeAcceptéLe: new Date('2024-12-01T10:30:00Z'),
        disponibleLe: new Date('2024-12-08T10:30:00Z'),
        créédLe: new Date('2024-12-01T10:00:00Z'),
        items: [
          {
            id: 'item_1',
            name: 'AK-47 | Redline (Field-Tested)',
            marketHashName: 'AK-47 | Redline (Field-Tested)',
            prixCentimes: 15000,
            iconUrl: '/images/cs2/weapons/ak47-redline.png',
            exterior: 'Field-Tested',
            statTrak: false,
            rarity: 'Classified',
          },
        ],
      },
      {
        id: 'trade_2',
        userId: 'user_2',
        status: 'paiement_en_cours',
        brutCentimes: 25000,
        frais: { cashout: 125, réseau: 300 },
        netCentimes: 24575,
        ticketId: 'TICK-20241201-0002',
        tradeAcceptéLe: new Date('2024-12-01T11:15:00Z'),
        disponibleLe: new Date('2024-12-08T11:15:00Z'),
        créédLe: new Date('2024-12-01T11:00:00Z'),
        items: [
          {
            id: 'item_2',
            name: 'AWP | Dragon Lore (Factory New)',
            marketHashName: 'AWP | Dragon Lore (Factory New)',
            prixCentimes: 25000,
            iconUrl: '/images/cs2/weapons/awp-dragonlore.png',
            exterior: 'Factory New',
            statTrak: false,
            rarity: 'Covert',
          },
        ],
      },
      {
        id: 'trade_3',
        userId: 'user_3',
        status: 'en_trade_hold',
        brutCentimes: 8500,
        frais: { cashout: 43, réseau: 150 },
        netCentimes: 8307,
        ticketId: 'TICK-20241201-0003',
        tradeAcceptéLe: new Date('2024-12-01T12:00:00Z'),
        disponibleLe: new Date('2024-12-08T12:00:00Z'),
        créédLe: new Date('2024-12-01T11:45:00Z'),
        items: [
          {
            id: 'item_3',
            name: 'M4A4 | Howl (Minimal Wear)',
            marketHashName: 'M4A4 | Howl (Minimal Wear)',
            prixCentimes: 8500,
            iconUrl: '/images/cs2/weapons/m4a4-howl.png',
            exterior: 'Minimal Wear',
            statTrak: false,
            rarity: 'Covert',
          },
        ],
      },
      {
        id: 'trade_4',
        userId: 'user_4',
        status: 'échoué',
        brutCentimes: 12000,
        frais: { cashout: 60, réseau: 200 },
        netCentimes: 11740,
        ticketId: 'TICK-20241130-0001',
        créédLe: new Date('2024-11-30T15:30:00Z'),
        items: [
          {
            id: 'item_4',
            name: 'Knife | Karambit | Fade (Factory New)',
            marketHashName: 'Knife | Karambit | Fade (Factory New)',
            prixCentimes: 12000,
            iconUrl: '/images/cs2/weapons/karambit-fade.png',
            exterior: 'Factory New',
            statTrak: false,
            rarity: 'Covert',
          },
        ],
      },
      {
        id: 'trade_5',
        userId: 'user_5',
        status: 'disponible',
        brutCentimes: 3200,
        frais: { cashout: 16, réseau: 100 },
        netCentimes: 3084,
        ticketId: 'TICK-20241130-0002',
        tradeAcceptéLe: new Date('2024-11-30T16:00:00Z'),
        disponibleLe: new Date('2024-12-07T16:00:00Z'),
        créédLe: new Date('2024-11-30T15:45:00Z'),
        items: [
          {
            id: 'item_5',
            name: 'Glock-18 | Fade (Factory New)',
            marketHashName: 'Glock-18 | Fade (Factory New)',
            prixCentimes: 3200,
            iconUrl: '/images/cs2/weapons/glock-fade.png',
            exterior: 'Factory New',
            statTrak: false,
            rarity: 'Classified',
          },
        ],
      },
    ];

    // Appliquer les filtres
    let filteredTrades = mockTrades;

    if (filters.status) {
      filteredTrades = filteredTrades.filter(trade => trade.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredTrades = filteredTrades.filter(trade => 
        trade.ticketId.toLowerCase().includes(searchLower) ||
        trade.userId.toLowerCase().includes(searchLower) ||
        trade.id.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const startIndex = ((filters.page || 1) - 1) * (filters.limit || 20);
    const endIndex = startIndex + (filters.limit || 20);
    const paginatedTrades = filteredTrades.slice(startIndex, endIndex);

    return NextResponse.json({
      trades: paginatedTrades,
      total: filteredTrades.length,
      page: filters.page || 1,
      limit: filters.limit || 20,
      totalPages: Math.ceil(filteredTrades.length / (filters.limit || 20)),
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des trades:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
