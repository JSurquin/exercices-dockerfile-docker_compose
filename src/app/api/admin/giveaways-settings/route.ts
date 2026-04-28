import { NextRequest, NextResponse } from 'next/server';
import { getGiveawaysEnabled, setGiveawaysEnabled } from '@/lib/points-service';
import { safeParseJson } from '@/lib/validation/helpers';
import { adminGiveawaysSettingsPutSchema } from '@/lib/validation/schemas/admin-bodies';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const enabled = await getGiveawaysEnabled();
    return NextResponse.json({ enabled });
  } catch (error) {
    console.error('[admin/giveaways-settings] GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const raw = await request.json().catch(() => ({}));
    const parsed = safeParseJson(raw, adminGiveawaysSettingsPutSchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const enabled = await setGiveawaysEnabled(parsed.data.enabled, session.user.id);
    return NextResponse.json({ enabled });
  } catch (error) {
    console.error('[admin/giveaways-settings] PUT error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
