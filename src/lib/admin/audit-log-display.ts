export function resolveUserDisplayName(user: {
  id: string;
  steamUsername: string | null;
  name: string | null;
  email: string;
}): string {
  return user.steamUsername?.trim() || user.name?.trim() || user.email || user.id;
}

export function truncateAuditUserId(userId: string, max = 10): string {
  if (userId.length <= max + 1) return userId;
  return `${userId.slice(0, max)}…`;
}

export interface AuditLogUserSummary {
  userId: string;
  displayName: string;
  email: string | null;
  steamUsername: string | null;
  steamAvatar: string | null;
}
