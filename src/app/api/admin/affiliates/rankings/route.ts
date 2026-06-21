import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin';
import { getAffiliateRankings } from '@/lib/affiliate-metrics';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    const limit = Math.min(
      50,
      Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '20', 10) || 20)
    );

    const rankings = await getAffiliateRankings(limit);

    return NextResponse.json({ success: true, data: { rankings } });
  } catch (error) {
    console.error('[admin/affiliates/rankings]', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
