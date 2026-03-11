import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { getGiveawaysEnabled, setGiveawaysEnabled } from '@/lib/points-service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || session.user.role !== 'ADMIN') {
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
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    if (typeof body.enabled !== 'boolean') {
      return NextResponse.json({ error: 'Paramètre "enabled" (boolean) requis' }, { status: 400 });
    }
    const enabled = await setGiveawaysEnabled(body.enabled, session.user.id);
    return NextResponse.json({ enabled });
  } catch (error) {
    console.error('[admin/giveaways-settings] PUT error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
