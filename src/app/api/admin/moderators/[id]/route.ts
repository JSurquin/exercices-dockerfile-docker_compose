import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { prisma } from '~/prisma/prisma';
import { logger, logAudit } from '@/lib/logger';

// DELETE /api/admin/moderators/[id] - Rétrograder un modérateur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (user.role !== 'MODERATOR') {
      return NextResponse.json({ error: 'L\'utilisateur n\'est pas modérateur' }, { status: 400 });
    }

    // Empêcher de se rétrograder soi-même
    if (user.id === session.user.id) {
      return NextResponse.json({ error: 'Impossible de se rétrograder soi-même' }, { status: 400 });
    }

    const affiliateRow = await prisma.affiliateStats.findUnique({
      where: { userId: resolvedParams.id },
      select: { isActive: true },
    });

    // Rétablir AFFILIATE si le compte a encore un programme affilié actif (promotion modérateur écrase le rôle)
    const roleAfterDemote = affiliateRow?.isActive ? 'AFFILIATE' : 'USER';

    // Désassigner toutes les conversations assignées à ce modérateur
    await prisma.conversation.updateMany({
      where: { assignedTo: resolvedParams.id },
      data: { assignedTo: null },
    });

    // Rétrograder l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: resolvedParams.id },
      data: { role: roleAfterDemote },
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
    await logAudit(session.user.id, 'MODERATOR_DEMOTED', {
      targetUserId: resolvedParams.id,
      targetUserEmail: user.email,
      previousRole: 'MODERATOR',
      newRole: roleAfterDemote,
      restoredAffiliate: roleAfterDemote === 'AFFILIATE',
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    logger.error('Erreur lors de la rétrogradation du modérateur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET /api/admin/moderators/[id] - Récupérer les détails d'un modérateur
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const moderator = await prisma.user.findUnique({
      where: { id: resolvedParams.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        steamUsername: true,
        steamAvatar: true,
        assignedConversations: {
          select: {
            id: true,
            subject: true,
            status: true,
            priority: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                name: true,
                email: true,
                steamUsername: true,
              },
            },
            _count: {
              select: {
                messages: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: 10,
        },
        chatMessages: {
          where: {
            senderType: 'MODERATOR',
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            conversation: {
              select: {
                id: true,
                subject: true,
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
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
    });

    if (!moderator) {
      return NextResponse.json({ error: 'Modérateur non trouvé' }, { status: 404 });
    }

    if (moderator.role !== 'MODERATOR' && moderator.role !== 'ADMIN') {
      return NextResponse.json({ error: 'L\'utilisateur n\'est pas modérateur' }, { status: 400 });
    }

    return NextResponse.json(moderator);
  } catch (error) {
    logger.error('Erreur lors de la récupération du modérateur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
