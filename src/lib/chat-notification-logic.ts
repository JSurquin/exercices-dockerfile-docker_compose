/** Compteurs pour déclencher les sons de notification chat (client vs modération). */

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
  messages?: Array<{ id: string; senderType: string }>;
};

type StaffNotification = {
  id: string;
  metadata?: unknown;
};

/** Clé stable « conversation + dernier message user » pour alertes modérateur. */
export function getModeratorAttentionKey(
  conversation: ModeratorAlertConversation,
): string | null {
  if (conversation.aiEnabled !== false) return null;
  const last = conversation.messages?.[0];
  if (!last || last.senderType !== 'USER') return null;
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
