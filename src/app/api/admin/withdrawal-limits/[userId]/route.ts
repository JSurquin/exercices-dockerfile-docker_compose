import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { getRequestContext, getClientIP, logUnauthorizedAccess } from '@/lib/security/audit-helpers';
import { updateWithdrawalLimit } from '@/lib/admin/balance-admin-service';
import { getMonthlyWithdrawalLimitCents, getMonthlyWithdrawalUsedCents } from '@/lib/balance-service';
import { safeParseJson } from '@/lib/validation/helpers';
import { adminWithdrawalLimitPutSchema } from '@/lib/validation/schemas/admin-bodies';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const context = getRequestContext(request);
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      await logUnauthorizedAccess(context, '/api/admin/withdrawal-limits/[userId]', 'Admin required');
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }
    const [monthlyLimitCents, monthlyUsedCents] = await Promise.all([
      getMonthlyWithdrawalLimitCents(userId),
      getMonthlyWithdrawalUsedCents(userId),
    ]);
    return NextResponse.json({
      monthlyLimitCents,
      monthlyUsedCents,
    });
  } catch (err) {
    console.error('[admin/withdrawal-limits GET]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const context = getRequestContext(request);
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      await logUnauthorizedAccess(context, '/api/admin/withdrawal-limits/[userId]', 'Admin required');
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }
    const raw = await request.json();
    const parsed = safeParseJson(raw, adminWithdrawalLimitPutSchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const { monthlyLimitCents } = parsed.data;
    if (monthlyLimitCents !== null && (typeof monthlyLimitCents !== 'number' || monthlyLimitCents < 0)) {
      return NextResponse.json(
        { error: 'monthlyLimitCents doit être un nombre positif ou null' },
        { status: 400 }
      );
    }
    await updateWithdrawalLimit(
      session.user.id,
      userId,
      monthlyLimitCents === null ? null : monthlyLimitCents,
      getClientIP(request)
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/withdrawal-limits PUT]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
