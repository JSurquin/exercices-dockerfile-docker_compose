import type { NextRequest } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';

/** Compte banni actif (expiration passée = ban levé). */
export function isUserBanned(user: {
  banned: boolean;
  banExpires: Date | null;
}): boolean {
  if (!user.banned) return false;
  if (user.banExpires && user.banExpires < new Date()) return false;
  return true;
}

/**
 * Utilisateur authentifié (tout rôle). Revalide banned / accountFrozen en base.
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

  return {
    ...session,
    user: {
      ...session.user,
      role: user.role,
    },
  };
}
