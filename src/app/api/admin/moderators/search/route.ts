import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

// GET /api/admin/moderators/search?q=... - Rechercher des utilisateurs promouvables
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
      return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        role: { notIn: ['ADMIN', 'MODERATOR'] },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { steamUsername: { contains: query, mode: 'insensitive' } },
          { steamId: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        steamUsername: true,
        steamAvatar: true,
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    logger.error('Erreur lors de la recherche d\'utilisateurs:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
