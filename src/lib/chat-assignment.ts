import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import { isValidModeratorRole } from '@/lib/chat-logic';

export async function assignConversationToModerator(params: {
  conversationId: string;
  moderatorId: string;
  assignedBy: string;
  previousAssignedTo?: string | null;
}): Promise<boolean> {
  const moderator = await prisma.user.findUnique({
    where: { id: params.moderatorId },
  });

  if (!moderator || !isValidModeratorRole(moderator.role)) {
    return false;
  }

  await prisma.conversation.update({
    where: { id: params.conversationId },
    data: {
      assignedTo: params.moderatorId,
      updatedAt: new Date(),
    },
  });

  await prisma.chatMessage.create({
    data: {
      conversationId: params.conversationId,
      userId: null,
      content: `__i18n:moderation.conversation.system.assigned|${moderator.name || moderator.email}__`,
      senderType: 'SYSTEM',
      isRead: false,
    },
  });

  await logger.info(params.assignedBy, 'CONVERSATION_ASSIGNED', {
    conversationId: params.conversationId,
    assignedTo: params.moderatorId,
    assignedBy: params.assignedBy,
    previousAssignedTo: params.previousAssignedTo ?? null,
    autoAssigned: params.assignedBy === params.moderatorId,
  });

  return true;
}

/** Assigne automatiquement le modérateur qui répond sur un ticket encore non assigné. */
export async function autoAssignModeratorOnReplyIfUnassigned(params: {
  conversationId: string;
  moderatorId: string;
  assignedTo: string | null;
}): Promise<boolean> {
  if (params.assignedTo !== null) {
    return false;
  }

  return assignConversationToModerator({
    conversationId: params.conversationId,
    moderatorId: params.moderatorId,
    assignedBy: params.moderatorId,
    previousAssignedTo: null,
  });
}
