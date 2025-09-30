import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { Payout, AdminFilters } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters: AdminFilters = {
      status: searchParams.get('status') || undefined,
      userId: searchParams.get('userId') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    // Données mockées
    const mockPayouts: Payout[] = [
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
      {
        id: 'payout_2',
        userId: 'user_2',
        status: 'en_attente',
        montantCentimes: 24575,
        methodePaiement: {
          id: 'pm_2',
          type: 'crypto',
          details: {
            address: '0x1234...5678',
            network: 'ethereum',
            label: 'Wallet Principal',
          },
          isVerified: true,
          isDefault: true,
          createdAt: new Date('2024-11-20T00:00:00Z'),
        },
        créédLe: new Date('2024-12-01T11:15:00Z'),
      },
      {
        id: 'payout_3',
        userId: 'user_3',
        status: 'vérification_requise',
        montantCentimes: 8307,
        methodePaiement: {
          id: 'pm_3',
          type: 'sepa',
          details: {
            iban: 'FR76****5678',
            accountHolder: 'CS2Collector',
            bankName: 'Crédit Agricole',
          },
          isVerified: false,
          isDefault: true,
          createdAt: new Date('2024-11-25T00:00:00Z'),
        },
        créédLe: new Date('2024-12-01T12:00:00Z'),
      },
    ];

    let filteredPayouts = mockPayouts;

    if (filters.status) {
      filteredPayouts = filteredPayouts.filter(payout => payout.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredPayouts = filteredPayouts.filter(payout => 
        payout.id.toLowerCase().includes(searchLower) ||
        payout.userId.toLowerCase().includes(searchLower) ||
        (payout.referencePaiement && payout.referencePaiement.toLowerCase().includes(searchLower))
      );
    }

    const startIndex = ((filters.page || 1) - 1) * (filters.limit || 20);
    const endIndex = startIndex + (filters.limit || 20);
    const paginatedPayouts = filteredPayouts.slice(startIndex, endIndex);

    return NextResponse.json({
      payouts: paginatedPayouts,
      total: filteredPayouts.length,
      page: filters.page || 1,
      limit: filters.limit || 20,
      totalPages: Math.ceil(filteredPayouts.length / (filters.limit || 20)),
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
