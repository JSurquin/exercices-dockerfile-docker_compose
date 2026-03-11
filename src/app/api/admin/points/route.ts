import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import {
  getPointsConfig,
  setPointsConfig,
  getPointsMetrics,
} from '@/lib/points-service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || session.user.role !== 'ADMIN') {
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
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const config = await setPointsConfig(body, session.user.id);
    return NextResponse.json(config);
  } catch (error) {
    console.error('[admin/points] PUT error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
