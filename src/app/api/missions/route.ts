import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { listMissionsForUser } from '@/lib/missions';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const missions = await listMissionsForUser(session.user.id);
    return NextResponse.json({ missions });
  } catch (error) {
    console.error('[missions] GET', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
