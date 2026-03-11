import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { Trade, AdminFilters } from '@/lib/types';
import { prisma } from '~/prisma/prisma';
import { mapTradeStatusFromDb, mapTradeStatusToDb } from '@/lib/status-mapper';

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

    // Construire le where clause pour Prisma
    const where: any = {};

    // Filtrer par statut
    if (filters.status) {
      where.status = mapTradeStatusToDb(filters.status);
    }

    // Filtrer par userId
    if (filters.userId) {
      where.userId = filters.userId;
    }

    // Recherche textuelle
    if (filters.search) {
      where.OR = [
        { id: { contains: filters.search, mode: 'insensitive' } },
        { ticketId: { contains: filters.search, mode: 'insensitive' } },
        { user: { name: { contains: filters.search, mode: 'insensitive' } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    // Exécuter les requêtes en parallèle
    const [tradesData, total] = await Promise.all([
      prisma.trade.findMany({
        where,
        include: {
          items: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        skip: ((filters.page || 1) - 1) * (filters.limit || 20),
        take: filters.limit || 20,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.trade.count({ where }),
    ]);

    // Transformer les données au format attendu
    const trades: Trade[] = tradesData.map(trade => ({
      id: trade.id,
      userId: trade.userId,
      userName: trade.user?.name || undefined,
      userEmail: trade.user?.email || undefined,
      status: mapTradeStatusFromDb(trade.status),
      brutCentimes: trade.grossCents,
      frais: {
        cashout: trade.cashoutFees,
        réseau: trade.networkFees,
      },
      netCentimes: trade.netCents,
      ticketId: trade.ticketId,
      tradeAcceptéLe: trade.tradeAcceptedAt || undefined,
      disponibleLe: trade.availableAt || undefined,
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

    return NextResponse.json({
      trades,
      total,
      page: filters.page || 1,
      limit: filters.limit || 20,
      totalPages: Math.ceil(total / (filters.limit || 20)),
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des trades:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
