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

    // Préférer la DB pour Steam (source de vérité après login) + session pour le reste
    let dbRow: {
      tradeLink: string | null;
      steamId: string | null;
      steamUsername: string | null;
      steamAvatar: string | null;
      name: string | null;
      image: string | null;
    } | null = null;

    try {
      dbRow = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          tradeLink: true,
          steamId: true,
          steamUsername: true,
          steamAvatar: true,
          name: true,
          image: true,
        },
      });
    } catch (error) {
      console.error('Error fetching user profile fields:', error);
    }

    const steamId = dbRow?.steamId ?? session.user.steamId ?? '';
    const steamUsername = dbRow?.steamUsername ?? session.user.steamUsername ?? null;
    const steamAvatar = dbRow?.steamAvatar ?? session.user.steamAvatar ?? null;
    const accountName = dbRow?.name ?? session.user.name ?? null;
    const accountImage = dbRow?.image ?? session.user.image ?? null;

    // Affichage header / vente : identité Steam du compte lié (pas un autre provider ni un nom générique seul)
    const displayName = (steamUsername?.trim() || accountName?.trim() || 'User').trim();
    const displayAvatar = (steamAvatar?.trim() || accountImage?.trim() || '').trim();

    const responseUser = {
      id: session.user.id,
      steamId64: steamId,
      username: displayName,
      avatar: displayAvatar,
      tradeLink: dbRow?.tradeLink ?? null,
      level: session.user.level || 1,
      xp: session.user.xp || 0,
      tickets: session.user.tickets || 0,
      totalVolume: (session.user.totalVolumeCents || 0) / 100,
      kycStatus: session.user.kycStatus || 'PENDING',
      acceptedTermsAt: session.user.acceptedTermsAt,
      joinedAt: session.user.createdAt || new Date(),
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
