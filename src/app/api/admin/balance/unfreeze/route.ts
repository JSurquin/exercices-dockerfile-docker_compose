import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { getRequestContext, getClientIP, logUnauthorizedAccess } from '@/lib/security/audit-helpers';
import { unfreezeAccount } from '@/lib/admin/balance-admin-service';
import { safeParseJson } from '@/lib/validation/helpers';
import { adminBalanceUnfreezeSchema } from '@/lib/validation/schemas/admin-bodies';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

export async function POST(request: NextRequest) {
  const context = getRequestContext(request);
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      await logUnauthorizedAccess(context, '/api/admin/balance/unfreeze', 'Admin required');
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const raw = await request.json();
    const parsed = safeParseJson(raw, adminBalanceUnfreezeSchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const { userId } = parsed.data;
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
