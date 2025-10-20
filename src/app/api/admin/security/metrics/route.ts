import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '../../../../../../prisma/prisma';
import { withSecurity } from '@/lib/security';
import { AuditLogger, AuditAction } from '@/lib/security';
import { FraudDetector } from '@/lib/security';
import { logger } from '@/lib/logger';
import {headers} from 'next/headers';

async function handleGetSecurityMetrics(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({
      headers: await headers() as Headers,
    });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: session.session.userId },
      select: { role: true },
    });

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

    // Récupérer les métriques de sécurité
    const [
      rateLimitHits,
      fraudDetections,
      blockedIPs,
      suspiciousActivities,
      loginFailures,
      accountLocks,
      ibanChanges,
      payoutRequests,
    ] = await Promise.all([
      // Rate limit hits
      prisma.auditLog.count({
        where: {
          action: AuditAction.RATE_LIMIT_EXCEEDED,
          createdAt: { gte: since },
        },
      }),
      
      // Fraud detections
      prisma.auditLog.count({
        where: {
          action: AuditAction.SUSPICIOUS_ACTIVITY,
          createdAt: { gte: since },
        },
      }),
      
      // Blocked IPs
      prisma.auditLog.count({
        where: {
          action: AuditAction.IP_BLOCKED,
          createdAt: { gte: since },
        },
      }),
      
      // Suspicious activities
      prisma.auditLog.count({
        where: {
          action: AuditAction.SUSPICIOUS_ACTIVITY,
          createdAt: { gte: since },
        },
      }),
      
      // Login failures
      prisma.auditLog.count({
        where: {
          action: AuditAction.USER_LOGIN_FAILED,
          createdAt: { gte: since },
        },
      }),
      
      // Account locks
      prisma.auditLog.count({
        where: {
          action: AuditAction.ACCOUNT_LOCKED,
          createdAt: { gte: since },
        },
      }),
      
      // IBAN changes
      prisma.auditLog.count({
        where: {
          action: AuditAction.IBAN_CHANGED,
          createdAt: { gte: since },
        },
      }),
      
      // Payout requests
      prisma.auditLog.count({
        where: {
          action: AuditAction.PAYOUT_REQUESTED,
          createdAt: { gte: since },
        },
      }),
    ]);

    // Récupérer les IPs les plus actives
    const topIPs = await prisma.auditLog.groupBy({
      by: ['ipAddress'],
      where: {
        createdAt: { gte: since },
        ipAddress: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Récupérer les utilisateurs les plus actifs
    const topUsers = await prisma.auditLog.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: since },
        userId: { not: 'system' },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Récupérer les activités récentes suspectes
    const recentSuspiciousActivities = await prisma.auditLog.findMany({
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
    });

    // Détecter les pics d'activité actuels
    const activitySpike = await FraudDetector.detectActivitySpikes();

    // Calculer les tendances (comparaison avec la période précédente)
    const previousPeriodSince = new Date(since.getTime() - (timeframeMs || 0));
    const previousPeriodUntil = since;

    const previousFraudDetections = await prisma.auditLog.count({
      where: {
        action: AuditAction.SUSPICIOUS_ACTIVITY,
        createdAt: { gte: previousPeriodSince, lt: previousPeriodUntil },
      },
    });

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

    // Logger l'accès aux métriques de sécurité
    await AuditLogger.logAdminAction(
      session.session.userId,
      'security_metrics_accessed',
      undefined,
      { timeframe },
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    );

    return NextResponse.json(metrics);

  } catch (error) {
    logger.error('Security metrics error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Appliquer le middleware de sécurité pour les actions sensibles
export const GET = withSecurity(handleGetSecurityMetrics, 'sensitive');
