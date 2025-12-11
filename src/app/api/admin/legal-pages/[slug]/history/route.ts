import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/admin/legal-pages/[slug]/history
 * Récupère l'historique des modifications d'une page légale
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const history = await prisma.legalPageHistory.findMany({
      where: { legalPageSlug: slug },
      orderBy: { changedAt: 'desc' },
      take: 50, // Limiter à 50 entrées
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching legal page history:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'historique' },
      { status: 500 }
    );
  }
}

