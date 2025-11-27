import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { withSecurity } from '@/lib/security';
import { AuditLogger, AuditAction } from '@/lib/security';
import { FraudDetector } from '@/lib/security';
import { logger } from '@/lib/logger';
import {headers} from 'next/headers';
import { Session } from 'better-auth';

// Fonction helper pour exécuter une requête avec fallback
async function safeQuery<T>(
  queryFn: () => Promise<T>, 
  fallback: T, 
  errorMessage: string
): Promise<T> {
  try {
    return await queryFn();
  } catch (error) {
    logger.error(errorMessage, error);
    return fallback;
  }
}

async function handleGetSecurityMetrics(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({
      headers: await headers() as Headers,
    });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const timeframe = url.searchParams.get('timeframe') || 'day';
    const validTimeframes = ['hour', 'day', 'week', 'month'];
    
    if (!validTimeframes.includes(timeframe)) {
      return NextResponse.json({ error: 'Invalid timeframe' }, { status: 400 });
    }

    // Calculer la période
    const timeframeMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    }[timeframe];

    const since = new Date(Date.now() - (timeframeMs || 0));

    // Récupérer les métriques de sécurité (séquentiel pour éviter surcharge Prisma)
    
    const rateLimitHits = await safeQuery(
      () => prisma.auditLog.count({
        where: {
          action: AuditAction.RATE_LIMIT_EXCEEDED,
          createdAt: { gte: since },
        },
      }),
      0,
      'Error fetching rate limit hits'
    );

    await new Promise(resolve => setTimeout(resolve, 25));

    const fraudDetections = await safeQuery(
      () => prisma.auditLog.count({
        where: {
          action: AuditAction.SUSPICIOUS_ACTIVITY,
          createdAt: { gte: since },
        },
      }),
      0,
      'Error fetching fraud detections'
    );

    await new Promise(resolve => setTimeout(resolve, 25));

    const blockedIPs = await safeQuery(
      () => prisma.auditLog.count({
        where: {
          action: AuditAction.IP_BLOCKED,
          createdAt: { gte: since },
        },
      }),
      0,
      'Error fetching blocked IPs'
    );

    await new Promise(resolve => setTimeout(resolve, 25));

    const suspiciousActivities = await safeQuery(
      () => prisma.auditLog.count({
        where: {
          action: AuditAction.SUSPICIOUS_ACTIVITY,
          createdAt: { gte: since },
        },
      }),
      0,
      'Error fetching suspicious activities'
    );

    await new Promise(resolve => setTimeout(resolve, 25));

    const loginFailures = await safeQuery(
      () => prisma.auditLog.count({
        where: {
          action: AuditAction.USER_LOGIN_FAILED,
          createdAt: { gte: since },
        },
      }),
      0,
      'Error fetching login failures'
    );

    await new Promise(resolve => setTimeout(resolve, 25));

    const accountLocks = await safeQuery(
      () => prisma.auditLog.count({
        where: {
          action: AuditAction.ACCOUNT_LOCKED,
          createdAt: { gte: since },
        },
      }),
      0,
      'Error fetching account locks'
    );

    await new Promise(resolve => setTimeout(resolve, 25));

    const ibanChanges = await safeQuery(
      () => prisma.auditLog.count({
        where: {
          action: AuditAction.IBAN_CHANGED,
          createdAt: { gte: since },
        },
      }),
      0,
      'Error fetching IBAN changes'
    );

    await new Promise(resolve => setTimeout(resolve, 25));

    const payoutRequests = await safeQuery(
      () => prisma.auditLog.count({
        where: {
          action: AuditAction.PAYOUT_REQUESTED,
          createdAt: { gte: since },
        },
      }),
      0,
      'Error fetching payout requests'
    );

    // Récupérer les IPs les plus actives (séquentiel pour éviter les conflits)
    const topIPs = [];
    try {
      // Attendre un peu pour éviter les conflits avec les requêtes précédentes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const ipLogs = await prisma.auditLog.findMany({
        where: {
          createdAt: { gte: since },
          ipAddress: { not: null },
        },
        select: { ipAddress: true },
        take: 100, // Réduit pour éviter la surcharge
      });
      
      const ipCounts = new Map();
      ipLogs.forEach(log => {
        if (log.ipAddress) {
          ipCounts.set(log.ipAddress, (ipCounts.get(log.ipAddress) || 0) + 1);
        }
      });
      
      topIPs.push(...Array.from(ipCounts.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([ip, count]) => ({ ipAddress: ip, _count: { id: count } })));
    } catch (error) {
      console.error('Error fetching top IPs:', error);
    }

    // Récupérer les utilisateurs les plus actifs (séquentiel pour éviter les conflits)
    const topUsers = [];
    try {
      // Attendre un peu pour éviter les conflits
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const userLogs = await prisma.auditLog.findMany({
        where: {
          createdAt: { gte: since },
          userId: { not: 'system' },
        },
        select: { userId: true },
        take: 100, // Réduit pour éviter la surcharge
      });
      
      const userCounts = new Map();
      userLogs.forEach(log => {
        if (log.userId) {
          userCounts.set(log.userId, (userCounts.get(log.userId) || 0) + 1);
        }
      });
      
      topUsers.push(...Array.from(userCounts.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([userId, count]) => ({ userId, _count: { id: count } })));
    } catch (error) {
      console.error('Error fetching top users:', error);
    }

    // Attendre avant les dernières requêtes
    await new Promise(resolve => setTimeout(resolve, 100));

    // Récupérer les activités récentes suspectes
    const recentSuspiciousActivities = await safeQuery(
      () => prisma.auditLog.findMany({
        where: {
          action: AuditAction.SUSPICIOUS_ACTIVITY,
          createdAt: { gte: since },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          userId: true,
          ipAddress: true,
          action: true,
          details: true,
          createdAt: true,
        },
      }),
      [],
      'Error fetching recent suspicious activities'
    );

    await new Promise(resolve => setTimeout(resolve, 50));

    // Détecter les pics d'activité actuels
    const activitySpike = await safeQuery(
      () => FraudDetector.detectActivitySpikes(),
      {
        hasSpike: false,
        currentRate: 0,
        averageRate: 0,
        threshold: 0,
      },
      'Error detecting activity spikes'
    );

    await new Promise(resolve => setTimeout(resolve, 50));

    // Calculer les tendances (comparaison avec la période précédente)
    const previousPeriodSince = new Date(since.getTime() - (timeframeMs || 0));
    const previousPeriodUntil = since;

    const previousFraudDetections = await safeQuery(
      () => prisma.auditLog.count({
        where: {
          action: AuditAction.SUSPICIOUS_ACTIVITY,
          createdAt: { gte: previousPeriodSince, lt: previousPeriodUntil },
        },
      }),
      0,
      'Error fetching previous fraud detections'
    );

    const fraudTrend = previousFraudDetections > 0 
      ? ((fraudDetections - previousFraudDetections) / previousFraudDetections) * 100
      : fraudDetections > 0 ? 100 : 0;

    const metrics = {
      timeframe,
      period: {
        start: since.toISOString(),
        end: new Date().toISOString(),
      },
      overview: {
        rateLimitHits,
        fraudDetections,
        blockedIPs,
        suspiciousActivities,
        loginFailures,
        accountLocks,
        ibanChanges,
        payoutRequests,
      },
      trends: {
        fraudDetectionTrend: Math.round(fraudTrend * 100) / 100,
      },
      activitySpike: {
        detected: activitySpike.hasSpike,
        currentRate: activitySpike.currentRate,
        averageRate: Math.round(activitySpike.averageRate * 100) / 100,
        threshold: Math.round(activitySpike.threshold * 100) / 100,
      },
      topIPs: topIPs.map(ip => ({
        ip: ip.ipAddress,
        count: ip._count.id,
      })),
      topUsers: topUsers.map(user => ({
        userId: user.userId,
        count: user._count.id,
      })),
      recentSuspiciousActivities: recentSuspiciousActivities.map(activity => ({
        id: activity.id,
        userId: activity.userId,
        ip: activity.ipAddress,
        details: activity.details,
        timestamp: activity.createdAt,
      })),
    };

    // Logger l'accès aux métriques de sécurité - DÉSACTIVÉ pour éviter les boucles
    // await AuditLogger.logAdminAction(
    //   session.session.userId,
    //   'security_metrics_accessed',
    //   undefined,
    //   { timeframe },
    //   req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    // );

    return NextResponse.json(metrics);

  } catch (error) {
    logger.error('Security metrics error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Appliquer le middleware de sécurité pour les actions sensibles

export const GET = withSecurity(handleGetSecurityMetrics, 'sensitive');
