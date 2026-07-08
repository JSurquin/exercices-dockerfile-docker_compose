import { NotificationPriority, NotificationType } from '@prisma/client';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import { getChatAiQueueHint } from '@/lib/chat-ai-service';
import type { ChatAiQueueHint } from '@/lib/chat-ai-service';
import {
  FOLLOW_UP_AWAITING_ACK_I18N_KEY,
  shouldInsertFollowUpAwaitingAcknowledgment,
  shouldInsertTicketTransmittedMessage,
  TICKET_TRANSMITTED_I18N_KEY,
} from '@/lib/chat-logic';
import { createChatMessageRecord } from '@/lib/chat-message-service';

const MODERATOR_REQUEST_PATTERNS: RegExp[] = [
  /\b(mod[ée]rateur(?:\s+humain)?|conseiller(?:\s+humain)?|agent(?:\s+humain)?|humain(?:e)?|personne(?:\s+réelle)?)\b/i,
  /\b(human(?:\s+moderator|\s+agent|\s+support)?|real(?:\s+person|\s+human)|live(?:\s+agent|\s+support))\b/i,
  /\b(contacter|contact(?:er)?|parler|discuter|passer|parler\s+à|speak\s+to|talk\s+to|connect\s+me)\b.{0,40}\b(mod[ée]rateur|humain|human|moderator|agent|support\s+humain)\b/i,
  /\b(je\s+veux|j['']aimerais|j['']ai\s+besoin|besoin\s+d['']|passe(?:z)?(?:-|\s)?moi|want\s+to\s+speak|need\s+a\s+human)\b.{0,40}\b(mod[ée]rateur|humain|human|moderator|agent)\b/i,
  /\b(passe(?:z)?(?:-|\s)?moi\s+(?:un|à\s+un)\s+mod[ée]rateur|passer\s+(?:à|au)\s+mod[ée]rateur|transfer(?:er)?\s+(?:to|vers)\s+(?:a\s+)?(?:human|moderator))\b/i,
];

export function isUserRequestingHumanModerator(message: string): boolean {
  const normalized = message.trim().replace(/\s+/g, ' ');
  if (!normalized) return false;
  return MODERATOR_REQUEST_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function conversationHasTicketTransmittedMessage(
  messages: Array<{ senderType: string; content?: string }>,
): boolean {
  return messages.some(
    (m) =>
      m.senderType === 'SYSTEM' && m.content === TICKET_TRANSMITTED_I18N_KEY,
  );
}

async function notifyModeratorsOfChatEscalation(params: {
  conversationId: string;
  userDisplayName: string;
  subject?: string | null;
}) {
  try {
    const staff = await prisma.user.findMany({
      where: { role: { in: ['MODERATOR', 'ADMIN'] } },
      select: { id: true },
    });
    if (staff.length === 0) return;

    const titleFr = 'Demande de modérateur';
    const titleEn = 'Moderator requested';
    const titleCn = '用户请求人工客服';
    const preview = params.subject?.trim() || 'Support chat';
    const messageFr = `${params.userDisplayName} demande un modérateur sur « ${preview} ».`;
    const messageEn = `${params.userDisplayName} requested a moderator on "${preview}".`;
    const messageCn = `${params.userDisplayName} 在「${preview}」请求人工客服。`;

    await prisma.notification.createMany({
      data: staff.map((member) => ({
        userId: member.id,
        type: NotificationType.ADMIN_MESSAGE,
        priority: NotificationPriority.HIGH,
        titleFr,
        titleEn,
        messageFr,
        messageEn,
        titleCn,
        messageCn,
        link: `/moderation/conversations/${params.conversationId}`,
        metadata: { conversationId: params.conversationId, event: 'chat_escalation' },
      })),
    });
  } catch (error) {
    logger.error('[chat-escalation] Échec notification modérateurs:', error);
  }
}

export async function escalateConversationToModerators(params: {
  conversationId: string;
  reason: 'user_request' | 'button';
  userDisplayName?: string;
}): Promise<{ alreadyEscalated: boolean; aiEnabled: boolean }> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: params.conversationId },
    include: {
      user: { select: { name: true, steamUsername: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        select: { senderType: true, content: true },
      },
    },
  });

  if (!conversation) {
    throw new Error('CONVERSATION_NOT_FOUND');
  }

  const alreadyEscalated = !conversation.aiEnabled;
  const hasTicketMessage = conversationHasTicketTransmittedMessage(conversation.messages);

  if (alreadyEscalated && hasTicketMessage) {
    return { alreadyEscalated: true, aiEnabled: false };
  }

  if (!alreadyEscalated) {
    await prisma.conversation.update({
      where: { id: params.conversationId },
      data: {
        aiEnabled: false,
        priority: conversation.priority === 'URGENT' ? 'URGENT' : 'HIGH',
        updatedAt: new Date(),
      },
    });
  }

  if (!hasTicketMessage) {
    await createChatMessageRecord({
      conversationId: params.conversationId,
      userId: null,
      content: TICKET_TRANSMITTED_I18N_KEY,
      senderType: 'SYSTEM',
    });
  }

  if (!alreadyEscalated) {
    const displayName =
      params.userDisplayName ??
      conversation.user?.steamUsername ??
      conversation.user?.name ??
      'Utilisateur';
    await notifyModeratorsOfChatEscalation({
      conversationId: params.conversationId,
      userDisplayName: displayName,
      subject: conversation.subject,
    });

    logger.info('[chat-escalation] Conversation escalated to moderator', {
      conversationId: params.conversationId,
      reason: params.reason,
    });
  }

  return { alreadyEscalated, aiEnabled: false };
}

export async function handleUserMessageSideEffects(params: {
  conversationId: string;
  messageId: string;
  messageContent: string;
  assignedTo: string | null;
  status: string;
  aiEnabled: boolean;
  existingMessages: Array<{ senderType: string; id: string }>;
}): Promise<{ aiQueueHint: ChatAiQueueHint | null; escalated: boolean }> {
  let aiEnabled = params.aiEnabled !== false;
  let escalated = false;

  if (aiEnabled && isUserRequestingHumanModerator(params.messageContent)) {
    await escalateConversationToModerators({
      conversationId: params.conversationId,
      reason: 'user_request',
    });
    aiEnabled = false;
    escalated = true;
  } else if (
    shouldInsertTicketTransmittedMessage(
      params.existingMessages,
      params.messageId,
      'USER',
    )
  ) {
    await createChatMessageRecord({
      conversationId: params.conversationId,
      userId: null,
      content: TICKET_TRANSMITTED_I18N_KEY,
      senderType: 'SYSTEM',
    });
  } else if (
    shouldInsertFollowUpAwaitingAcknowledgment(
      params.existingMessages,
      params.messageId,
      'USER',
      params.assignedTo,
    )
  ) {
    await createChatMessageRecord({
      conversationId: params.conversationId,
      userId: null,
      content: FOLLOW_UP_AWAITING_ACK_I18N_KEY,
      senderType: 'BOT',
    });
  }

  const aiQueueHint = aiEnabled
    ? getChatAiQueueHint({
        assignedTo: params.assignedTo,
        status: params.status,
        hasModeratorMessage: params.existingMessages.some(
          (m) => m.senderType === 'MODERATOR',
        ),
        aiEnabled,
      })
    : null;

  return { aiQueueHint, escalated };
}
