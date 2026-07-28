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
      select: { id: true, developerProgramEnabled: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (user.developerProgramEnabled === enabled) {
      return NextResponse.json({ developerProgramEnabled: enabled });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { developerProgramEnabled: enabled },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMIN_ACTION',
        details: {
          type: enabled ? 'developer_program_enabled' : 'developer_program_disabled',
          targetUserId: userId,
        },
      },
    });

    return NextResponse.json({ developerProgramEnabled: enabled });
  } catch (err) {
    console.error('[admin/users/[userId]/developer-program]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
