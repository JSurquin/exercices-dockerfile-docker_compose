import { prisma } from '../../../prisma/prisma';
import { AuditLogger, AuditAction } from './audit-logger';
import { logger } from '@/lib/logger';

interface FraudDetectionResult {
  isSuspicious: boolean;
  riskScore: number; // 0-100
  reasons: string[];
  recommendedAction: 'allow' | 'review' | 'block';
}

interface UserActivity {
  userId: string;
  ipAddress: string;
  userAgent?: string;
  action: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class FraudDetector {
  /**
   * Analyse une activité utilisateur pour détecter la fraude
   */
  static async analyzeActivity(activity: UserActivity): Promise<FraudDetectionResult> {
    const checks = [
      this.checkVelocityFraud(activity),
      this.checkIPReputation(activity),
      this.checkUserBehavior(activity),
      this.checkGeolocation(activity),
      this.checkDeviceFingerprint(activity),
    ];

    const results = await Promise.all(checks);
    
    let totalRiskScore = 0;
    const allReasons: string[] = [];
    
    results.forEach(result => {
      totalRiskScore += result.riskScore;
      allReasons.push(...result.reasons);
    });

    // Normaliser le score de risque
    const normalizedScore = Math.min(100, totalRiskScore);
    
    const isSuspicious = normalizedScore >= 60;
    const recommendedAction = this.getRecommendedAction(normalizedScore);

    if (isSuspicious) {
      await AuditLogger.logSuspiciousActivity(
        activity.userId,
        activity.ipAddress,
        'Fraud detection triggered',
        {
          riskScore: normalizedScore,
          reasons: allReasons,
          action: activity.action,
          recommendedAction,
        }
      );
    }

    return {
      isSuspicious,
      riskScore: normalizedScore,
      reasons: allReasons,
      recommendedAction,
    };
  }

  /**
   * Vérifie la fraude de vélocité (trop d'actions en peu de temps)
   */
  private static async checkVelocityFraud(activity: UserActivity): Promise<{
    riskScore: number;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let riskScore = 0;

    const timeWindows = [
      { minutes: 5, maxActions: 10, risk: 30 },
      { minutes: 15, maxActions: 25, risk: 20 },
      { minutes: 60, maxActions: 50, risk: 15 },
    ];

    for (const window of timeWindows) {
      const since = new Date(Date.now() - window.minutes * 60 * 1000);
      
      const recentActions = await prisma.auditLog.count({
        where: {
          userId: activity.userId,
          createdAt: { gte: since },
        },
      });

      if (recentActions > window.maxActions) {
        riskScore += window.risk;
        reasons.push(`${recentActions} actions in ${window.minutes} minutes (max: ${window.maxActions})`);
      }
    }

    // Vérifier les actions spécifiques sensibles
    const sensitiveActions = [
      'payment.method_added',
      'payment.iban_changed',
      'payout.requested',
      'trade.created',
    ];

    for (const sensitiveAction of sensitiveActions) {
      const recentSensitive = await prisma.auditLog.count({
        where: {
          userId: activity.userId,
          action: sensitiveAction,
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // 1 heure
        },
      });

      if (recentSensitive > 3) {
        riskScore += 25;
        reasons.push(`Too many ${sensitiveAction} actions: ${recentSensitive}`);
      }
    }

    return { riskScore, reasons };
  }

  /**
   * Vérifie la réputation de l'IP
   */
  private static async checkIPReputation(activity: UserActivity): Promise<{
    riskScore: number;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Vérifier si l'IP a été bloquée récemment
    const recentBlocks = await prisma.auditLog.count({
      where: {
        ipAddress: activity.ipAddress,
        action: AuditAction.IP_BLOCKED,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // 24h
      },
    });

    if (recentBlocks > 0) {
      riskScore += 40;
      reasons.push(`IP recently blocked ${recentBlocks} times`);
    }

    // Vérifier le nombre d'utilisateurs différents depuis cette IP
    const uniqueUsers = await prisma.auditLog.findMany({
      where: {
        ipAddress: activity.ipAddress,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    if (uniqueUsers.length > 10) {
      riskScore += 30;
      reasons.push(`Too many users from same IP: ${uniqueUsers.length}`);
    }

    // Vérifier les échecs de connexion depuis cette IP
    const loginFailures = await prisma.auditLog.count({
      where: {
        ipAddress: activity.ipAddress,
        action: AuditAction.USER_LOGIN_FAILED,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // 1h
      },
    });

    if (loginFailures > 5) {
      riskScore += 25;
      reasons.push(`Multiple login failures from IP: ${loginFailures}`);
    }

    return { riskScore, reasons };
  }

  /**
   * Analyse le comportement utilisateur
   */
  private static async checkUserBehavior(activity: UserActivity): Promise<{
    riskScore: number;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: activity.userId },
      include: {
        trades: {
          where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        },
        payouts: {
          where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        },
      },
    });

    if (!user) {
      riskScore += 50;
      reasons.push('User not found');
      return { riskScore, reasons };
    }

    // Vérifier si c'est un nouveau compte avec activité élevée
    const accountAge = Date.now() - user.createdAt.getTime();
    const accountAgeDays = accountAge / (24 * 60 * 60 * 1000);

    if (accountAgeDays < 7) {
      const recentTrades = user.trades.length;
      const recentPayouts = user.payouts.length;

      if (recentTrades > 5) {
        riskScore += 30;
        reasons.push(`New account with high trade activity: ${recentTrades} trades`);
      }

      if (recentPayouts > 2) {
        riskScore += 35;
        reasons.push(`New account with multiple payouts: ${recentPayouts}`);
      }
    }

    // Vérifier les volumes anormaux
    const totalVolume = user.trades.reduce((sum, trade) => sum + trade.grossCents, 0);
    const averageVolume = totalVolume / Math.max(1, user.trades.length);

    if (averageVolume > 50000) { // Plus de 500€ par trade en moyenne
      riskScore += 20;
      reasons.push(`High average trade volume: ${averageVolume / 100}€`);
    }

    // Vérifier les changements fréquents de méthodes de paiement
    const paymentMethodChanges = await prisma.auditLog.count({
      where: {
        userId: activity.userId,
        action: AuditAction.PAYMENT_METHOD_UPDATED,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // 7 jours
      },
    });

    if (paymentMethodChanges > 3) {
      riskScore += 25;
      reasons.push(`Frequent payment method changes: ${paymentMethodChanges}`);
    }

    return { riskScore, reasons };
  }

  /**
   * Vérifie la géolocalisation
   */
  private static async checkGeolocation(activity: UserActivity): Promise<{
    riskScore: number;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Récupérer les IPs récentes de l'utilisateur
    const recentIPs = await prisma.auditLog.findMany({
      where: {
        userId: activity.userId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        ipAddress: { not: null },
      },
      select: { ipAddress: true },
      distinct: ['ipAddress'],
      take: 10,
    });

    // Si trop d'IPs différentes en peu de temps
    if (recentIPs.length > 5) {
      riskScore += 30;
      reasons.push(`Multiple IPs in 24h: ${recentIPs.length}`);
    }

    // TODO: Intégrer un service de géolocalisation IP pour détecter
    // les changements de pays/région suspects

    return { riskScore, reasons };
  }

  /**
   * Vérifie l'empreinte du dispositif
   */
  private static async checkDeviceFingerprint(activity: UserActivity): Promise<{
    riskScore: number;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let riskScore = 0;

    if (!activity.userAgent) {
      riskScore += 15;
      reasons.push('Missing user agent');
      return { riskScore, reasons };
    }

    // Vérifier les User-Agents suspects
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(activity.userAgent)) {
        riskScore += 40;
        reasons.push('Suspicious user agent detected');
        break;
      }
    }

    // Vérifier les changements fréquents de User-Agent
    const recentUserAgents = await prisma.auditLog.findMany({
      where: {
        userId: activity.userId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: { 
        details: true,
      },
      take: 50,
    });

    // TODO: Extraire et analyser les User-Agents des détails
    // pour détecter les changements suspects

    return { riskScore, reasons };
  }

  /**
   * Détermine l'action recommandée basée sur le score de risque
   */
  private static getRecommendedAction(riskScore: number): 'allow' | 'review' | 'block' {
    if (riskScore >= 80) return 'block';
    if (riskScore >= 60) return 'review';
    return 'allow';
  }

  /**
   * Analyse les pics d'activité globaux
   */
  static async detectActivitySpikes(): Promise<{
    hasSpike: boolean;
    currentRate: number;
    averageRate: number;
    threshold: number;
  }> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Activité de la dernière heure
    const currentHourActivity = await prisma.auditLog.count({
      where: {
        createdAt: { gte: oneHourAgo },
      },
    });

    // Activité moyenne des 24 dernières heures (par heure)
    const last24HoursActivity = await prisma.auditLog.count({
      where: {
        createdAt: { gte: oneDayAgo },
      },
    });

    const averageHourlyRate = last24HoursActivity / 24;
    const threshold = averageHourlyRate * 3; // 3x la moyenne = pic suspect

    const hasSpike = currentHourActivity > threshold && threshold > 10; // Minimum 10 pour éviter les faux positifs

    if (hasSpike) {
      await AuditLogger.log({
        action: AuditAction.SUSPICIOUS_ACTIVITY,
        details: {
          type: 'activity_spike',
          currentRate: currentHourActivity,
          averageRate: averageHourlyRate,
          threshold,
          timestamp: now.toISOString(),
        },
        severity: 'critical',
      });

      logger.warn('Activity spike detected', {
        currentRate: currentHourActivity,
        averageRate: averageHourlyRate,
        threshold,
      });
    }

    return {
      hasSpike,
      currentRate: currentHourActivity,
      averageRate: averageHourlyRate,
      threshold,
    };
  }

  /**
   * Vérifie si un utilisateur doit être mis en cooldown
   */
  static async checkCooldownRequired(userId: string, action: string): Promise<{
    required: boolean;
    remainingTime: number; // en millisecondes
    reason?: string;
  }> {
    const cooldownPeriods = {
      'iban_change': 7 * 24 * 60 * 60 * 1000, // 7 jours
      'payment_method_change': 24 * 60 * 60 * 1000, // 24 heures
      'kyc_resubmission': 24 * 60 * 60 * 1000, // 24 heures
    };

    const cooldownMs = cooldownPeriods[action as keyof typeof cooldownPeriods];
    if (!cooldownMs) {
      return { required: false, remainingTime: 0 };
    }

    const lastAction = await prisma.auditLog.findFirst({
      where: {
        userId,
        action: action as any,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastAction) {
      return { required: false, remainingTime: 0 };
    }

    const timeSinceLastAction = Date.now() - lastAction.createdAt.getTime();
    const remainingTime = cooldownMs - timeSinceLastAction;

    if (remainingTime > 0) {
      return {
        required: true,
        remainingTime,
        reason: `Cooldown period active for ${action}`,
      };
    }

    return { required: false, remainingTime: 0 };
  }
}
