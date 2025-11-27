import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Utiliser les données de session directement (éviter requête DB qui peut planter)
    let tradeLink = null;
    try {
      // Seulement requêter le tradeLink qui n'est pas dans la session
      const userTradeLink = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { tradeLink: true }
      });
      tradeLink = userTradeLink?.tradeLink;
    } catch (error) {
      console.error('Error fetching trade link:', error);
      // Continuer sans le tradeLink si erreur
    }

    const user = {
      id: session.user.id,
      name: session.user.name,
      image: session.user.image,
      steamId: session.user.steamId,
      steamUsername: session.user.steamUsername,
      steamAvatar: session.user.steamAvatar,
      tradeLink: tradeLink,
      level: session.user.level || 1,
      xp: session.user.xp || 0,
      tickets: session.user.tickets || 0,
      totalVolumeCents: session.user.totalVolumeCents || 0,
      kycStatus: session.user.kycStatus || 'PENDING',
      acceptedTermsAt: session.user.acceptedTermsAt,
      createdAt: session.user.createdAt || new Date(),
    };

    // Convertir vers le format attendu par le frontend
    const responseUser = {
      id: user.id,
      steamId64: user.steamId || '',
      username: user.name || user.steamUsername || 'User',
      avatar: user.image || user.steamAvatar || '',
      tradeLink: user.tradeLink,
      level: user.level,
      xp: user.xp,
      tickets: user.tickets,
      totalVolume: user.totalVolumeCents / 100, // Convertir centimes en euros
      kycStatus: user.kycStatus,
      acceptedTermsAt: user.acceptedTermsAt,
      joinedAt: user.createdAt,
    };

    return NextResponse.json(responseUser);
  } catch (error) {
    console.error('User profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
