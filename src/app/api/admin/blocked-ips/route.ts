import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { getClientIP, getRequestContext, logUnauthorizedAccess } from '@/lib/security/audit-helpers';
import { blockIp, listBlockedIps } from '@/lib/blocked-ip-service';
import { safeParseJson } from '@/lib/validation/helpers';
import { adminBlockedIpSchema } from '@/lib/validation/schemas/admin-bodies';

export async function GET(request: NextRequest) {
  const context = getRequestContext(request);

  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      await logUnauthorizedAccess(context, '/api/admin/blocked-ips', 'Admin required');
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const blockedIps = await listBlockedIps();
    return NextResponse.json({ blockedIps });
  } catch (err) {
    console.error('[admin/blocked-ips GET]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const context = getRequestContext(request);

  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      await logUnauthorizedAccess(context, '/api/admin/blocked-ips', 'Admin required');
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, adminBlockedIpSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;

    const entry = await blockIp(
      session.user.id,
      parsed.data.ipAddress,
      parsed.data.reason,
      expiresAt,
      getClientIP(request)
    );

    return NextResponse.json({ success: true, id: entry.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    console.error('[admin/blocked-ips POST]', err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
