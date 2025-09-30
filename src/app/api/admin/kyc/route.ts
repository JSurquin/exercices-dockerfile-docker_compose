import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { KYCDocument, AdminFilters } from '@/lib/types';

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
    const mockKYCDocuments: KYCDocument[] = [
      {
        id: 'kyc_1',
        userId: 'user_1',
        type: 'id_card',
        status: 'approved',
        providerId: 'provider_123',
        uploadedAt: new Date('2024-11-15T10:30:00Z'),
        reviewedAt: new Date('2024-11-15T14:30:00Z'),
      },
      {
        id: 'kyc_2',
        userId: 'user_2',
        type: 'selfie',
        status: 'pending',
        providerId: 'provider_124',
        uploadedAt: new Date('2024-12-01T09:15:00Z'),
      },
      {
        id: 'kyc_3',
        userId: 'user_3',
        type: 'proof_of_address',
        status: 'rejected',
        providerId: 'provider_125',
        uploadedAt: new Date('2024-11-30T16:45:00Z'),
        reviewedAt: new Date('2024-12-01T10:20:00Z'),
        rejectionReason: 'Document non lisible',
      },
      {
        id: 'kyc_4',
        userId: 'user_4',
        type: 'passport',
        status: 'pending',
        providerId: 'provider_126',
        uploadedAt: new Date('2024-12-01T11:30:00Z'),
      },
    ];

    let filteredDocuments = mockKYCDocuments;

    if (filters.status) {
      filteredDocuments = filteredDocuments.filter(doc => doc.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredDocuments = filteredDocuments.filter(doc => 
        doc.id.toLowerCase().includes(searchLower) ||
        doc.userId.toLowerCase().includes(searchLower) ||
        doc.type.toLowerCase().includes(searchLower)
      );
    }

    const startIndex = ((filters.page || 1) - 1) * (filters.limit || 20);
    const endIndex = startIndex + (filters.limit || 20);
    const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

    return NextResponse.json({
      documents: paginatedDocuments,
      total: filteredDocuments.length,
      page: filters.page || 1,
      limit: filters.limit || 20,
      totalPages: Math.ceil(filteredDocuments.length / (filters.limit || 20)),
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des documents KYC:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
