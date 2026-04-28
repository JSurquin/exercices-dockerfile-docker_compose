import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { getRequestContext, getClientIP, logUnauthorizedAccess } from '@/lib/security/audit-helpers';
import { cancelPayout } from '@/lib/admin/balance-admin-service';
import { safeParseJson } from '@/lib/validation/helpers';
import { adminPayoutCancelBodySchema } from '@/lib/validation/schemas/admin-bodies';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ payoutId: string }> }
) {
  const context = getRequestContext(request);
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      await logUnauthorizedAccess(context, '/api/admin/payouts/[payoutId]/cancel', 'Admin required');
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const { payoutId } = await params;
    if (!payoutId) {
      return NextResponse.json({ error: 'payoutId requis' }, { status: 400 });
    }
    const raw = await request.json().catch(() => ({}));
    const parsed = safeParseJson(raw, adminPayoutCancelBodySchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const reason = parsed.data.reason?.trim() || 'Annulé par l’admin';
    await cancelPayout(session.user.id, payoutId, reason, getClientIP(request));
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Payout not found') {
      return NextResponse.json({ error: 'Payout non trouvé' }, { status: 404 });
    }
    if (message.startsWith('Payout cannot be cancelled')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error('[admin/payouts/cancel]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
