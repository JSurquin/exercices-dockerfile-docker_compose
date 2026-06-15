import type { NextRequest } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { isIpBlocked, isPrivilegedRole } from '@/lib/blocked-ip-service';
import { getClientIP } from '@/lib/security/audit-helpers';
export { isUserBanned } from '@/lib/user-ban-logic';
import { isUserBanned } from '@/lib/user-ban-logic';

async function isRequestIpBlocked(request: NextRequest, role: string): Promise<boolean> {
  if (isPrivilegedRole(role)) {
    return false;
  }
  return isIpBlocked(getClientIP(request));
}

/**
 * Utilisateur authentifié (tout rôle). Revalide banned / accountFrozen / IP en base.
 * L'id ne doit jamais venir du body/query sans contrôle.
 */
export async function requireUserSession(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      banned: true,
      banExpires: true,
      accountFrozen: true,
    },
  });

  if (!user || user.accountFrozen || isUserBanned(user)) {
    return null;
  }

  if (await isRequestIpBlocked(request, user.role)) {
    return null;
  }

  return {
    ...session,
    user: {
      ...session.user,
      role: user.role,
    },
  };
}
