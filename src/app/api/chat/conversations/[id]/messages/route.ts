import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import { resolveChatIdentity } from '@/lib/require-admin';
import { safeParseJson, safeParseSearchParams } from '@/lib/validation/helpers';
import {
  conversationMessagesQuerySchema,
  createChatMessageSchema,
} from '@/lib/validation/schemas/chat-api';
import { getChatAiQueueHint, maybeGenerateAiReply } from '@/lib/chat-ai-service';
import {
  canGuestAccessConversation,
  canUserAccessConversation,
  isConversationWriteBlockedForIdentity,
  resolveOutgoingSenderType,
  shouldInsertTicketTransmittedMessage,
  TICKET_TRANSMITTED_I18N_KEY,
} from '@/lib/chat-logic';
import {
  applyReadStateToMessagesForViewer,
  createChatMessageRecord,
  fetchConversationMessagesPage,
  markConversationMessagesAsReadForViewer,
} from '@/lib/chat-message-service';
import {
  extractCategoryFromSubcategoryKey,
  resolveConversationRoutingWithMessage,
} from '@/lib/chat-conversation-router';
import {
  redactEmailsForNonStaffViewer,
  redactEmailsInConversationForGuest,
} from '@/lib/chat-response-redact';
import { shouldRedactEmailsForViewer } from '@/lib/chat-logic';

async function assertConversationAccess(
  request: NextRequest,
  conversationId: string,
) {
  const identity = await resolveChatIdentity(request);
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { user: true },
  });

  if (!conversation) {
    return { error: NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 }) };
  }

  if (identity.kind === 'invalid') {
    return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) };
  }

  if (identity.kind === 'user') {
    const session = identity.session;
    if (
      !canUserAccessConversation({
        role: identity.role,
        userId: session.user.id,
        conversationUserId: conversation.userId,
        assignedTo: conversation.assignedTo,
      })
    ) {
      return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) };
    }
  } else if (!canGuestAccessConversation(conversation.userId)) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) };
  }

  return { identity, conversation };
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
    const access = await assertConversationAccess(request, resolvedParams.id);
    if ('error' in access && access.error) return access.error;
    const { identity, conversation } = access;

    const { searchParams } = new URL(request.url);
    const parsedQ = safeParseSearchParams(searchParams, conversationMessagesQuerySchema);
    if (!parsedQ.ok) return parsedQ.response;

    const page = await fetchConversationMessagesPage({
      conversationId: resolvedParams.id,
      cursor: parsedQ.data.cursor ?? null,
      limit: parsedQ.data.limit,
    });

    if (identity?.kind === 'user') {
      await markConversationMessagesAsReadForViewer({
        conversationId: resolvedParams.id,
        role: identity.role,
      });
    }

    const readAdjusted =
      identity?.kind === 'user'
        ? applyReadStateToMessagesForViewer(page.messages, identity.role)
        : page.messages;

    const messages = readAdjusted.map((m) =>
      redactMessagePayload(m as unknown as Record<string, unknown>, identity),
    );

    return NextResponse.json({
      messages,
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
      status: conversation.status,
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
      select: { content: true },
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

    const routing = resolveConversationRoutingWithMessage({
      lastMessageAt: conversation.lastMessageAt,
      currentCategory: conversation.category,
      newCategory,
      priorUserMessages: priorUserMessages.map((m) => m.content),
      newMessage: body.content,
      forceNew: body.forceNew,
      existingMessages,
    });

    if (routing === 'new' && identity.kind === 'user') {
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
    } else if (routing === 'new' && identity.kind === 'guest') {
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
      if (identity.kind === 'user') {
        if (
          !canUserAccessConversation({
            role: identity.role,
            userId: identity.session.user.id,
            conversationUserId: conversation.userId,
            assignedTo: conversation.assignedTo,
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

    const message = await createChatMessageRecord({
      conversationId: conversation.id,
      userId: identity.kind === 'user' ? identity.session.user.id : null,
      content: body.content,
      senderType,
    });

    let aiQueueHint = null;

    if (senderType === 'USER') {
      const existingMessages = await prisma.chatMessage.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'asc' },
        select: { senderType: true, id: true },
      });

      if (shouldInsertTicketTransmittedMessage(existingMessages, message.id, senderType)) {
        await createChatMessageRecord({
          conversationId: conversation.id,
          userId: null,
          content: TICKET_TRANSMITTED_I18N_KEY,
          senderType: 'SYSTEM',
        });
      }

      aiQueueHint = getChatAiQueueHint({
        assignedTo: conversation.assignedTo,
        status: conversation.status,
        hasModeratorMessage: existingMessages.some((m) => m.senderType === 'MODERATOR'),
      });
    }

    if (identity.kind === 'user') {
      await logger.info(identity.session.user.id, 'MESSAGE_SENT', {
        messageId: message.id,
        conversationId: conversation.id,
        senderType,
        contentLength: body.content.length,
      });
    }

    if (senderType === 'USER') {
      after(() => maybeGenerateAiReply(conversation!.id));
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
