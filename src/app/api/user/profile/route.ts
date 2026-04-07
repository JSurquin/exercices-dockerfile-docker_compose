import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import type { AuthUser } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // AuthUser contient tous les additionalFields (steamId, role, level, etc.)
    const user = session.user as AuthUser;

    let dbRow: {
      tradeLink: string | null;
      steamId: string | null;
      steamUsername: string | null;
      steamAvatar: string | null;
      twoFactorEnabled: boolean;
      name: string | null;
      image: string | null;
      fragments: number;
      email: string | null;
    } | null = null;

    try {
      dbRow = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          tradeLink: true,
          steamId: true,
          steamUsername: true,
          steamAvatar: true,
          twoFactorEnabled: true,
          name: true,
          image: true,
          fragments: true,
          email: true,
        },
      });
    } catch (error) {
      console.error('Error fetching user profile fields:', error);
    }

    const steamId = dbRow?.steamId ?? user.steamId ?? '';
    const steamUsername = dbRow?.steamUsername ?? user.steamUsername ?? null;
    const steamAvatar = dbRow?.steamAvatar ?? user.steamAvatar ?? null;
    const accountName = dbRow?.name ?? user.name ?? null;
    const accountImage = dbRow?.image ?? user.image ?? null;

    const displayName = (steamUsername?.trim() || accountName?.trim() || 'User').trim();
    const displayAvatar = (steamAvatar?.trim() || accountImage?.trim() || '').trim();

    const responseUser = {
      id: user.id,
      steamId64: steamId,
      username: displayName,
      avatar: displayAvatar,
      email: dbRow?.email ?? null,
      role: user.role || 'USER',
      twoFactorEnabled: dbRow?.twoFactorEnabled ?? false,
      tradeLink: dbRow?.tradeLink ?? null,
      level: user.level || 1,
      xp: user.xp || 0,
      tickets: user.tickets || 0,
      fragments: dbRow?.fragments ?? (user as { fragments?: number }).fragments ?? 0,
      totalVolume: (user.totalVolumeCents || 0) / 100,
      kycStatus: user.kycStatus || 'PENDING',
      acceptedTermsAt: user.acceptedTermsAt,
      joinedAt: user.createdAt || new Date(),
    };

    return NextResponse.json(responseUser);
  } catch (error) {
    console.error('User profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
