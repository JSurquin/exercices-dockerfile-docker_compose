import type { NextRequest } from 'next/server';
import type { UserRole } from '@prisma/client';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';

/**
 * Session admin pour les route handlers. **Revalide le rôle en base** (évite session
 * obsolète / broken access control — cf. audit pentest).
 */
export async function requireAdminSession(request: NextRequest) {
  return requireAdminSessionWithDbCheck(request);
}

/**
 * Session admin avec revalidation depuis la DB (pour actions critiques).
 *
 * POURQUOI: La session peut être obsolète si le rôle a été changé en DB sans
 * invalider la session (downgrade admin → user, ban, etc.)
 *
 * USAGE: Utiliser cette fonction pour les actions très sensibles :
 *   - Création/modification/suppression de giveaways
 *   - Tirages de giveaways
 *   - Approbation de payouts
 *   - Changements de configuration système
 *   - Gestion des rôles utilisateurs
 *
 * @param request - NextRequest
 * @returns Session avec user DB frais, ou null si pas admin
 */
export async function requireAdminSessionWithDbCheck(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return null;
  }

  // Revalider le rôle depuis la DB
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      accountFrozen: true,
      email: true,
      name: true,
      image: true,
    },
  });

  if (!user || user.role !== 'ADMIN' || user.accountFrozen) {
    return null;
  }

  // Retourner une session avec le user DB frais
  return {
    ...session,
    user: {
      ...session.user,
      role: user.role,
      accountFrozen: user.accountFrozen,
    },
  };
}

/**
 * Admin ou modérateur, rôle vérifié en DB (contenu éditorial, notifications, etc.).
 */
export async function requireAdminOrModeratorSessionWithDbCheck(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      accountFrozen: true,
    },
  });

  if (!user || user.accountFrozen) {
    return null;
  }
  if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
    return null;
  }

  return {
    ...session,
    user: {
      ...session.user,
      role: user.role,
      accountFrozen: user.accountFrozen,
    },
  };
}

/**
 * Identité chat : invité, session invalide (compte gelé / absent), ou utilisateur avec rôle DB.
 */
export type ChatIdentity =
  | { kind: 'guest' }
  | { kind: 'invalid' }
  | {
      kind: 'user';
      session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
      role: UserRole;
    };

export async function resolveChatIdentity(request: NextRequest): Promise<ChatIdentity> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return { kind: 'guest' };
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, accountFrozen: true },
  });
  if (!user || user.accountFrozen) {
    return { kind: 'invalid' };
  }
  return {
    kind: 'user',
    session: {
      ...session,
      user: { ...session.user, role: user.role },
    },
    role: user.role,
  };
}
