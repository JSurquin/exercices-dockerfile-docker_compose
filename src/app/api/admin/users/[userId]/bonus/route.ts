import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { getRequestContext, getClientIP, logUnauthorizedAccess } from '@/lib/security/audit-helpers';

const ALLOWED_USER_TAGS = new Set(['VIP', 'MERCHANT']);

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

    if (userTag !== undefined && userTag !== null && userTag !== '') {
      if (typeof userTag !== 'string' || userTag.length > 20) {
        return NextResponse.json(
          { error: 'userTag doit être une chaîne de 20 caractères max' },
          { status: 400 }
        );
      }
      if (!ALLOWED_USER_TAGS.has(userTag)) {
        return NextResponse.json(
          { error: 'userTag doit être VIP ou MERCHANT' },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, bonusRatePercent: true, userTag: true },
    });
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

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 });
    }

    const nextRate =
      updateData.bonusRatePercent !== undefined
        ? (updateData.bonusRatePercent as number)
        : user.bonusRatePercent;
    const nextTag =
      updateData.userTag !== undefined ? (updateData.userTag as string | null) : user.userTag;

    if (nextTag && nextRate <= 0) {
      return NextResponse.json(
        { error: 'Un pourcentage de bonus supérieur à 0 est requis pour VIP ou MERCHANT' },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { bonusRatePercent: true, userTag: true },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'ADMIN_VIP_BONUS_UPDATE',
          details: { targetUserId: userId, ...updateData },
          ipAddress: getClientIP(request),
        },
      });
    } catch (auditErr) {
      console.error('[admin/users/[userId]/bonus] audit log failed', auditErr);
    }

    return NextResponse.json({ success: true, ...updated });
  } catch (err) {
    console.error('[admin/users/[userId]/bonus]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
