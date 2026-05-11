import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { getRequestContext, logUnauthorizedAccess } from '@/lib/security/audit-helpers';
import { prisma } from '~/prisma/prisma';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const context = getRequestContext(request);
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      await logUnauthorizedAccess(context, '/api/admin/users/[userId]', 'Admin required');
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        steamId: true,
        steamUsername: true,
        kycStatus: true,
        kycaidApplicantId: true,
        level: true,
        xp: true,
        tickets: true,
        totalVolumeCents: true,
        pendingBalanceCents: true,
        balanceCents: true,
        frozenBalanceCents: true,
        accountFrozen: true,
        bonusRatePercent: true,
        userTag: true,
        instantCreditEnabled: true,
        createdAt: true,
        role: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (err) {
    console.error('[admin/users/[userId]]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
