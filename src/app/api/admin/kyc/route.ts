import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { KYCDocument, AdminFilters } from '@/lib/types';
import { prisma } from '~/prisma/prisma';
import { mapKycStatusFromDb, mapKycStatusToDb, mapKycDocumentTypeFromDb } from '@/lib/status-mapper';

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

    // Construire le where clause pour Prisma
    const where: any = {};

    // Filtrer par statut
    if (filters.status) {
      where.status = mapKycStatusToDb(filters.status);
    }

    // Filtrer par userId
    if (filters.userId) {
      where.userId = filters.userId;
    }

    // Recherche textuelle
    if (filters.search) {
      where.OR = [
        { id: { contains: filters.search, mode: 'insensitive' } },
        { kycaidDocumentId: { contains: filters.search, mode: 'insensitive' } },
        { user: { name: { contains: filters.search, mode: 'insensitive' } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    // Exécuter les requêtes en parallèle
    const [documentsData, total] = await Promise.all([
      prisma.kycDocument.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              kycStatus: true,
            },
          },
        },
        skip: ((filters.page || 1) - 1) * (filters.limit || 20),
        take: filters.limit || 20,
        orderBy: { uploadedAt: 'desc' },
      }),
      prisma.kycDocument.count({ where }),
    ]);

    // Transformer les données au format attendu
    const documents: KYCDocument[] = documentsData.map(doc => ({
      id: doc.id,
      userId: doc.userId,
      type: mapKycDocumentTypeFromDb(doc.type),
      status: mapKycStatusFromDb(doc.status) as any,
      providerId: doc.kycaidDocumentId || undefined,
      uploadedAt: doc.uploadedAt,
      reviewedAt: doc.reviewedAt || undefined,
      rejectionReason: doc.rejectionReason || undefined,
    }));

    return NextResponse.json({
      documents,
      total,
      page: filters.page || 1,
      limit: filters.limit || 20,
      totalPages: Math.ceil(total / (filters.limit || 20)),
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des documents KYC:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
