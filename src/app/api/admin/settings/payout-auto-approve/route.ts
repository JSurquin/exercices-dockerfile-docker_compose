import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { getPayoutAutoApproveSettings, setPayoutAutoApproveSettings } from '@/lib/payout-settings';

/**
 * GET - Lecture du réglage d'auto-approbation des payouts (admin).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || session.user.role !== 'ADMIN') {
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
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const enabled = typeof body.enabled === 'boolean' ? body.enabled : undefined;
    const thresholdCents = typeof body.thresholdCents === 'number' ? body.thresholdCents : undefined;
    const settings = await setPayoutAutoApproveSettings(
      { enabled, thresholdCents },
      session.user.id
    );
    return NextResponse.json(settings);
  } catch (error) {
    console.error('[admin/settings/payout-auto-approve] PUT error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
