import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { userId } = await params;
    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled (boolean) requis' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, instantCreditEnabled: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (user.instantCreditEnabled === enabled) {
      return NextResponse.json({ instantCreditEnabled: enabled });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { instantCreditEnabled: enabled },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: enabled ? 'INSTANT_CREDIT_ENABLED' : 'INSTANT_CREDIT_DISABLED',
        details: { targetUserId: userId, enabled, changedBy: session.user.id },
        ipAddress:
          request.headers.get('x-forwarded-for') ??
          request.headers.get('x-real-ip') ??
          'unknown',
      },
    });

    return NextResponse.json({ instantCreditEnabled: enabled });
  } catch (err) {
    console.error('[admin/users/[userId]/instant-credit]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
