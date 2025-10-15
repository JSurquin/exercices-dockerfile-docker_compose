import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
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

    // Récupérer les données complètes de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        image: true,
        steamId: true,
        steamUsername: true,
        steamAvatar: true,
        tradeLink: true,
        level: true,
        xp: true,
        tickets: true,
        totalVolumeCents: true,
        kycStatus: true,
        acceptedTermsAt: true,
        createdAt: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

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
  } finally {
    await prisma.$disconnect();
  }
}
