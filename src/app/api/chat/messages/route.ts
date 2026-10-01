import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import { resolveChatIdentity } from '@/lib/require-admin';
import { safeParseJson } from '@/lib/validation/helpers';
import { createChatMessageSchema } from '@/lib/validation/schemas/chat-api';
import { maybeGenerateAiReply } from '@/lib/chat-ai-service';
import { shouldTriggerAiForUserMessage } from '@/lib/chat-ai-guards';
import {
  canGuestAccessConversation,
  canUserAccessConversation,
  isConversationWriteBlockedForIdentity,
  isStaffRole,
  resolveChatAccessScope,
  resolveOutgoingSenderType,
} from '@/lib/chat-logic';
import { createChatMessageRecord } from '@/lib/chat-message-service';
import { handleUserMessageSideEffects } from '@/lib/chat-escalation';
import {
  extractCategoryFromSubcategoryKey,
  resolveConversationRoutingWithMessage,
} from '@/lib/chat-conversation-router';
import { touchStaffPresenceFromRole } from '@/lib/chat-staff-presence';
import {
  buildOutgoingMessageLocaleMetadata,
  prepareModeratorMessageMetadata,
  resolveConversationClientLocale,
} from '@/lib/chat-support-translation';
import { autoAssignModeratorOnReplyIfUnassigned } from '@/lib/chat-assignment';
import { mergeChatMessageMetadata, prepareChatOutgoingMessage } from '@/lib/chat-attachment';

// POST /api/chat/messages — création auto de conversation si conversationId absent
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
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    let outgoingMessage: ReturnType<typeof prepareChatOutgoingMessage>;
    try {
      outgoingMessage = prepareChatOutgoingMessage({
        content: body.content,
        attachmentUrl: body.attachmentUrl,
      });
    } catch {
      return NextResponse.json({ error: 'Image invalide' }, { status: 400 });
    }

    let conversationId = body.conversationId;
    let createdNewConversation = false;

    if (!conversationId) {
      const conv = await prisma.conversation.create({
        data: {
          userId: identity.kind === 'user' ? identity.session.user.id : null,
          category: body.category ?? null,
          priority: 'NORMAL',
          status: 'ACTIVE',
          lastMessageAt: new Date(),
        },
      });
      conversationId = conv.id;
      createdNewConversation = true;
    } else {
      const existing = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });
      if (!existing) {
        return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 });
      }

      const priorUserMessages = await prisma.chatMessage.findMany({
        where: { conversationId, senderType: 'USER' },
        orderBy: { createdAt: 'asc' },
        select: { content: true, metadata: true, senderType: true },
        take: 10,
      });

      // Réponse staff depuis /moderation : toujours sur le ticket ciblé, jamais de fork.
      if (body.replyContext !== 'moderation') {
        const existingMessages = await prisma.chatMessage.findMany({
          where: { conversationId },
          orderBy: { createdAt: 'asc' },
          select: { senderType: true },
          take: 50,
        });

        const newCategory = body.category ?? extractCategoryFromSubcategoryKey(body.category ?? null);
        const routing = resolveConversationRoutingWithMessage({
          lastMessageAt: existing.lastMessageAt,
          currentCategory: existing.category,
          newCategory,
          priorUserMessages: priorUserMessages.map((m) => m.content),
          newMessage: outgoingMessage.content,
          forceNew: body.forceNew,
          existingMessages,
        });

        if (routing === 'new') {
          const conv = await prisma.conversation.create({
            data: {
              userId: identity.kind === 'user' ? identity.session.user.id : existing.userId,
              category: newCategory ?? existing.category,
              priority: 'NORMAL',
              status: 'ACTIVE',
              lastMessageAt: new Date(),
            },
          });
          conversationId = conv.id;
          createdNewConversation = true;
        }
      }
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { user: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 });
    }

    if (identity.kind === 'invalid') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    if (identity.kind === 'user') {
      const accessScope = resolveChatAccessScope({ replyContext: body.replyContext });
      if (accessScope === 'staff' && !isStaffRole(identity.role)) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }
      if (
        !canUserAccessConversation({
          role: identity.role,
          userId: identity.session.user.id,
          conversationUserId: conversation.userId,
          assignedTo: conversation.assignedTo,
          scope: accessScope,
        })
      ) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }
    } else if (!canGuestAccessConversation(conversation.userId)) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const senderType = resolveOutgoingSenderType({
      identityKind: identity.kind,
      role: identity.kind === 'user' ? identity.role : undefined,
      replyContext: body.replyContext ?? 'widget',
    });

    if (
      isConversationWriteBlockedForIdentity(
        conversation.status,
        identity.kind,
        identity.kind === 'user' ? identity.role : undefined,
      )
    ) {
      return NextResponse.json({ error: 'Conversation fermée' }, { status: 400 });
    }

    let messageMetadata: Prisma.InputJsonValue | undefined;
    if (senderType === 'USER') {
      messageMetadata = mergeChatMessageMetadata(
        buildOutgoingMessageLocaleMetadata({
          senderType,
          content: outgoingMessage.content,
          uiLocale: body.locale,
        }),
        outgoingMessage.metadata,
      ) as Prisma.InputJsonValue | undefined;
    } else if (senderType === 'MODERATOR') {
      const priorUserMessages = await prisma.chatMessage.findMany({
        where: { conversationId, senderType: 'USER' },
        orderBy: { createdAt: 'asc' },
        select: { content: true, metadata: true, senderType: true },
        take: 10,
      });
      const clientLocale = resolveConversationClientLocale(
        priorUserMessages.map((m) => ({
          senderType: m.senderType,
          content: m.content,
          metadata: m.metadata,
        })),
      );
      messageMetadata = mergeChatMessageMetadata(
        await prepareModeratorMessageMetadata({
          content: outgoingMessage.content,
          uiLocale: body.locale,
          clientLocale,
        }),
        outgoingMessage.metadata,
      ) as Prisma.InputJsonValue | undefined;
    }

    if (senderType === 'MODERATOR' && identity.kind === 'user') {
      await autoAssignModeratorOnReplyIfUnassigned({
        conversationId,
        moderatorId: identity.session.user.id,
        assignedTo: conversation.assignedTo,
      });
    }

    const message = await createChatMessageRecord({
      conversationId,
      userId: identity.kind === 'user' ? identity.session.user.id : null,
      content: outgoingMessage.content,
      senderType,
      metadata: messageMetadata,
    });

    if (identity.kind === 'user') {
      await touchStaffPresenceFromRole(identity.session.user.id, identity.role);
    }

    let aiQueueHint = null;
    let shouldRunAi = false;

    if (senderType === 'USER') {
      const existingMessages = await prisma.chatMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        select: { senderType: true, id: true },
      });

      const sideEffects = await handleUserMessageSideEffects({
        conversationId,
        messageId: message.id,
        messageContent: outgoingMessage.content,
        assignedTo: conversation.assignedTo,
        status: conversation.status,
        aiEnabled: conversation.aiEnabled,
        existingMessages,
        skipAi: body.skipAi || outgoingMessage.skipAi,
      });
      aiQueueHint = sideEffects.aiQueueHint;
      shouldRunAi =
        !sideEffects.escalated &&
        conversation.aiEnabled !== false &&
        shouldTriggerAiForUserMessage(existingMessages, { skipAi: body.skipAi });
    }

    if (identity.kind === 'user') {
      await logger.info(identity.session.user.id, 'MESSAGE_SENT', {
        messageId: message.id,
        conversationId,
        senderType,
        contentLength: outgoingMessage.content.length,
      });
    }

    if (senderType === 'USER' && shouldRunAi) {
      after(() => maybeGenerateAiReply(conversationId, { locale: body.locale }));
    }

    return NextResponse.json(
      { ...message, conversationId, createdNewConversation, aiQueueHint },
      { status: 201 },
    );
  } catch (error) {
    logger.error('Erreur lors de la création du message:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
