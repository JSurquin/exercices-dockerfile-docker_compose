import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import { UpdateConversationStatusRequest } from '@/lib/types/chat';

// GET /api/chat/conversations/[id] - Récupérer une conversation spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await auth.api.getSession({
        headers: request.headers,
      });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: resolvedParams.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            steamUsername: true,
            steamAvatar: true,
          },
        },
        assignedModerator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                steamUsername: true,
                steamAvatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 });
    }

    // Vérifier les permissions
    const isAdmin = session.user.role === 'ADMIN';
    const isModerator = session.user.role === 'MODERATOR';
    const isOwner = conversation.userId === session.user.id;
    const isAssigned = conversation.assignedTo === session.user.id;

    if (!isAdmin && !isModerator && !isOwner && !isAssigned) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Marquer les messages comme lus pour l'utilisateur connecté
    if (isOwner || isAssigned || isModerator || isAdmin) {
      await prisma.chatMessage.updateMany({
        where: {
          conversationId: resolvedParams.id,
          isRead: false,
          NOT: {
            userId: session.user.id, // Ne pas marquer ses propres messages comme lus
          },
        },
        data: {
          isRead: true,
        },
      });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    logger.error('Erreur lors de la récupération de la conversation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/chat/conversations/[id] - Mettre à jour une conversation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await auth.api.getSession({
        headers: request.headers,
      });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body: UpdateConversationStatusRequest = await request.json();

    // Vérifier les permissions
    const isAdmin = session.user.role === 'ADMIN';
    const isModerator = session.user.role === 'MODERATOR';

    if (!isAdmin && !isModerator) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 });
    }

    // Mettre à jour la conversation
    const updatedConversation = await prisma.conversation.update({
      where: { id: resolvedParams.id },
      data: {
        status: body.status,
        closedAt: body.status === 'CLOSED' ? new Date() : null,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            steamUsername: true,
            steamAvatar: true,
          },
        },
        assignedModerator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                steamUsername: true,
                steamAvatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // Log de l'audit
    await logger.info(session.user.id, 'CONVERSATION_UPDATED', {
      conversationId: resolvedParams.id,
      status: body.status,
      previousStatus: conversation.status,
    });

    return NextResponse.json(updatedConversation);
  } catch (error) {
    logger.error('Erreur lors de la mise à jour de la conversation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/chat/conversations/[id] - Supprimer une conversation (admin seulement)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await auth.api.getSession({
        headers: request.headers,
      });
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 });
    }

    await prisma.conversation.delete({
      where: { id: resolvedParams.id },
    });

    // Log de l'audit
    await logger.info(session.user.id, 'CONVERSATION_DELETED', {
      conversationId: resolvedParams.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Erreur lors de la suppression de la conversation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
