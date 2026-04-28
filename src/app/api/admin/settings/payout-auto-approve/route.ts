import { NextRequest, NextResponse } from 'next/server';
import { getPayoutAutoApproveSettings, setPayoutAutoApproveSettings } from '@/lib/payout-settings';
import { safeParseJson } from '@/lib/validation/helpers';
import { adminPayoutAutoApprovePutSchema } from '@/lib/validation/schemas/admin-bodies';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

/**
 * GET - Lecture du réglage d'auto-approbation des payouts (admin).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const settings = await getPayoutAutoApproveSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('[admin/settings/payout-auto-approve] GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * PUT - Mise à jour du réglage d'auto-approbation des payouts (admin).
 * Body: { enabled?: boolean, thresholdCents?: number }
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const raw = await request.json().catch(() => ({}));
    const parsed = safeParseJson(raw, adminPayoutAutoApprovePutSchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const { enabled: enabledRaw, thresholdCents } = parsed.data;
    const enabled = typeof enabledRaw === 'boolean' ? enabledRaw : undefined;
    const threshold =
      typeof thresholdCents === 'number' ? thresholdCents : undefined;
    const settings = await setPayoutAutoApproveSettings(
      { enabled, thresholdCents: threshold },
      session.user.id
    );
    return NextResponse.json(settings);
  } catch (error) {
    console.error('[admin/settings/payout-auto-approve] PUT error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
