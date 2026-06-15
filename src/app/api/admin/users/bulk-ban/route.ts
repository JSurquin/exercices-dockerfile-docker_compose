import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { getClientIP, getRequestContext, logUnauthorizedAccess } from '@/lib/security/audit-helpers';
import { banUsers } from '@/lib/admin/ban-admin-service';
import { safeParseJson } from '@/lib/validation/helpers';
import { adminUsersBulkBanSchema } from '@/lib/validation/schemas/admin-bodies';

export async function POST(request: NextRequest) {
  const context = getRequestContext(request);

  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      await logUnauthorizedAccess(context, '/api/admin/users/bulk-ban', 'Admin required');
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, adminUsersBulkBanSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    const banExpires = parsed.data.banExpires ? new Date(parsed.data.banExpires) : null;

    const result = await banUsers(
      session.user.id,
      parsed.data.userIds,
      parsed.data.reason,
      banExpires,
      getClientIP(request)
    );

    if (result.banned === 0 && result.errors.length > 0) {
      return NextResponse.json(
        {
          error: result.errors[0]?.error ?? 'Aucun utilisateur banni',
          ...result,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    console.error('[admin/users/bulk-ban]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
