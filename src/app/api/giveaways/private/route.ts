import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { requireUserSession } from '@/lib/require-session-user';

/**
 * GET /api/giveaways/private?affiliateCode=CODE
 * Giveaways privés : uniquement pour l’affilié connecté dont le code correspond.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireUserSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const affiliateCode = searchParams.get('affiliateCode');

    if (!affiliateCode) {
      return NextResponse.json({ error: 'affiliateCode requis' }, { status: 400 });
    }

    const withAffiliate = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        affiliateStats: { select: { code: true, isActive: true } },
      },
    });

    const myCode = withAffiliate?.affiliateStats?.code;
    if (
      !myCode ||
      withAffiliate?.affiliateStats?.isActive === false ||
      myCode.toUpperCase() !== affiliateCode.trim().toUpperCase()
    ) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const giveaways = await prisma.giveaway.findMany({
      where: {
        isPrivate: true,
        requiredAffiliateCode: myCode,
      },
      select: {
        id: true,
        title: true,
        status: true,
        endDate: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(giveaways);
  } catch (error) {
    console.error('Error fetching private giveaways:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des giveaways privés' },
      { status: 500 }
    );
  }
}
