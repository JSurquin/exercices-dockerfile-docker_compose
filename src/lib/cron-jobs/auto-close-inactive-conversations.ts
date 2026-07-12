import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import {
  CONVERSATION_AUTO_CLOSED_I18N_KEY,
  CONVERSATION_AUTO_CLOSE_INACTIVITY_MS,
} from '@/lib/chat-logic';
import { createChatMessageRecord } from '@/lib/chat-message-service';

export async function runAutoCloseInactiveConversationsJob() {
  const cutoff = new Date(Date.now() - CONVERSATION_AUTO_CLOSE_INACTIVITY_MS);

  const staleConversations = await prisma.conversation.findMany({
    where: {
      status: 'ACTIVE',
      lastMessageAt: { lt: cutoff },
    },
    select: { id: true },
    take: 100,
    orderBy: { lastMessageAt: 'asc' },
  });

  let closedCount = 0;
  const errors: string[] = [];

  for (const conversation of staleConversations) {
    try {
      await createChatMessageRecord({
        conversationId: conversation.id,
        userId: null,
        content: CONVERSATION_AUTO_CLOSED_I18N_KEY,
        senderType: 'SYSTEM',
      });

      await prisma.chatMessage.updateMany({
        where: {
          conversationId: conversation.id,
          isRead: false,
          senderType: { not: 'USER' },
        },
        data: { isRead: true },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      closedCount += 1;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error while auto-closing conversation';
      errors.push(`${conversation.id}: ${message}`);
      logger.error('Auto-close inactive conversation failed', {
        conversationId: conversation.id,
        error,
      });
    }
  }

  if (closedCount > 0) {
    logger.info('Auto-closed inactive support conversations', {
      closedCount,
      cutoff: cutoff.toISOString(),
    });
  }

  return {
    success: errors.length === 0,
    scanned: staleConversations.length,
    closedCount,
    errors,
  };
}
