import { NextRequest, NextResponse } from 'next/server';
import { getGamificationEconomyDashboard } from '@/lib/gamification-economy';
import { getPlatformConfig } from '@/lib/platform-config-service';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const platformConfig = await getPlatformConfig();
    const margin = parseFloat(searchParams.get('marginRate') ?? String(platformConfig.gamificationMarginRate));
    const marginRate = Number.isFinite(margin) && margin > 0 && margin < 1 ? margin : platformConfig.gamificationMarginRate;

    const data = await getGamificationEconomyDashboard(marginRate);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[admin/gamification-economy]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
