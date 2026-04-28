import { NextRequest, NextResponse } from 'next/server';
import {
  getPointsConfig,
  setPointsConfig,
  getPointsMetrics,
} from '@/lib/points-service';
import { safeParseJson } from '@/lib/validation/helpers';
import { adminPointsPostSchema } from '@/lib/validation/schemas/admin-bodies';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');

    if (view === 'metrics') {
      const metrics = await getPointsMetrics();
      return NextResponse.json(metrics);
    }

    const config = await getPointsConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error('[admin/points] GET error:', error);
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
    const parsed = safeParseJson(raw, adminPointsPostSchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const config = await setPointsConfig(parsed.data, session.user.id);
    return NextResponse.json(config);
  } catch (error) {
    console.error('[admin/points] PUT error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
