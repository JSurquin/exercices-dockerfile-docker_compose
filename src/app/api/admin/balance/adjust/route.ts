import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { getRequestContext, getClientIP, logUnauthorizedAccess } from '@/lib/security/audit-helpers';
import { adjustUserBalance } from '@/lib/admin/balance-admin-service';

export async function POST(request: NextRequest) {
  const context = getRequestContext(request);
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || session.user.role !== 'ADMIN') {
      await logUnauthorizedAccess(context, '/api/admin/balance/adjust', 'Admin required');
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const body = await request.json();
    const { userId, amountCents, reason } = body as { userId?: string; amountCents?: number; reason?: string };
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
