import { prisma } from '~/prisma/prisma';
import {
  resolveUserDisplayName,
  truncateAuditUserId,
  type AuditLogUserSummary,
} from '@/lib/admin/audit-log-display';

export type { AuditLogUserSummary } from '@/lib/admin/audit-log-display';
export { resolveUserDisplayName, truncateAuditUserId } from '@/lib/admin/audit-log-display';

/**
 * Jointure batch User → logs d'audit pour afficher steamUsername / avatar en admin.
 */
export async function enrichAuditLogsWithUsers<T extends { userId: string }>(
  logs: T[]
): Promise<Array<T & { user: AuditLogUserSummary | null }>> {
  if (logs.length === 0) return [];

  const userIds = [
    ...new Set(logs.map((log) => log.userId).filter((id) => id && id !== 'system')),
  ];

  const usersById = new Map<string, AuditLogUserSummary>();

  if (userIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        name: true,
        steamUsername: true,
        steamAvatar: true,
      },
    });

    for (const user of users) {
      usersById.set(user.id, {
        userId: user.id,
        displayName: resolveUserDisplayName(user),
        email: user.email,
        steamUsername: user.steamUsername,
        steamAvatar: user.steamAvatar,
      });
    }
  }

  return logs.map((log) => {
    if (!log.userId || log.userId === 'system') {
      return { ...log, user: null };
    }

    const known = usersById.get(log.userId);
    if (known) {
      return { ...log, user: known };
    }

    return {
      ...log,
      user: {
        userId: log.userId,
        displayName: truncateAuditUserId(log.userId, 12),
        email: null,
        steamUsername: null,
        steamAvatar: null,
      },
    };
  });
}
