import type { UserRole } from '@prisma/client';

export type ModerationActionResult =
  | { ok: true }
  | { ok: false; reason: string; status: 400 | 404 };

export function resolveRoleAfterModeratorDemote(
  hasActiveAffiliate: boolean,
): 'AFFILIATE' | 'USER' {
  return hasActiveAffiliate ? 'AFFILIATE' : 'USER';
}

export function canDemoteModerator(params: {
  targetRole: UserRole;
  targetId: string;
  actorId: string;
}): ModerationActionResult {
  if (params.targetRole !== 'MODERATOR') {
    return { ok: false, reason: "L'utilisateur n'est pas modérateur", status: 400 };
  }
  if (params.targetId === params.actorId) {
    return { ok: false, reason: 'Impossible de se rétrograder soi-même', status: 400 };
  }
  return { ok: true };
}

export function canPromoteToModerator(role: UserRole): ModerationActionResult {
  if (role === 'MODERATOR') {
    return { ok: false, reason: "L'utilisateur est déjà modérateur", status: 400 };
  }
  if (role === 'ADMIN') {
    return { ok: false, reason: "Impossible de modifier le rôle d'un administrateur", status: 400 };
  }
  return { ok: true };
}

export function canInviteAsModerator(role: UserRole): ModerationActionResult {
  if (role === 'MODERATOR' || role === 'ADMIN') {
    return {
      ok: false,
      reason: 'Cet utilisateur est déjà modérateur ou administrateur',
      status: 400,
    };
  }
  return { ok: true };
}

export function isModeratorDetailViewable(role: UserRole): boolean {
  return role === 'MODERATOR' || role === 'ADMIN';
}

export function buildModerationFilterParams(
  filters: Record<string, string | number | undefined | null>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  }
  return params;
}

export function moderationStatCardAccent(type: 'active' | 'closed' | 'unassigned' | 'response'): string {
  switch (type) {
    case 'active':
      return 'text-green-500';
    case 'closed':
      return 'text-muted-foreground';
    case 'unassigned':
      return 'text-amber-500';
    case 'response':
      return 'text-blue-500';
    default:
      return 'text-muted-foreground';
  }
}
