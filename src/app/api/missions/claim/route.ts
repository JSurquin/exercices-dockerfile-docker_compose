import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { claimMission } from '@/lib/missions';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const missionKey = typeof body.missionKey === 'string' ? body.missionKey : '';
    if (!missionKey) {
      return NextResponse.json({ error: 'missionKey requis' }, { status: 400 });
    }

    const result = await claimMission(session.user.id, missionKey);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ fragments: result.fragments });
  } catch (error) {
    console.error('[missions/claim] POST', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
