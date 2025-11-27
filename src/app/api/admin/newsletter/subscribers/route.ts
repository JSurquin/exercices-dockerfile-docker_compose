import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '~/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Accès non autorisé.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all'; // all, active, inactive

    const skip = (page - 1) * limit;

    // Construire les filtres
    const where: any = {};
    
    if (search) {
      where.email = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Récupérer les abonnés avec pagination
    const [subscribers, total] = await Promise.all([
      prisma.newsletterSubscriber.findMany({
        where,
        skip,
        take: limit,
        orderBy: { subscribedAt: 'desc' },
        select: {
          id: true,
          email: true,
          isActive: true,
          subscribedAt: true,
          unsubscribedAt: true,
        },
      }),
      prisma.newsletterSubscriber.count({ where }),
    ]);

    // Statistiques générales
    const stats = await prisma.newsletterSubscriber.groupBy({
      by: ['isActive'],
      _count: {
        id: true,
      },
    });

    const activeCount = stats.find(s => s.isActive)?._count.id || 0;
    const inactiveCount = stats.find(s => !s.isActive)?._count.id || 0;

    return NextResponse.json({
      subscribers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total: activeCount + inactiveCount,
        active: activeCount,
        inactive: inactiveCount,
      },
    });

  } catch (error) {
    console.error('Get newsletter subscribers error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Une erreur interne est survenue.' },
      { status: 500 }
    );
  }
}

// Supprimer un abonné (GDPR)
export async function DELETE(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Accès non autorisé.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const subscriberId = searchParams.get('id');

    if (!subscriberId) {
      return NextResponse.json(
        { error: 'ID_REQUIRED', message: 'ID de l\'abonné requis.' },
        { status: 400 }
      );
    }

    // Supprimer l'abonné
    await prisma.newsletterSubscriber.delete({
      where: { id: subscriberId },
    });

    console.log(`Abonné newsletter supprimé: ${subscriberId}`);

    return NextResponse.json({
      success: true,
      message: 'Abonné supprimé avec succès.',
    });

  } catch (error) {
    console.error('Delete newsletter subscriber error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Une erreur interne est survenue.' },
      { status: 500 }
    );
  }
}