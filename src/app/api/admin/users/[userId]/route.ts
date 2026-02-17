import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { getRequestContext, logUnauthorizedAccess } from '@/lib/security/audit-helpers';
import { prisma } from '~/prisma/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const context = getRequestContext(request);
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || session.user.role !== 'ADMIN') {
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
        balanceCents: true,
        frozenBalanceCents: true,
        accountFrozen: true,
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
