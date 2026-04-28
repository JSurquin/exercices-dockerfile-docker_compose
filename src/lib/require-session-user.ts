import type { NextRequest } from 'next/server';
import { auth } from '~/lib/auth';

/**
 * Utilisateur authentifié (tout rôle). L'id ne doit jamais venir du body/query sans contrôle.
 */
export async function requireUserSession(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return null;
  }
  return session;
}
