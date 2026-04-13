import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { claimMission } from '@/lib/missions';

/**
 * Auto-claim silencieux de la DAILY_VISIT à chaque visite du dashboard.
 * Retourne { ok, fragments } si réclamé, { ok: false, alreadyClaimed: true } si déjà fait aujourd'hui.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Non authentifié' }, { status: 401 });
    }

    const result = await claimMission(session.user.id, 'DAILY_VISIT');

    if (!result.ok) {
      // "Déjà réclamée" n'est pas une erreur ici — on renvoie 200 silencieux
      return NextResponse.json({ ok: false, alreadyClaimed: true });
    }

    return NextResponse.json({ ok: true, fragments: result.fragments });
  } catch (error) {
    console.error('[missions/daily-visit] POST', error);
    return NextResponse.json({ ok: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
