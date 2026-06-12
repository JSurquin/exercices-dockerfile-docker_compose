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
