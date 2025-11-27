import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { logger, logAudit } from '@/lib/logger';
import { CreateMessageRequest } from '@/lib/types/chat';

// POST /api/chat/messages - Créer un nouveau message
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
        headers: request.headers,
      });
    const body: CreateMessageRequest = await request.json();

    // Validation
    if (!body.content?.trim()) {
      return NextResponse.json({ error: 'Contenu du message requis' }, { status: 400 });
    }

    if (!body.conversationId) {
      return NextResponse.json({ error: 'ID de conversation requis' }, { status: 400 });
    }

    // Vérifier que la conversation existe
    const conversation = await prisma.conversation.findUnique({
      where: { id: body.conversationId },
      include: {
        user: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 });
    }

    // Vérifier les permissions
    let senderType = body.senderType || 'USER';
    
    if (session?.user) {
      const isAdmin = session.user.role === 'ADMIN';
      const isModerator = session.user.role === 'MODERATOR';
      const isOwner = conversation.userId === session.user.id;
      const isAssigned = conversation.assignedTo === session.user.id;

      if (!isAdmin && !isModerator && !isOwner && !isAssigned) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }

      // Déterminer le type d'expéditeur
      if (isModerator || isAdmin) {
        senderType = 'MODERATOR';
      } else {
        senderType = 'USER';
      }
    }

    // Vérifier que la conversation n'est pas fermée
    if (conversation.status === 'CLOSED' || conversation.status === 'ARCHIVED') {
      // Seuls les modérateurs et admins peuvent envoyer des messages dans une conversation fermée
      if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
        return NextResponse.json({ error: 'Conversation fermée' }, { status: 400 });
      }
    }

    // Créer le message
    const message = await prisma.chatMessage.create({
      data: {
        conversationId: body.conversationId,
        userId: session?.user?.id || null,
        content: body.content,
        senderType,
        isRead: false,
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
      },
    });

    // Mettre à jour la conversation
    await prisma.conversation.update({
      where: { id: body.conversationId },
      data: {
        updatedAt: new Date(),
        // Réouvrir la conversation si elle était fermée et qu'un utilisateur envoie un message
        status: conversation.status === 'CLOSED' && senderType === 'USER' ? 'ACTIVE' : conversation.status,
      },
    });

    // Log de l'audit
    if (session?.user) {
      await logger.info(session.user.id, 'MESSAGE_SENT', {
        messageId: message.id,
        conversationId: body.conversationId,
        senderType,
        contentLength: body.content.length,
      });
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    logger.error('Erreur lors de la création du message:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
