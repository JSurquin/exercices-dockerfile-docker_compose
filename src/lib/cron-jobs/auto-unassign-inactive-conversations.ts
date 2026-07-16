import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import { CONVERSATION_AUTO_UNASSIGN_INACTIVITY_MS } from '@/lib/chat-logic';
import { createChatMessageRecord } from '@/lib/chat-message-service';

export async function runAutoUnassignInactiveConversationsJob() {
  const cutoff = new Date(Date.now() - CONVERSATION_AUTO_UNASSIGN_INACTIVITY_MS);

  const staleConversations = await prisma.conversation.findMany({
    where: {
      status: 'ACTIVE',
      assignedTo: { not: null },
      lastMessageAt: { lt: cutoff },
    },
    select: { id: true, aiEnabled: true },
    take: 100,
    orderBy: { lastMessageAt: 'asc' },
  });

  let unassignedCount = 0;
  const errors: string[] = [];

  for (const conversation of staleConversations) {
    try {
      await createChatMessageRecord({
        conversationId: conversation.id,
        userId: null,
        content: '__i18n:moderation.conversation.system.unassigned__',
        senderType: 'SYSTEM',
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          assignedTo: null,
          aiEnabled: conversation.aiEnabled === false ? true : conversation.aiEnabled,
          updatedAt: new Date(),
        },
      });

      unassignedCount += 1;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error while auto-unassigning conversation';
      errors.push(`${conversation.id}: ${message}`);
      logger.error('Auto-unassign inactive conversation failed', {
        conversationId: conversation.id,
        error,
      });
    }
  }

  if (unassignedCount > 0) {
    logger.info('Auto-unassigned inactive support conversations', {
      unassignedCount,
      cutoff: cutoff.toISOString(),
    });
  }

  return {
    success: errors.length === 0,
    scanned: staleConversations.length,
    unassignedCount,
    errors,
  };
}
