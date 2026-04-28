import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { securityService } from '@/lib/security-service';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);

    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const alerts = await securityService.getRecentFraudAlerts(limit);

    return NextResponse.json({
      alerts: alerts.map(alert => ({
        userId: alert.userId,
        type: alert.type.toLowerCase(),
        severity: alert.severity.toLowerCase(),
        details: alert.details,
        triggeredAt: alert.triggeredAt.toISOString(),
      })),
      total: alerts.length,
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des alertes de sécurité', { error });
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

