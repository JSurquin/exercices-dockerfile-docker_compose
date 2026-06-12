import type { NextRequest } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { isUserBanned } from '@/lib/require-session-user';
import { parseAffiliateRefFromRequest } from '@/lib/giveaway-private-access';

export interface GiveawayViewerContext {
  viewerUserId: string | null;
  affiliateRef: string | null;
  viewerIsAdmin: boolean;
}

export async function resolveGiveawayViewerContext(
  request: NextRequest
): Promise<GiveawayViewerContext> {
  const session = await auth.api.getSession({ headers: request.headers });
  const viewerUserId = session?.user?.id ?? null;
  const affiliateRef = parseAffiliateRefFromRequest(request);

  if (!viewerUserId) {
    return { viewerUserId, affiliateRef, viewerIsAdmin: false };
  }

  const user = await prisma.user.findUnique({
    where: { id: viewerUserId },
    select: {
      role: true,
      banned: true,
      banExpires: true,
      accountFrozen: true,
    },
  });

  const viewerIsAdmin = !!(
    user &&
    user.role === 'ADMIN' &&
    !user.accountFrozen &&
    !isUserBanned(user)
  );

  return { viewerUserId, affiliateRef, viewerIsAdmin };
}
