import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { getRequestContext, getClientIP, logUnauthorizedAccess } from '@/lib/security/audit-helpers';
import { freezeAccount } from '@/lib/admin/balance-admin-service';
import { safeParseJson } from '@/lib/validation/helpers';
import { adminBalanceUserReasonSchema } from '@/lib/validation/schemas/admin-bodies';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

export async function POST(request: NextRequest) {
  const context = getRequestContext(request);
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      await logUnauthorizedAccess(context, '/api/admin/balance/freeze', 'Admin required');
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const raw = await request.json();
    const parsed = safeParseJson(raw, adminBalanceUserReasonSchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const { userId, reason } = parsed.data;
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
