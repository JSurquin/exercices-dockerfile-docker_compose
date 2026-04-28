import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { getRequestContext, getClientIP, logUnauthorizedAccess } from '@/lib/security/audit-helpers';
import { adjustUserBalance } from '@/lib/admin/balance-admin-service';
import { safeParseJson } from '@/lib/validation/helpers';
import { adminBalanceAdjustSchema } from '@/lib/validation/schemas/admin-bodies';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

export async function POST(request: NextRequest) {
  const context = getRequestContext(request);
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      await logUnauthorizedAccess(context, '/api/admin/balance/adjust', 'Admin required');
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const raw = await request.json();
    const parsed = safeParseJson(raw, adminBalanceAdjustSchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const { userId, amountCents, reason } = parsed.data;
    if (!userId || typeof amountCents !== 'number' || !reason?.trim()) {
      return NextResponse.json(
        { error: 'userId, amountCents (number) et reason requis' },
        { status: 400 }
      );
    }
    const result = await adjustUserBalance(
      session.user.id,
      userId,
      amountCents,
      reason.trim(),
      getClientIP(request)
    );
    return NextResponse.json({ success: true, balanceAfterCents: result.balanceAfterCents });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'User not found' || message === 'Insufficient balance') {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error('[admin/balance/adjust]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
