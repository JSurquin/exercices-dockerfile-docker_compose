import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin';
import { Payout, AdminFilters, type SEPADetails, type CryptoDetails } from '@/lib/types';
import { prisma } from '~/prisma/prisma';
import { mapPayoutStatusFromDb, mapPayoutStatusToDb, mapPaymentMethodTypeFromDb } from '@/lib/status-mapper';
import { getPublicSepaDetails } from '@/lib/payment-method-sepa';
import type { SepaDetailsStored } from '@/lib/payment-method-sepa';

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdminSession(request))) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

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
      where.status = mapPayoutStatusToDb(filters.status);
    }

    // Filtrer par userId
    if (filters.userId) {
      where.userId = filters.userId;
    }

    // Recherche textuelle
    if (filters.search) {
      where.OR = [
        { id: { contains: filters.search, mode: 'insensitive' } },
        { paymentReference: { contains: filters.search, mode: 'insensitive' } },
        { user: { name: { contains: filters.search, mode: 'insensitive' } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    // Exécuter les requêtes en parallèle
    const [payoutsData, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: {
          paymentMethod: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              steamUsername: true,
              steamAvatar: true,
            },
          },
        },
        skip: ((filters.page || 1) - 1) * (filters.limit || 20),
        take: filters.limit || 20,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payout.count({ where }),
    ]);

    // Transformer les données : détails SEPA masqués (IBAN/BIC jamais en clair)
    const payouts: Payout[] = payoutsData.map(payout => {
      const details = payout.paymentMethod.details as SepaDetailsStored | null;
      const publicDetails =
        details?.type === 'SEPA' ? getPublicSepaDetails(details) : (payout.paymentMethod.details as object | null);
      const safeDetails: SEPADetails | CryptoDetails =
        (publicDetails ?? payout.paymentMethod.details) as SEPADetails | CryptoDetails | null
        ?? { iban: '—', accountHolder: '—', bankName: '—' };
      return {
        id: payout.id,
        userId: payout.userId,
        userName: payout.user?.name ?? undefined,
        userEmail: payout.user?.email ?? undefined,
        userSteamUsername: payout.user?.steamUsername ?? undefined,
        userSteamAvatar: payout.user?.steamAvatar ?? undefined,
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
        flexifyPayoutId: payout.flexifyPayoutId ?? undefined,
      };
    });

    const pageSize = filters.limit || 20;
    const currentPage = filters.page || 1;

    return NextResponse.json({
      payouts,
      pagination: {
        total,
        page: currentPage,
        pages: Math.ceil(total / pageSize),
        limit: pageSize,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
