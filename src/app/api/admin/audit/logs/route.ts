import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { 
  getRequestContext, 
  logUnauthorizedAccess, 
  logAdminAccess 
} from '@/lib/security/audit-helpers';

export async function GET(request: NextRequest) {
  const context = getRequestContext(request);
  
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      await logUnauthorizedAccess(context, '/api/admin/audit/logs', 'No valid session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Vérifier les permissions admin (utiliser la session directement)
    if (!session.user.role || session.user.role !== 'ADMIN') {
      await logUnauthorizedAccess(context, '/api/admin/audit/logs', 'Insufficient permissions');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    context.userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const severity = searchParams.get('severity');
    const userId = searchParams.get('userId');
    const timeframe = searchParams.get('timeframe') || '24h';
    const isExport = searchParams.get('export') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Calculer la date de début selon la période
    const timeframeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    }[timeframe] || 24 * 60 * 60 * 1000;

    const since = new Date(Date.now() - timeframeMs);

    // Construire les filtres
    const where: any = {
      createdAt: { gte: since }
    };

    if (action) {
      where.action = action;
    }

    if (userId) {
      where.userId = userId;
    }

    if (severity) {
      where.details = {
        path: ['severity'],
        equals: severity
      };
    }

    // Log de l'accès admin - DÉSACTIVÉ pour éviter les boucles
    // await logAdminAccess(context, 'audit_logs_accessed', undefined, {
    //   filters: { action, severity, userId, timeframe },
    //   isExport
    // });

    if (isExport) {
      // Export CSV
      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10000 // Limite pour l'export
      });

      // Générer le CSV
      const csvHeaders = [
        'Date',
        'Utilisateur',
        'Action',
        'Sévérité',
        'IP',
        'Détails'
      ].join(',');

      const csvRows = logs.map(log => [
        log.createdAt.toISOString(),
        log.userId || 'Système',
        log.action,
        (log.details as any)?.severity || 'low',
        log.ipAddress || '',
        JSON.stringify(log.details).replace(/"/g, '""')
      ].map(field => `"${field}"`).join(','));

      const csv = [csvHeaders, ...csvRows].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Récupérer les logs avec pagination (séquentiel pour éviter surcharge Prisma)
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit
    });

    // Petit délai avant la deuxième requête
    await new Promise(resolve => setTimeout(resolve, 50));

    const total = await prisma.auditLog.count({ where });

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Audit logs fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
