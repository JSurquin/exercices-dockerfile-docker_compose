import type { Prisma } from '@prisma/client';
import type { ConversationStatus, SenderType } from '@prisma/client';
import { prisma } from '~/prisma/prisma';
import { deriveConversationTitle } from '@/lib/chat-conversation-router';
import { resolveStatusAfterMessage } from '@/lib/chat-logic';

type MessageUserSelect = {
  id: true;
  name: true;
  email: true;
  steamUsername: true;
  steamAvatar: true;
};

const messageUserSelect = {
  id: true,
  name: true,
  email: true,
  steamUsername: true,
  steamAvatar: true,
} satisfies MessageUserSelect;

export async function touchConversationAfterMessage(
  conversationId: string,
  status: ConversationStatus,
  senderType: string,
  options?: { titleFromMessage?: string; hasSubject?: boolean },
) {
  const now = new Date();
  const data: Prisma.ConversationUpdateInput = {
    updatedAt: now,
    lastMessageAt: now,
    status: resolveStatusAfterMessage(status, senderType),
  };

  if (options?.titleFromMessage && !options.hasSubject) {
    data.subject = deriveConversationTitle(options.titleFromMessage);
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data,
  });
}

export async function createChatMessageRecord(params: {
  conversationId: string;
  userId: string | null;
  content: string;
  senderType: SenderType;
  metadata?: Prisma.InputJsonValue;
}) {
  const message = await prisma.chatMessage.create({
    data: {
      conversationId: params.conversationId,
      userId: params.userId,
      content: params.content,
      senderType: params.senderType,
      isRead: false,
      metadata: params.metadata,
    },
    include: {
      user: { select: messageUserSelect },
    },
  });

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.conversationId },
    select: { status: true, subject: true },
  });

  if (conversation) {
    await touchConversationAfterMessage(
      params.conversationId,
      conversation.status,
      params.senderType,
      {
        titleFromMessage: params.senderType === 'USER' ? params.content : undefined,
        hasSubject: Boolean(conversation.subject?.trim()),
      },
    );
  }

  return message;
}

export async function fetchConversationMessagesPage(params: {
  conversationId: string;
  cursor: string | null;
  limit: number;
}) {
  const cursorMessage = params.cursor
    ? await prisma.chatMessage.findUnique({
        where: { id: params.cursor },
        select: { id: true, createdAt: true, conversationId: true },
      })
    : null;

  if (cursorMessage && cursorMessage.conversationId !== params.conversationId) {
    throw new Error('INVALID_CURSOR');
  }

  const where: Prisma.ChatMessageWhereInput = {
    conversationId: params.conversationId,
    ...(cursorMessage
      ? { createdAt: { lt: cursorMessage.createdAt } }
      : {}),
  };

  const rows = await prisma.chatMessage.findMany({
    where,
    include: { user: { select: messageUserSelect } },
    orderBy: { createdAt: 'desc' },
    take: params.limit + 1,
  });

  const hasMore = rows.length > params.limit;
  const page = hasMore ? rows.slice(0, params.limit) : rows;
  const messages = page.reverse();
  const nextCursor = hasMore && messages.length > 0 ? messages[0].id : null;

  return { messages, nextCursor, hasMore };
}

export async function softDeleteConversation(conversationId: string) {
  const now = new Date();
  return prisma.conversation.update({
    where: { id: conversationId },
    data: {
      status: 'DELETED',
      deletedAt: now,
      updatedAt: now,
    },
  });
}
