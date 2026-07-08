import type { ConversationStatus, UserRole } from '@prisma/client';
import type { ConversationFilters } from '@/lib/types/chat';
import { isConversationAwaitingStaffReply } from '@/lib/chat-conversation-router';

export type ChatIdentityKind = 'guest' | 'invalid' | 'user';

export const STAFF_SENDER_TYPES_FOR_NOTIFICATION = ['MODERATOR', 'BOT', 'SYSTEM'] as const;

export const TERMINAL_CONVERSATION_STATUSES = ['CLOSED', 'ARCHIVED', 'DELETED'] as const;

export function isTerminalConversationStatus(status: string): boolean {
  return (TERMINAL_CONVERSATION_STATUSES as readonly string[]).includes(status);
}

/** Contenu SYSTEM multilingue après la première réponse utilisateur post-BOT. */
export const TICKET_TRANSMITTED_I18N_KEY =
  '__i18n:chatWidget.responses.ticketTransmitted__';

/** Réponse BOT classique (sans IA) quand l'utilisateur relance en attendant le staff. */
export const FOLLOW_UP_AWAITING_ACK_I18N_KEY =
  '__i18n:chatWidget.responses.followUpAcknowledged__';

/** Fallback BOT si Ollama échoue alors que l'IA devait répondre. */
export const AI_UNAVAILABLE_I18N_KEY =
  '__i18n:chatWidget.responses.aiUnavailable__';

export const AWAITING_STAFF_REPLY_CLEAR_SENDER_TYPES = ['AI', 'BOT', 'MODERATOR'] as const;

/** True quand un message staff clôt l'attente de réponse (ignore SYSTEM ticket transmis). */
export function shouldClearAwaitingStaffReply(
  message: { senderType: string } | null | undefined,
): boolean {
  if (!message || message.senderType === 'USER') return false;
  return (AWAITING_STAFF_REPLY_CLEAR_SENDER_TYPES as readonly string[]).includes(
    message.senderType,
  );
}

export function isStaffRole(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'MODERATOR';
}

/** Invité : accès uniquement aux conversations sans userId (guest ticket). */
export function canGuestAccessConversation(conversationUserId: string | null): boolean {
  return conversationUserId === null;
}

export type ChatAccessScope = 'widget' | 'staff';

export function resolveChatAccessScope(params: {
  explicitScope?: ChatAccessScope;
  replyContext?: ChatReplyContext;
}): ChatAccessScope {
  if (params.explicitScope) return params.explicitScope;
  if (params.replyContext === 'moderation') return 'staff';
  return 'widget';
}

/** widget = support client (propriétaire uniquement) ; staff = backoffice modération */
export function canUserAccessConversation(params: {
  role: UserRole;
  userId: string;
  conversationUserId: string | null;
  assignedTo: string | null;
  scope?: ChatAccessScope;
}): boolean {
  const scope = params.scope ?? 'widget';
  if (scope === 'widget') {
    return params.conversationUserId === params.userId;
  }
  if (isStaffRole(params.role)) return true;
  return params.conversationUserId === params.userId;
}

export type ChatReplyContext = 'widget' | 'moderation';

export function resolveOutgoingSenderType(params: {
  identityKind: ChatIdentityKind;
  role?: UserRole;
  /** widget = support client (toujours USER) ; moderation = réponse staff depuis le backoffice */
  replyContext?: ChatReplyContext;
}): 'USER' | 'MODERATOR' {
  if (params.identityKind !== 'user') return 'USER';
  if (params.replyContext === 'moderation' && params.role && isStaffRole(params.role)) {
    return 'MODERATOR';
  }
  return 'USER';
}

/** Bloque l'envoi de message sur conversation fermée/archivée/supprimée (sauf staff). */
export function isConversationWriteBlockedForIdentity(
  status: string,
  identityKind: ChatIdentityKind,
  role?: UserRole,
): boolean {
  if (status !== 'CLOSED' && status !== 'ARCHIVED' && status !== 'DELETED') return false;
  return !(identityKind === 'user' && role && isStaffRole(role));
}

/** Réouverture automatique quand un utilisateur répond sur un ticket fermé. */
export function resolveStatusAfterMessage(
  currentStatus: ConversationStatus,
  senderType: string,
): ConversationStatus {
  if (currentStatus === 'CLOSED' && senderType === 'USER') return 'ACTIVE';
  return currentStatus;
}

/** Message système « ticket transmis » après la première réponse user post-BOT. */
export function shouldInsertTicketTransmittedMessage(
  messages: Array<{ senderType: string; id: string }>,
  newMessageId: string,
  senderType: string,
): boolean {
  if (senderType !== 'USER') return false;

  const messagesBeforeNew = messages.filter((m) => m.id !== newMessageId);
  const lastBotIndex = messagesBeforeNew
    .map((m) => m.senderType)
    .lastIndexOf('BOT');
  if (lastBotIndex === -1) return false;

  const userMessagesAfterBot = messagesBeforeNew
    .slice(lastBotIndex + 1)
    .filter((m) => m.senderType === 'USER');

  return userMessagesAfterBot.length === 0;
}

/** Accusé de réception BOT pour les relances tant qu'aucun staff n'a répondu au dernier message user. */
export function shouldInsertFollowUpAwaitingAcknowledgment(
  messages: Array<{ senderType: string; id: string }>,
  newMessageId: string,
  senderType: string,
  assignedTo?: string | null,
): boolean {
  if (senderType !== 'USER') return false;
  if (shouldInsertTicketTransmittedMessage(messages, newMessageId, senderType)) {
    return false;
  }

  const messagesBeforeNew = messages.filter((m) => m.id !== newMessageId);

  if (assignedTo) {
    return isConversationAwaitingModeratorReply(messagesBeforeNew);
  }

  return isConversationAwaitingStaffReply(messagesBeforeNew);
}

/** True quand un modérateur humain doit encore répondre (assignation active, pas de message MODERATOR après le dernier USER). */
export function isConversationAwaitingModeratorReply(
  messages: Array<{ senderType: string }>,
): boolean {
  let lastUserIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].senderType === 'USER') {
      lastUserIdx = i;
      break;
    }
  }
  if (lastUserIdx < 0) return false;

  for (let i = lastUserIdx + 1; i < messages.length; i++) {
    if (messages[i].senderType === 'MODERATOR') {
      return false;
    }
  }
  return true;
}

export function buildConversationWhereClause(params: {
  role: UserRole;
  userId: string;
  filters: ConversationFilters;
  scope?: ChatAccessScope;
}): Record<string, unknown> {
  const scope = params.scope ?? 'widget';
  const { role, userId, filters } = params;

  if (scope === 'widget') {
    const whereClause: Record<string, unknown> = {
      userId,
      status: { not: 'DELETED' },
    };
    if (filters.status) whereClause.status = filters.status;
    return whereClause;
  }

  const whereClause: Record<string, unknown> = {};
  const isAdmin = role === 'ADMIN';
  const isModerator = role === 'MODERATOR';
  const isUser = role === 'USER' || role === 'AFFILIATE';

  if (isUser && !isAdmin && !isModerator) {
    whereClause.userId = userId;
    whereClause.status = { not: 'DELETED' };
  } else if (isModerator && !isAdmin && filters.assignedTo === 'me') {
    whereClause.assignedTo = userId;
  } else if (!filters.status) {
    whereClause.status = { not: 'DELETED' };
  }

  if (filters.status) whereClause.status = filters.status;
  if (filters.assignedTo && filters.assignedTo !== 'me') {
    whereClause.assignedTo =
      filters.assignedTo === 'unassigned' ? null : filters.assignedTo;
  }
  if (filters.category) whereClause.category = filters.category;
  if (filters.priority) whereClause.priority = filters.priority;
  if (filters.userId && isAdmin) whereClause.userId = filters.userId;
  if (filters.search) {
    whereClause.OR = [
      { subject: { contains: filters.search, mode: 'insensitive' } },
      { user: { name: { contains: filters.search, mode: 'insensitive' } } },
      { user: { email: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }

  return whereClause;
}

export function computeAverageResponseTimeMinutes(
  conversations: Array<{
    messages: Array<{ senderType: string; createdAt: Date; userId?: string | null }>;
  }>,
  options?: { moderatorId?: string },
): number {
  let totalResponseTime = 0;
  let responseCount = 0;

  for (const conv of conversations) {
    if (options?.moderatorId) {
      const userMessages = conv.messages.filter((m) => m.senderType === 'USER');
      const moderatorMessages = conv.messages.filter(
        (m) => m.userId === options.moderatorId && m.senderType === 'MODERATOR',
      );
      for (const userMsg of userMessages) {
        const nextModMsg = moderatorMessages.find(
          (modMsg) => modMsg.createdAt > userMsg.createdAt,
        );
        if (nextModMsg) {
          totalResponseTime += nextModMsg.createdAt.getTime() - userMsg.createdAt.getTime();
          responseCount++;
        }
      }
    } else {
      if (conv.messages.length < 2) continue;
      const userMessage = conv.messages.find((m) => m.senderType === 'USER');
      const staffMessage = conv.messages.find(
        (m) => m.senderType === 'MODERATOR' || m.senderType === 'BOT',
      );
      if (
        userMessage &&
        staffMessage &&
        staffMessage.createdAt > userMessage.createdAt
      ) {
        totalResponseTime +=
          staffMessage.createdAt.getTime() - userMessage.createdAt.getTime();
        responseCount++;
      }
    }
  }

  return responseCount > 0
    ? Math.round(totalResponseTime / responseCount / 1000 / 60)
    : 0;
}

export function getUnreadMessageCount(
  messages: Array<{ isRead: boolean; senderType: string }>,
): number {
  return messages.filter((m) => !m.isRead && m.senderType !== 'USER').length;
}

/** Messages staff/BOT considérés lus tant que le client consulte la conversation. */
export function markStaffMessagesReadForClientViewer<
  T extends { isRead: boolean; senderType: string },
>(messages: T[]): T[] {
  return messages.map((m) =>
    m.senderType !== 'USER' ? { ...m, isRead: true } : m,
  );
}

export function getConversationListUnreadTotal(
  items: Array<{ id: string; unread: number }>,
  activeConversationId: string | null,
  isViewingConversation: boolean,
): number {
  return items.reduce((acc, item) => {
    if (isViewingConversation && item.id === activeConversationId) return acc;
    return acc + item.unread;
  }, 0);
}

export function countStaffMessagesForNotification(
  messages: Array<{ senderType: string }>,
): number {
  return messages.filter((m) =>
    (STAFF_SENDER_TYPES_FOR_NOTIFICATION as readonly string[]).includes(m.senderType),
  ).length;
}

const AI_TYPING_CLEAR_SENDER_TYPES = ['AI', 'BOT', 'MODERATOR'] as const;

/** Indique si l'indicateur « IA en train d'écrire » doit disparaître. */
export function shouldClearAiTypingIndicator(params: {
  isAiTyping: boolean;
  messages: Array<{ senderType: string }>;
  baseMessageCount: number;
}): boolean {
  if (!params.isAiTyping || params.messages.length === 0) return false;
  const currentCount = params.messages.length;
  const lastMsg = params.messages[currentCount - 1];
  return (
    currentCount > params.baseMessageCount + 1 &&
    lastMsg !== undefined &&
    (AI_TYPING_CLEAR_SENDER_TYPES as readonly string[]).includes(lastMsg.senderType)
  );
}

export function selectInitialConversationId<
  T extends { id: string; status: string; lastMessageAt?: string | Date | null },
>(conversations: T[], storedId?: string | null): string | null {
  if (
    storedId &&
    conversations.some(
      (c) => c.id === storedId && !isTerminalConversationStatus(c.status),
    )
  ) {
    return storedId;
  }
  if (conversations.length === 0) return null;
  const sorted = [...conversations]
    .filter((c) => c.status !== 'DELETED')
    .sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
  const active = sorted.find((c) => c.status === 'ACTIVE');
  return active?.id ?? sorted[0]?.id ?? null;
}

export function isValidModeratorRole(role: string): boolean {
  return role === 'MODERATOR' || role === 'ADMIN';
}

export function shouldRedactEmailsForViewer(params: {
  identityKind: ChatIdentityKind;
  role?: UserRole;
}): 'guest' | 'non-staff-user' | 'staff' {
  if (params.identityKind === 'guest') return 'guest';
  if (params.identityKind === 'user' && params.role && isStaffRole(params.role)) {
    return 'staff';
  }
  return 'non-staff-user';
}
