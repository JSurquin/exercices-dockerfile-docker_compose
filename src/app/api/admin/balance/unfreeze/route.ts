import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { getRequestContext, getClientIP, logUnauthorizedAccess } from '@/lib/security/audit-helpers';
import { unfreezeAccount } from '@/lib/admin/balance-admin-service';

export async function POST(request: NextRequest) {
  const context = getRequestContext(request);
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || session.user.role !== 'ADMIN') {
      await logUnauthorizedAccess(context, '/api/admin/balance/unfreeze', 'Admin required');
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const body = await request.json();
    const { userId } = body as { userId?: string };
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }
    await unfreezeAccount(session.user.id, userId, getClientIP(request));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/balance/unfreeze]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
