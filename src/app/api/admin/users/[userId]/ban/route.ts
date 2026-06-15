import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { getClientIP, getRequestContext, logUnauthorizedAccess } from '@/lib/security/audit-helpers';
import { banUser } from '@/lib/admin/ban-admin-service';
import { safeParseJson } from '@/lib/validation/helpers';
import { adminUserBanSchema } from '@/lib/validation/schemas/admin-bodies';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const context = getRequestContext(request);

  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      await logUnauthorizedAccess(context, '/api/admin/users/[userId]/ban', 'Admin required');
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, adminUserBanSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    const banExpires = parsed.data.banExpires ? new Date(parsed.data.banExpires) : null;

    await banUser(
      session.user.id,
      userId,
      parsed.data.reason,
      banExpires,
      getClientIP(request)
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    const status = message.includes('introuvable') ? 404 : 400;
    console.error('[admin/users/[userId]/ban]', err);
    return NextResponse.json({ error: message }, { status });
  }
}
