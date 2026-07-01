import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { getAdminProfitMetrics } from '@/lib/admin-profit';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);

    if (!session) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const metrics = await getAdminProfitMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Erreur lors de la récupération du profit admin:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
