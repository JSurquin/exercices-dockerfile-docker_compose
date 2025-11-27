import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { FraudDetector } from '@/lib/security/fraud-detector';
import { logger } from '@/lib/logger';

// Helper function pour encapsuler les requêtes Prisma avec gestion d'erreur
async function safeQuery<T>(queryFn: () => Promise<T>, fallback: T, description: string): Promise<T> {
  try {
    await new Promise(resolve => setTimeout(resolve, 50)); // Délai entre chaque requête
    const result = await queryFn();
    return result;
  } catch (error) {
    logger.error(`Error in ${description}:`, error);
    return fallback;
  }
}

async function handleGetDashboard(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({
      headers: await headers() as Headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const url = new URL(req.url);
    const timeframe = url.searchParams.get('timeframe') || '24h';
    const action = url.searchParams.get('action');
    const severity = url.searchParams.get('severity');
    const userId = url.searchParams.get('userId');

    // Calculer la période
    const now = new Date();
    let since: Date;
    let timeframeMs: number;

    switch (timeframe) {
      case '1h':
        timeframeMs = 60 * 60 * 1000;
        since = new Date(now.getTime() - timeframeMs);
        break;
      case '7d':
        timeframeMs = 7 * 24 * 60 * 60 * 1000;
        since = new Date(now.getTime() - timeframeMs);
        break;
      case '30d':
        timeframeMs = 30 * 24 * 60 * 60 * 1000;
        since = new Date(now.getTime() - timeframeMs);
        break;
      default: // 24h
        timeframeMs = 24 * 60 * 60 * 1000;
        since = new Date(now.getTime() - timeframeMs);
    }

    // Construire les filtres pour les logs
    const logFilters: any = {
      createdAt: { gte: since },
    };

    if (action && action !== 'all') {
      logFilters.action = action;
    }

    if (userId) {
      logFilters.userId = userId;
    }

    if (severity && severity !== 'all') {
      logFilters.details = {
        path: ['severity'],
        equals: severity,
      };
    }

    logger.info('🔄 Fetching dashboard data sequentially...');

    // === PARTIE 1: AUDIT LOGS ===
    logger.info('📋 Fetching audit logs...');
    
    const auditLogs = await safeQuery(
      () => prisma.auditLog.findMany({
        where: logFilters,
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          userId: true,
          action: true,
          details: true,
          ipAddress: true,
          createdAt: true,
        },
      }),
      [],
      'audit logs'
    );

    const totalLogs = await safeQuery(
      () => prisma.auditLog.count({ where: logFilters }),
      0,
      'total logs count'
    );

    // === PARTIE 2: SECURITY METRICS (séquentiellement) ===
    logger.info('🔒 Fetching security metrics...');

    // Métriques de base
    const criticalAlerts = await safeQuery(
      () => prisma.auditLog.count({
        where: {
          createdAt: { gte: since },
          details: { path: ['severity'], equals: 'critical' },
        },
      }),
      0,
      'critical alerts'
    );

    const suspiciousActivities = await safeQuery(
      () => prisma.auditLog.count({
        where: {
          createdAt: { gte: since },
          action: { contains: 'suspicious' },
        },
      }),
      0,
      'suspicious activities'
    );

    const failedLogins = await safeQuery(
      () => prisma.auditLog.count({
        where: {
          createdAt: { gte: since },
          action: 'user.login_failed',
        },
      }),
      0,
      'failed logins'
    );

    const adminActions = await safeQuery(
      () => prisma.auditLog.count({
        where: {
          createdAt: { gte: since },
          action: { startsWith: 'admin.' },
        },
      }),
      0,
      'admin actions'
    );

    const paymentActions = await safeQuery(
      () => prisma.auditLog.count({
        where: {
          createdAt: { gte: since },
          action: { contains: 'payout' },
        },
      }),
      0,
      'payment actions'
    );

    const tradeActions = await safeQuery(
      () => prisma.auditLog.count({
        where: {
          createdAt: { gte: since },
          action: { contains: 'trade' },
        },
      }),
      0,
      'trade actions'
    );

    // Top IPs (avec agrégation côté client)
    logger.info('🌐 Fetching top IPs...');
    const ipLogs = await safeQuery(
      () => prisma.auditLog.findMany({
        where: {
          createdAt: { gte: since },
          ipAddress: { not: null },
        },
        select: { ipAddress: true },
      }),
      [],
      'IP logs'
    );

    const ipCounts: Record<string, number> = {};
    ipLogs.forEach(log => {
      if (log.ipAddress) {
        ipCounts[log.ipAddress] = (ipCounts[log.ipAddress] || 0) + 1;
      }
    });

    const topIPs = Object.entries(ipCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));

    // Top Users (avec agrégation côté client)
    logger.info('👥 Fetching top users...');
    const userLogs = await safeQuery(
      () => prisma.auditLog.findMany({
        where: {
          createdAt: { gte: since },
          userId: { not: 'system' },
        },
        select: { userId: true },
      }),
      [],
      'user logs'
    );

    const userCounts: Record<string, number> = {};
    userLogs.forEach(log => {
      if (log.userId) {
        userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
      }
    });

    const topUsers = Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));

    // Activités récentes suspectes
    logger.info('⚠️ Fetching recent suspicious activities...');
    const recentSuspiciousActivities = await safeQuery(
      () => prisma.auditLog.findMany({
        where: {
          createdAt: { gte: since },
          OR: [
            { action: { contains: 'suspicious' } },
            { details: { path: ['severity'], equals: 'high' } },
            { details: { path: ['severity'], equals: 'critical' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          userId: true,
          action: true,
          details: true,
          ipAddress: true,
          createdAt: true,
        },
      }),
      [],
      'recent suspicious activities'
    );

    // Détection de pics d'activité
    logger.info('📊 Detecting activity spikes...');
    const activitySpikes = await safeQuery(
      () => FraudDetector.detectActivitySpikes(),
      { hasSpike: false, currentRate: 0, averageRate: 0, threshold: 0 },
      'activity spikes'
    );

    // Tendances (comparaison avec période précédente)
    logger.info('📈 Calculating trends...');
    const previousPeriodSince = new Date(since.getTime() - timeframeMs);
    const previousPeriodUntil = since;

    const previousFraudDetections = await safeQuery(
      () => prisma.auditLog.count({
        where: {
          createdAt: { gte: previousPeriodSince, lt: previousPeriodUntil },
          OR: [
            { action: { contains: 'suspicious' } },
            { details: { path: ['severity'], equals: 'high' } },
            { details: { path: ['severity'], equals: 'critical' } },
          ],
        },
      }),
      0,
      'previous fraud detections'
    );

    const currentFraudDetections = suspiciousActivities + criticalAlerts;
    const fraudTrend = previousFraudDetections > 0 
      ? ((currentFraudDetections - previousFraudDetections) / previousFraudDetections) * 100 
      : 0;

    logger.info('✅ Dashboard data fetched successfully');

    // Construire la réponse complète
    const response = {
      // Données des logs d'audit
      logs: auditLogs,
      totalLogs,
      
      // Métriques de sécurité
      metrics: {
        totalLogs,
        criticalAlerts,
        suspiciousActivities,
        failedLogins,
        adminActions,
        paymentActions,
        tradeActions,
        recentActivity: recentSuspiciousActivities,
        
        // Analyses avancées
        topIPs,
        topUsers,
        activitySpikes,
        fraudTrend,
        
        // Métadonnées
        timeframe,
        since: since.toISOString(),
        generatedAt: new Date().toISOString(),
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement du dashboard' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleGetDashboard(req);
}
