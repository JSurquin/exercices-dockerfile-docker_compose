import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

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

    // Créer le contenu CSV
    const csvHeader = 'Email,Statut,Date d\'inscription,Date de désabonnement\n';
    const csvContent = subscribers.map(subscriber => {
      const status = subscriber.isActive ? 'Actif' : 'Désabonné';
      const subscribedDate = subscriber.subscribedAt.toISOString().split('T')[0];
      const unsubscribedDate = subscriber.unsubscribedAt 
        ? subscriber.unsubscribedAt.toISOString().split('T')[0]
        : '';
      
      return `"${subscriber.email}","${status}","${subscribedDate}","${unsubscribedDate}"`;
    }).join('\n');

    const csv = csvHeader + csvContent;

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