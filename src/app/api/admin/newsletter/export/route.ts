import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { logger } from '@/lib/logger';


export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const session = await requireAdminSessionWithDbCheck(request);

    if (!session) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Accès non autorisé.' },
        { status: 401 }
      );
    }

    // Récupérer tous les abonnés
    const subscribers = await prisma.newsletterSubscriber.findMany({
      orderBy: { subscribedAt: 'desc' },
      select: {
        email: true,
        isActive: true,
        subscribedAt: true,
        unsubscribedAt: true,
      },
    });

    function escapeCsvField(value: string): string {
      const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
      return `"${safe.replace(/"/g, '""')}"`;
    }

    // Créer le contenu CSV
    const csvHeader = [
      escapeCsvField('Email'),
      escapeCsvField('Statut'),
      escapeCsvField("Date d'inscription"),
      escapeCsvField('Date de désabonnement'),
    ].join(',') + '\n';
    const csvContent = subscribers.map(subscriber => {
      const status = subscriber.isActive ? 'Actif' : 'Désabonné';
      const subscribedDate = subscriber.subscribedAt.toISOString().split('T')[0];
      const unsubscribedDate = subscriber.unsubscribedAt
        ? subscriber.unsubscribedAt.toISOString().split('T')[0]
        : '';

      return [
        escapeCsvField(subscriber.email),
        escapeCsvField(status),
        escapeCsvField(subscribedDate),
        escapeCsvField(unsubscribedDate),
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvContent;

    logger.info('Admin newsletter export', {
      adminId: session.user.id,
      subscriberCount: subscribers.length,
      ip: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown',
    });

    // Retourner le fichier CSV
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error('Export newsletter subscribers error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Une erreur interne est survenue.' },
      { status: 500 }
    );
  }
}