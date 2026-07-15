import type { UserRole } from '@prisma/client';
import { prisma } from '~/prisma/prisma';
import { isStaffRole } from '@/lib/chat-logic';

/** Présence considérée « en ligne » si activité staff dans cette fenêtre. */
export const STAFF_PRESENCE_ONLINE_THRESHOLD_MS = 5 * 60_000;

/** Champs modérateur exposés au widget client (présence incluse). */
export const CHAT_ASSIGNED_MODERATOR_SELECT = {
  id: true,
  name: true,
  email: true,
  steamUsername: true,
  steamAvatar: true,
  lastSeenAt: true,
} as const;

/** Met à jour lastSeenAt au plus une fois par minute (limitation charge DB). */
export async function touchStaffPresence(userId: string): Promise<void> {
  const threshold = new Date(Date.now() - 60_000);
  await prisma.user.updateMany({
    where: {
      id: userId,
      OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: threshold } }],
    },
    data: { lastSeenAt: new Date() },
  });
}

export async function touchStaffPresenceFromRole(
  userId: string,
  role: UserRole,
): Promise<void> {
  if (!isStaffRole(role)) return;
  await touchStaffPresence(userId);
}
