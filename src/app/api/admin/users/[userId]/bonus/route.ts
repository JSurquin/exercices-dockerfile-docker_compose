import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { getRequestContext, getClientIP, logUnauthorizedAccess } from '@/lib/security/audit-helpers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const context = getRequestContext(request);
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      await logUnauthorizedAccess(context, '/api/admin/users/[userId]/bonus', 'Admin required');
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    const body = await request.json();
    const { bonusRatePercent, userTag } = body;

    if (bonusRatePercent !== undefined) {
      const rate = parseFloat(bonusRatePercent);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        return NextResponse.json(
          { error: 'bonusRatePercent doit être entre 0 et 100' },
          { status: 400 }
        );
      }
    }

    if (userTag !== undefined && userTag !== null) {
      if (typeof userTag !== 'string' || userTag.length > 20) {
        return NextResponse.json(
          { error: 'userTag doit être une chaîne de 20 caractères max' },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (bonusRatePercent !== undefined) {
      updateData.bonusRatePercent = parseFloat(bonusRatePercent);
    }
    if (userTag !== undefined) {
      updateData.userTag = userTag || null;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { bonusRatePercent: true, userTag: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMIN_VIP_BONUS_UPDATE',
        details: { targetUserId: userId, ...updateData },
        ipAddress: getClientIP(request),
      },
    });

    return NextResponse.json({ success: true, ...updated });
  } catch (err) {
    console.error('[admin/users/[userId]/bonus]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
