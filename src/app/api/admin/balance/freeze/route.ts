import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { getRequestContext, getClientIP, logUnauthorizedAccess } from '@/lib/security/audit-helpers';
import { freezeAccount } from '@/lib/admin/balance-admin-service';

export async function POST(request: NextRequest) {
  const context = getRequestContext(request);
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || session.user.role !== 'ADMIN') {
      await logUnauthorizedAccess(context, '/api/admin/balance/freeze', 'Admin required');
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const body = await request.json();
    const { userId, reason } = body as { userId?: string; reason?: string };
    if (!userId || !reason?.trim()) {
      return NextResponse.json({ error: 'userId et reason requis' }, { status: 400 });
    }
    await freezeAccount(session.user.id, userId, reason.trim(), getClientIP(request));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/balance/freeze]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
