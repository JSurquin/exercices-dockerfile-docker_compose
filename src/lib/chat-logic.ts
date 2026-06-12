import type { ConversationStatus, UserRole } from '@prisma/client';
import type { ConversationFilters } from '@/lib/types/chat';

export type ChatIdentityKind = 'guest' | 'invalid' | 'user';

export const STAFF_SENDER_TYPES_FOR_NOTIFICATION = ['MODERATOR', 'BOT', 'SYSTEM'] as const;

export function isStaffRole(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'MODERATOR';
}

/** Invité : accès uniquement aux conversations sans userId (guest ticket). */
export function canGuestAccessConversation(conversationUserId: string | null): boolean {
  return conversationUserId === null;
}

export function canUserAccessConversation(params: {
  role: UserRole;
  userId: string;
  conversationUserId: string | null;
  assignedTo: string | null;
}): boolean {
  const { role, userId, conversationUserId, assignedTo } = params;
  if (isStaffRole(role)) return true;
  return conversationUserId === userId || assignedTo === userId;
}

export function resolveOutgoingSenderType(params: {
  identityKind: ChatIdentityKind;
  role?: UserRole;
}): 'USER' | 'MODERATOR' {
  if (params.identityKind !== 'user') return 'USER';
  if (params.role && isStaffRole(params.role)) return 'MODERATOR';
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

export function buildConversationWhereClause(params: {
  role: UserRole;
  userId: string;
  filters: ConversationFilters;
}): Record<string, unknown> {
  const { role, userId, filters } = params;
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
    whereClause.assignedTo = filters.assignedTo;
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
    lastMsg.senderType !== 'USER'
  );
}

export function selectInitialConversationId<
  T extends { id: string; status: string; lastMessageAt?: string | Date | null },
>(conversations: T[], storedId?: string | null): string | null {
  if (storedId && conversations.some((c) => c.id === storedId && c.status !== 'DELETED')) {
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
