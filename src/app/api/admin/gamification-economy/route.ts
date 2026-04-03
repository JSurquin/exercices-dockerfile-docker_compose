import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { getGamificationEconomyDashboard } from '@/lib/gamification-economy';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const margin = parseFloat(searchParams.get('marginRate') ?? '0.05');
    const marginRate = Number.isFinite(margin) && margin > 0 && margin < 1 ? margin : 0.05;

    const data = await getGamificationEconomyDashboard(marginRate);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[admin/gamification-economy]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
