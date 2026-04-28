import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { getRequestContext, logUnauthorizedAccess } from '@/lib/security/audit-helpers';
import { getBalanceContext } from '@/lib/admin/balance-admin-service';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const context = getRequestContext(request);
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      await logUnauthorizedAccess(context, '/api/admin/balance/[userId]', 'Admin required');
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }
    const data = await getBalanceContext(userId);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof Error && err.message === 'User not found') {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }
    console.error('[admin/balance/[userId]]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
