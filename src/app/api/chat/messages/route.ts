import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import { resolveChatIdentity } from '@/lib/require-admin';
import { safeParseJson } from '@/lib/validation/helpers';
import { createChatMessageSchema } from '@/lib/validation/schemas/chat-api';

// POST /api/chat/messages - Créer un nouveau message
export async function POST(request: NextRequest) {
  try {
    const identity = await resolveChatIdentity(request);
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      raw = {};
    }
    const parsed = safeParseJson(raw, createChatMessageSchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const body = parsed.data;

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

    if (identity.kind === 'invalid') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Vérifier les permissions
    let senderType = body.senderType || 'USER';

    if (identity.kind === 'user') {
      const session = identity.session;
      const isAdmin = identity.role === 'ADMIN';
      const isModerator = identity.role === 'MODERATOR';
      const isOwner = conversation.userId === session.user.id;
      const isAssigned = conversation.assignedTo === session.user.id;

      if (!isAdmin && !isModerator && !isOwner && !isAssigned) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }

      senderType = isModerator || isAdmin ? 'MODERATOR' : 'USER';
    } else {
      // Invité : autorisé uniquement sur les conversations sans userId
      if (conversation.userId !== null) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
      }
      senderType = 'USER';
    }

    // Vérifier que la conversation n'est pas fermée
    if (conversation.status === 'CLOSED' || conversation.status === 'ARCHIVED') {
      const staffOk =
        identity.kind === 'user' &&
        (identity.role === 'ADMIN' || identity.role === 'MODERATOR');
      if (!staffOk) {
        return NextResponse.json({ error: 'Conversation fermée' }, { status: 400 });
      }
    }

    // Créer le message
    const message = await prisma.chatMessage.create({
      data: {
        conversationId: body.conversationId,
        userId: identity.kind === 'user' ? identity.session.user.id : null,
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
        status: conversation.status === 'CLOSED' && senderType === 'USER' ? 'ACTIVE' : conversation.status,
      },
    });

    // Ajouter un message système "ticket transmis" si c'est la première réponse de l'utilisateur après un message BOT
    if (senderType === 'USER') {
      const existingMessages = await prisma.chatMessage.findMany({
        where: { conversationId: body.conversationId },
        orderBy: { createdAt: 'asc' },
        select: { senderType: true, id: true },
      });

      const hasBotMessage = existingMessages.some((m) => m.senderType === 'BOT');
      const userMessagesBeforeThis = existingMessages.filter(
        (m) => m.senderType === 'USER' && m.id !== message.id
      );

      if (hasBotMessage && userMessagesBeforeThis.length === 0) {
        await prisma.chatMessage.create({
          data: {
            conversationId: body.conversationId,
            userId: null,
            content:
              '✅ Votre demande a bien été transmise à notre équipe. Un modérateur vous répondra rapidement. Merci de votre patience 🙏',
            senderType: 'SYSTEM',
            isRead: false,
          },
        });
      }
    }

    // Log de l'audit
    if (identity.kind === 'user') {
      await logger.info(identity.session.user.id, 'MESSAGE_SENT', {
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
