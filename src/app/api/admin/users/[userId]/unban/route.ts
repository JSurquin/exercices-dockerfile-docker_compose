import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { getClientIP, getRequestContext, logUnauthorizedAccess } from '@/lib/security/audit-helpers';
import { unbanUser } from '@/lib/admin/ban-admin-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const context = getRequestContext(request);

  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      await logUnauthorizedAccess(context, '/api/admin/users/[userId]/unban', 'Admin required');
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    await unbanUser(session.user.id, userId, getClientIP(request));
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    const status = message.includes('introuvable') ? 404 : 400;
    console.error('[admin/users/[userId]/unban]', err);
    return NextResponse.json({ error: message }, { status });
  }
}
