import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import { resolveChatIdentity } from '@/lib/require-admin';
import { safeParseJson, safeParseSearchParams } from '@/lib/validation/helpers';
import {
  conversationMessagesQuerySchema,
  createChatMessageSchema,
} from '@/lib/validation/schemas/chat-api';
import { maybeGenerateAiReply } from '@/lib/chat-ai-service';
import { shouldTriggerAiForUserMessage } from '@/lib/chat-ai-guards';
import {
  canGuestAccessConversation,
  canUserAccessConversation,
  isConversationHiddenFromClientViewer,
  isConversationWriteBlockedForIdentity,
  isStaffRole,
  resolveChatAccessScope,
  resolveOutgoingSenderType,
} from '@/lib/chat-logic';
import {
  applyReadStateToMessagesForViewer,
  createChatMessageRecord,
  fetchConversationMessagesPage,
  markConversationMessagesAsReadForViewer,
} from '@/lib/chat-message-service';
import { handleUserMessageSideEffects } from '@/lib/chat-escalation';
import {
  extractCategoryFromSubcategoryKey,
  resolveConversationRoutingWithMessage,
} from '@/lib/chat-conversation-router';
import {
  redactEmailsForNonStaffViewer,
  redactEmailsInConversationForGuest,
} from '@/lib/chat-response-redact';
import { shouldRedactEmailsForViewer } from '@/lib/chat-logic';
import {
  CHAT_ASSIGNED_MODERATOR_SELECT,
  touchStaffPresenceFromRole,
} from '@/lib/chat-staff-presence';
import {
  buildOutgoingMessageLocaleMetadata,
  localizeChatMessagesForViewer,
  prepareModeratorMessageMetadata,
  resolveConversationClientLocale,
} from '@/lib/chat-support-translation';
import { isValidChatAiLocale } from '@/lib/chat-ai-locale';

async function assertConversationAccess(
  request: NextRequest,
  conversationId: string,
  options?: { scope?: 'widget' | 'staff'; replyContext?: 'widget' | 'moderation' },
) {
  const identity = await resolveChatIdentity(request);
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      user: true,
      assignedModerator: {
        select: CHAT_ASSIGNED_MODERATOR_SELECT,
      },
    },
  });

  if (!conversation) {
    return { error: NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 }) };
  }

  if (identity.kind === 'invalid') {
    return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) };
  }

  const scope = resolveChatAccessScope({
    explicitScope: options?.scope,
    replyContext: options?.replyContext,
  });

  if (
    isConversationHiddenFromClientViewer({
      status: conversation.status,
      scope,
      role: identity.kind === 'user' ? identity.role : undefined,
    })
  ) {
    return { error: NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 }) };
  }

  if (identity.kind === 'user') {
    const session = identity.session;
    if (scope === 'staff' && !isStaffRole(identity.role)) {
      return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) };
    }
    if (
      !canUserAccessConversation({
        role: identity.role,
        userId: session.user.id,
        conversationUserId: conversation.userId,
        assignedTo: conversation.assignedTo,
        scope,
      })
    ) {
      return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) };
    }
  } else if (!canGuestAccessConversation(conversation.userId)) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) };
  }

  return { identity, conversation, scope };
}

function redactMessagePayload(
  message: Record<string, unknown>,
  identity: Exclude<Awaited<ReturnType<typeof assertConversationAccess>>['identity'], undefined>,
) {
  const redactMode = shouldRedactEmailsForViewer({
    identityKind: identity.kind,
    role: identity.kind === 'user' ? identity.role : undefined,
  });
  if (redactMode === 'guest') {
    const redacted = redactEmailsInConversationForGuest({ messages: [message] }) as {
      messages: Record<string, unknown>[];
    };
    return redacted.messages[0] ?? message;
  }
  if (redactMode === 'non-staff-user' && identity.kind === 'user') {
    const redacted = redactEmailsForNonStaffViewer({ messages: [message] }, identity.session.user.id) as {
      messages: Record<string, unknown>[];
    };
    return redacted.messages[0] ?? message;
  }
  return message;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    const parsedQ = safeParseSearchParams(searchParams, conversationMessagesQuerySchema);
    if (!parsedQ.ok) return parsedQ.response;

    const access = await assertConversationAccess(request, resolvedParams.id, {
      scope: parsedQ.data.scope,
    });
    if ('error' in access && access.error) return access.error;
    const { identity, conversation } = access;

    const page = await fetchConversationMessagesPage({
      conversationId: resolvedParams.id,
      cursor: parsedQ.data.cursor ?? null,
      limit: parsedQ.data.limit,
    });

    const viewerRole =
      identity?.kind === 'user' ? identity.role : identity?.kind === 'guest' ? 'USER' : null;

    if (parsedQ.data.markRead && viewerRole) {
      await markConversationMessagesAsReadForViewer({
        conversationId: resolvedParams.id,
        role: viewerRole,
      });
    }

    if (identity?.kind === 'user') {
      await touchStaffPresenceFromRole(identity.session.user.id, identity.role);
    }

    const readAdjusted =
      parsedQ.data.markRead && viewerRole
        ? applyReadStateToMessagesForViewer(page.messages, viewerRole)
        : page.messages;

    const messages = readAdjusted.map((m) =>
      redactMessagePayload(m as unknown as Record<string, unknown>, identity),
    );

    const viewerLocale =
      parsedQ.data.scope === 'staff' && isValidChatAiLocale(parsedQ.data.locale)
        ? parsedQ.data.locale
        : null;

    const localizedMessages = await localizeChatMessagesForViewer(
      messages as import('@/lib/chat-support-translation').LocalizedChatMessage[],
      {
        scope: parsedQ.data.scope,
        viewerLocale,
      },
    );

    return NextResponse.json({
      messages: localizedMessages,
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
      status: conversation.status,
      aiEnabled: conversation.aiEnabled,
      clientRating: conversation.clientRating,
      clientRatedAt: conversation.clientRatedAt,
      closedAt: conversation.closedAt,
      assignedModerator: conversation.assignedModerator,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_CURSOR') {
      return NextResponse.json({ error: 'Cursor invalide' }, { status: 400 });
    }
    logger.error('Erreur lors de la récupération des messages:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
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

    let conversation = await prisma.conversation.findUnique({
      where: { id: resolvedParams.id },
      include: { user: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 });
    }

    if (identity.kind === 'invalid') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const priorUserMessages = await prisma.chatMessage.findMany({
      where: { conversationId: conversation.id, senderType: 'USER' },
      orderBy: { createdAt: 'asc' },
      select: { content: true, metadata: true, senderType: true },
      take: 10,
    });

    const existingMessages = await prisma.chatMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      select: { senderType: true },
      take: 50,
    });

    const newCategory =
      body.category ?? extractCategoryFromSubcategoryKey(body.category ?? null);

    const skipRoutingFork = body.replyContext === 'moderation';

    const routing = skipRoutingFork
      ? ('same' as const)
      : resolveConversationRoutingWithMessage({
          lastMessageAt: conversation.lastMessageAt,
          currentCategory: conversation.category,
          newCategory,
          priorUserMessages: priorUserMessages.map((m) => m.content),
          newMessage: body.content,
          forceNew: body.forceNew,
          existingMessages,
        });

    if (!skipRoutingFork && routing === 'new' && identity.kind === 'user') {
      conversation = await prisma.conversation.create({
        data: {
          userId: identity.session.user.id,
          subject: null,
          category: newCategory ?? conversation.category,
          priority: 'NORMAL',
          status: 'ACTIVE',
          lastMessageAt: new Date(),
        },
        include: { user: true },
      });
    } else if (!skipRoutingFork && routing === 'new' && identity.kind === 'guest') {
      conversation = await prisma.conversation.create({
        data: {
          userId: null,
          subject: null,
          category: newCategory ?? conversation.category,
          priority: 'NORMAL',
          status: 'ACTIVE',
          lastMessageAt: new Date(),
        },
        include: { user: true },
      });
    } else {
      const accessScope = resolveChatAccessScope({ replyContext: body.replyContext });
      if (identity.kind === 'user') {
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
      messageMetadata = buildOutgoingMessageLocaleMetadata({
        senderType,
        content: body.content,
        uiLocale: body.locale,
      });
    } else if (senderType === 'MODERATOR') {
      const clientLocale = resolveConversationClientLocale(
        priorUserMessages.map((m) => ({
          senderType: m.senderType,
          content: m.content,
          metadata: m.metadata,
        })),
      );
      messageMetadata = await prepareModeratorMessageMetadata({
        content: body.content,
        uiLocale: body.locale,
        clientLocale,
      });
    }

    const message = await createChatMessageRecord({
      conversationId: conversation.id,
      userId: identity.kind === 'user' ? identity.session.user.id : null,
      content: body.content,
      senderType,
      metadata: messageMetadata,
    });

    let aiQueueHint = null;
    let shouldRunAi = false;

    if (senderType === 'USER') {
      const existingMessages = await prisma.chatMessage.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'asc' },
        select: { senderType: true, id: true },
      });

      const sideEffects = await handleUserMessageSideEffects({
        conversationId: conversation.id,
        messageId: message.id,
        messageContent: body.content,
        assignedTo: conversation.assignedTo,
        status: conversation.status,
        aiEnabled: conversation.aiEnabled,
        existingMessages,
        skipAi: body.skipAi,
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
        conversationId: conversation.id,
        senderType,
        contentLength: body.content.length,
      });
    }

    if (senderType === 'USER' && shouldRunAi) {
      after(() => maybeGenerateAiReply(conversation!.id, { locale: body.locale }));
    }

    return NextResponse.json(
      {
        message,
        conversationId: conversation.id,
        createdNewConversation: conversation.id !== resolvedParams.id,
        aiQueueHint,
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Erreur lors de l'envoi du message:", error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
