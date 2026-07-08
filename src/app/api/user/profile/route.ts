import { NextRequest, NextResponse } from 'next/server';
import type { UserRole } from '@prisma/client';
import { auth } from '~/lib/auth';
import type { AuthUser } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { resolveUserContactEmail } from '@/lib/user-contact-email';

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
      contactEmail: string | null;
      email: string;
      role: UserRole;
      bonusRatePercent: number;
      userTag: string | null;
      affiliateStats: { isActive: boolean } | null;
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
          contactEmail: true,
          email: true,
          role: true,
          bonusRatePercent: true,
          userTag: true,
          affiliateStats: { select: { isActive: true } },
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

    const dbRole = dbRow?.role ?? user.role ?? 'USER';
    // Un seul indicateur fiable pour le menu : programme actif (toggle admin). Sinon un rôle AFFILIATE
    // résiduel après désactivation laissait le lien affiché.
    const canAccessAffiliateDashboard = dbRow?.affiliateStats?.isActive === true;
    const resolvedContactEmail = resolveUserContactEmail({
      contactEmail: dbRow?.contactEmail ?? null,
      email: dbRow?.email ?? user.email ?? null,
    });

    const responseUser = {
      id: user.id,
      steamId64: steamId,
      username: displayName,
      avatar: displayAvatar,
      contactEmail: resolvedContactEmail,
      role: dbRole,
      canAccessAffiliateDashboard,
      twoFactorEnabled: dbRow?.twoFactorEnabled ?? false,
      tradeLink: dbRow?.tradeLink ?? null,
      level: user.level || 1,
      xp: user.xp || 0,
      tickets: user.tickets || 0,
      fragments: dbRow?.fragments ?? (user as { fragments?: number }).fragments ?? 0,
      totalVolume: (user.totalVolumeCents || 0) / 100,
      bonusRatePercent: dbRow?.bonusRatePercent ?? 0,
      userTag: dbRow?.userTag ?? null,
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
