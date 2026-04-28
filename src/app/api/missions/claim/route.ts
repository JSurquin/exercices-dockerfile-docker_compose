import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { claimMission } from '@/lib/missions';
import { safeParseJson } from '@/lib/validation/helpers';
import { missionClaimPostSchema } from '@/lib/validation/schemas/payout-security';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    let raw: unknown = {};
    try {
      raw = await request.json();
    } catch {
      raw = {};
    }
    const parsed = safeParseJson(raw, missionClaimPostSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    const result = await claimMission(session.user.id, parsed.data.missionKey);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ fragments: result.fragments });
  } catch (error) {
    console.error('[missions/claim] POST', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
