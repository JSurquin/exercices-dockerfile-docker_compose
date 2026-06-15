import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { getClientIP, getRequestContext, logUnauthorizedAccess } from '@/lib/security/audit-helpers';
import { unblockIp } from '@/lib/blocked-ip-service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = getRequestContext(request);

  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      await logUnauthorizedAccess(context, '/api/admin/blocked-ips/[id]', 'Admin required');
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 });
    }

    await unblockIp(session.user.id, id, getClientIP(request));
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    const status = message.includes('introuvable') ? 404 : 400;
    console.error('[admin/blocked-ips/[id] DELETE]', err);
    return NextResponse.json({ error: message }, { status });
  }
}
