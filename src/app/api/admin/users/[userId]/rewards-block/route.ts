import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '~/prisma/prisma';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { getRequestContext, getClientIP, logUnauthorizedAccess } from '@/lib/security/audit-helpers';

const patchSchema = z
  .object({
    affiliateRewardsBlocked: z.boolean().optional(),
    xpRewardsBlocked: z.boolean().optional(),
  })
  .refine((data) => data.affiliateRewardsBlocked !== undefined || data.xpRewardsBlocked !== undefined, {
    message: 'Au moins un flag doit être fourni',
  });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const context = getRequestContext(request);
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      await logUnauthorizedAccess(context, '/api/admin/users/[userId]/rewards-block', 'Admin required');
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    const body = await request.json();
    const patch = patchSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        affiliateRewardsBlocked: true,
        xpRewardsBlocked: true,
        steamUsername: true,
        userTag: true,
      },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const updateData: Record<string, boolean> = {};
    if (patch.affiliateRewardsBlocked !== undefined) {
      updateData.affiliateRewardsBlocked = patch.affiliateRewardsBlocked;
    }
    if (patch.xpRewardsBlocked !== undefined) {
      updateData.xpRewardsBlocked = patch.xpRewardsBlocked;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        affiliateRewardsBlocked: true,
        xpRewardsBlocked: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMIN_USER_REWARDS_BLOCK_UPDATE',
        details: {
          targetUserId: userId,
          targetSteamUsername: existing.steamUsername,
          targetUserTag: existing.userTag,
          before: {
            affiliateRewardsBlocked: existing.affiliateRewardsBlocked,
            xpRewardsBlocked: existing.xpRewardsBlocked,
          },
          after: updated,
        },
        ipAddress: getClientIP(request),
      },
    });

    return NextResponse.json({ success: true, ...updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: err.issues }, { status: 400 });
    }
    console.error('[admin/users/[userId]/rewards-block]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
