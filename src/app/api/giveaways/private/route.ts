import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';

/**
 * GET /api/giveaways/private?affiliateCode=CODE
 * Retourne les giveaways privés associés à un code affilié donné.
 * Utilisé par le dashboard affilié pour afficher les liens rapides.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const affiliateCode = searchParams.get('affiliateCode');

    if (!affiliateCode) {
      return NextResponse.json({ error: 'affiliateCode requis' }, { status: 400 });
    }

    const giveaways = await prisma.giveaway.findMany({
      where: {
        isPrivate: true,
        requiredAffiliateCode: affiliateCode,
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
