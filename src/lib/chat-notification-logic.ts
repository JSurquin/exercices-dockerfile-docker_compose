/** Compteurs pour déclencher les sons de notification chat (client vs modération). */

import { TICKET_TRANSMITTED_I18N_KEY } from '@/lib/chat-logic';

export const MODERATOR_ALERT_POLL_MS = 5_000;

export const CLIENT_NOTIFY_SENDER_TYPES = ['MODERATOR', 'BOT', 'AI', 'SYSTEM'] as const;

export type ChatNotifySenderType = string;

export function countClientNotifyMessages(
  messages: Array<{ senderType: ChatNotifySenderType }>,
): number {
  return messages.filter((m) =>
    (CLIENT_NOTIFY_SENDER_TYPES as readonly string[]).includes(m.senderType),
  ).length;
}

export function countUserMessagesForModerator(
  messages: Array<{ senderType: ChatNotifySenderType }>,
): number {
  return messages.filter((m) => m.senderType === 'USER').length;
}

export function shouldPlayClientNotificationSound(params: {
  previousCount: number | null;
  currentCount: number;
}): boolean {
  return (
    params.previousCount !== null &&
    params.currentCount > params.previousCount
  );
}

export function shouldPlayModeratorNotificationSound(params: {
  previousUserCount: number | null;
  currentUserCount: number;
}): boolean {
  return (
    params.previousUserCount !== null &&
    params.currentUserCount > params.previousUserCount
  );
}

type ModeratorAlertConversation = {
  id: string;
  aiEnabled?: boolean;
  assignedTo?: string | null;
  messages?: Array<{ id: string; senderType: string; content?: string }>;
};

type StaffNotification = {
  id: string;
  metadata?: unknown;
};

function isConversationEscalatedForModerator(
  conversation: ModeratorAlertConversation,
): boolean {
  if (conversation.aiEnabled === false) return true;
  const last = conversation.messages?.[0];
  return (
    last?.senderType === 'SYSTEM' &&
    last.content === TICKET_TRANSMITTED_I18N_KEY
  );
}

/** Clé stable « conversation + dernier message pertinent » pour alertes modérateur. */
export function getModeratorAttentionKey(
  conversation: ModeratorAlertConversation,
): string | null {
  if (!conversationNeedsModeratorAttention(conversation)) return null;
  const last = conversation.messages?.[0];
  if (!last) return null;
  return `${conversation.id}:${last.id}`;
}

export function collectModeratorAttentionKeys(
  conversations: ModeratorAlertConversation[],
  excludeConversationId?: string | null,
): string[] {
  return conversations
    .filter((conv) => conv.id !== excludeConversationId)
    .map(getModeratorAttentionKey)
    .filter((key): key is string => key !== null);
}

export function conversationNeedsModeratorAttention(
  conversation: ModeratorAlertConversation,
): boolean {
  const last = conversation.messages?.[0];
  if (!last) return false;
  if (last.senderType === 'MODERATOR') return false;

  const escalated = isConversationEscalatedForModerator(conversation);
  const assignedAwaitingUser =
    !!conversation.assignedTo && last.senderType === 'USER';

  if (!escalated && !assignedAwaitingUser) {
    return false;
  }

  if (last.senderType === 'USER') return true;
  if (last.senderType === 'SYSTEM') return true;
  if (last.senderType === 'BOT') return true;
  if (last.senderType === 'AI' && conversation.aiEnabled === false) return true;

  return false;
}

export function countConversationsNeedingAttention(
  conversations: ModeratorAlertConversation[],
  excludeConversationId?: string | null,
): number {
  return collectModeratorAttentionKeys(conversations, excludeConversationId).length;
}

export function findNewModeratorAlertKeys(
  previousKeys: Set<string>,
  currentKeys: string[],
): string[] {
  return currentKeys.filter((key) => !previousKeys.has(key));
}

export function collectChatEscalationNotificationIds(
  notifications: StaffNotification[],
): string[] {
  return notifications
    .filter((notification) => {
      const metadata = notification.metadata as { event?: string } | null | undefined;
      return metadata?.event === 'chat_escalation';
    })
    .map((notification) => notification.id);
}

export function findNewChatEscalationNotificationIds(
  previousIds: Set<string>,
  currentIds: string[],
): string[] {
  return currentIds.filter((id) => !previousIds.has(id));
}
