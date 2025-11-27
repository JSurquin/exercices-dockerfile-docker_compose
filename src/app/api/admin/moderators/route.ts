import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { logger, logAudit } from '@/lib/logger';

// GET /api/admin/moderators - Récupérer la liste des modérateurs
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
        headers: request.headers,
      });
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const moderators = await prisma.user.findMany({
      where: {
        role: { in: ['MODERATOR', 'ADMIN'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        steamUsername: true,
        steamAvatar: true,
        _count: {
          select: {
            assignedConversations: true,
            chatMessages: {
              where: {
                senderType: 'MODERATOR',
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(moderators);
  } catch (error) {
    logger.error('Erreur lors de la récupération des modérateurs:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/admin/moderators - Promouvoir un utilisateur en modérateur
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
        headers: request.headers,
      });
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'ID utilisateur requis' }, { status: 400 });
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (user.role === 'MODERATOR') {
      return NextResponse.json({ error: 'L\'utilisateur est déjà modérateur' }, { status: 400 });
    }

    if (user.role === 'ADMIN') {
      return NextResponse.json({ error: 'Impossible de modifier le rôle d\'un administrateur' }, { status: 400 });
    }

    // Promouvoir l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: 'MODERATOR' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        steamUsername: true,
        steamAvatar: true,
      },
    });

    // Log de l'audit
    await logger.info(session.user.id, 'USER_PROMOTED_TO_MODERATOR', {
      targetUserId: userId,
      targetUserEmail: user.email,
      previousRole: user.role,
      newRole: 'MODERATOR',
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    logger.error('Erreur lors de la promotion en modérateur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
