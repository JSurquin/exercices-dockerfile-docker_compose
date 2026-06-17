/**
 * Service de sécurité et anti-fraude
 * Conforme aux règles CTF : limites, cooldowns, détection de fraude
 */

import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import { AuditAction } from '@/lib/security';

export interface AuditLogRecord {
  id: string;
  createdAt: Date;
  userId: string;
  details: {
    type: string;
    severity: string;
    details: Record<string, any>;
    triggeredAt: string;
  };
  ipAddress: string | null;
  action: string;
}

export interface SecurityLimits {
  maxTradesPerDay: number;
  maxPayoutsPerDay: number;
  maxPayoutAmountPerDay: number; // en centimes
  maxPayoutsPerIban: number;
  maxPayoutsPerIp: number;
  cooldownAfterIbanChange: number; // en heures
}

export interface UserPayoutStats {
  avgAmount: number;
  paidPayoutCount: number;
}

/** Seuils anti-fraude « montant inhabituel » (volume spike). */
export const VOLUME_SPIKE_LIMITS = {
  /** Historique minimum pour comparer au montant moyen. */
  minPaidPayouts: 3,
  /** Ratio montant demandé / moyenne historique. */
  ratioThreshold: 3,
  /** Montant absolu minimum avant blocage (12 000 €, aligné admin). */
  absoluteMinCents: 1_200_000,
} as const;

/**
 * Détermine si un montant doit être bloqué pour pic de volume.
 * Les montants courants (< 12 000 €) ne bloquent jamais, même si > 3× la moyenne.
 */
export function shouldBlockVolumeSpike(
  amountCents: number,
  stats: UserPayoutStats,
  limits = VOLUME_SPIKE_LIMITS,
): boolean {
  if (stats.paidPayoutCount < limits.minPaidPayouts) return false;
  if (stats.avgAmount <= 0) return false;
  if (amountCents < limits.absoluteMinCents) return false;
  return amountCents > stats.avgAmount * limits.ratioThreshold;
}

export interface SecurityCheck {
  allowed: boolean;
  reason?: string;
  cooldownUntil?: Date;
  currentUsage?: {
    tradesCount: number;
    payoutsCount: number;
    payoutAmount: number;
  };
}

export interface FraudAlert {
  userId: string;
  type: 'VOLUME_SPIKE' | 'RAPID_SUCCESSION' | 'SUSPICIOUS_IP' | 'MULTIPLE_IBANS' | 'HIGH_FREQUENCY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  details: Record<string, any>;
  triggeredAt: Date;
}

export class SecurityService {
  private readonly limits: SecurityLimits = {
    maxTradesPerDay: 5,
    maxPayoutsPerDay: 3,
    maxPayoutAmountPerDay: 500000, // 5000€
    maxPayoutsPerIban: 10,
    maxPayoutsPerIp: 5,
    cooldownAfterIbanChange: 168, // 7 jours
  };

  /**
   * Vérifie si un utilisateur peut créer un nouveau trade
   */
  async checkTradeEligibility(userId: string, ipAddress?: string): Promise<SecurityCheck> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Compte les trades du jour
      const todayTrades = await prisma.trade.count({
        where: {
          userId,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      if (todayTrades >= this.limits.maxTradesPerDay) {
        return {
          allowed: false,
          reason: `Daily trade limit reached (${this.limits.maxTradesPerDay}/day)`,
          currentUsage: { tradesCount: todayTrades, payoutsCount: 0, payoutAmount: 0 },
        };
      }

      // Détection de pics d'activité suspects
      const recentTrades = await prisma.trade.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Dernière heure
          },
        },
      });

      if (recentTrades >= 3) {
        await this.createFraudAlert({
          userId,
          type: 'RAPID_SUCCESSION',
          severity: 'MEDIUM',
          details: { tradesInLastHour: recentTrades, ipAddress },
          triggeredAt: new Date(),
        });

        return {
          allowed: false,
          reason: 'Suspicious activity detected — please wait before trying again',
        };
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Failed to check trade eligibility', { error, userId });
      return { allowed: false, reason: 'Security check failed' };
    }
  }

  /**
   * Vérifie si un utilisateur peut créer un nouveau payout
   */
  async checkPayoutEligibility(
    userId: string, 
    amountCents: number, 
    paymentMethodId: string,
    ipAddress?: string
  ): Promise<SecurityCheck> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Récupère la méthode de paiement
      const paymentMethod = await prisma.paymentMethod.findUnique({
        where: { id: paymentMethodId },
      });

      if (!paymentMethod) {
        return { allowed: false, reason: 'Payment method not found' };
      }

      if (paymentMethod.userId !== userId) {
        return { allowed: false, reason: 'Payment method not authorized' };
      }

      // Compte les payouts du jour
      const todayPayouts = await prisma.payout.findMany({
        where: {
          userId,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      const payoutsCount = todayPayouts.length;
      const payoutAmount = todayPayouts.reduce((sum, p) => sum + p.amountCents, 0);

      // Vérification des limites quotidiennes
      if (payoutsCount >= this.limits.maxPayoutsPerDay) {
        return {
          allowed: false,
          reason: `Daily payout limit reached (${this.limits.maxPayoutsPerDay}/day)`,
          currentUsage: { tradesCount: 0, payoutsCount, payoutAmount },
        };
      }

      if (payoutAmount + amountCents > this.limits.maxPayoutAmountPerDay) {
        return {
          allowed: false,
          reason: `Daily payout amount limit reached (${this.limits.maxPayoutAmountPerDay / 100}€)`,
          currentUsage: { tradesCount: 0, payoutsCount, payoutAmount },
        };
      }

      // Vérification du cooldown après changement d'IBAN
      if (paymentMethod.type === 'SEPA') {
        const ibanCooldown = await this.checkIbanCooldown(userId, paymentMethodId);
        if (!ibanCooldown.allowed) {
          return ibanCooldown;
        }
      }

      // Vérification des limites par IBAN/IP
      if (paymentMethod.type === 'SEPA') {
        const ibanCheck = await this.checkIbanLimits(paymentMethodId);
        if (!ibanCheck.allowed) {
          return ibanCheck;
        }
      }

      if (ipAddress) {
        const ipCheck = await this.checkIpLimits(ipAddress);
        if (!ipCheck.allowed) {
          return ipCheck;
        }
      }

      // Détection de pics de volume (blocage uniquement au-dessus de 12 000 €)
      const payoutStats = await this.getUserPayoutStats(userId);
      if (shouldBlockVolumeSpike(amountCents, payoutStats)) {
        await this.createFraudAlert({
          userId,
          type: 'VOLUME_SPIKE',
          severity: 'HIGH',
          details: {
            requestedAmount: amountCents,
            averageAmount: payoutStats.avgAmount,
            ratio: amountCents / payoutStats.avgAmount,
            paidPayoutCount: payoutStats.paidPayoutCount,
            ipAddress,
          },
          triggeredAt: new Date(),
        });

        return {
          allowed: false,
          reason: 'Unusual amount detected — manual verification required',
        };
      }

      return { 
        allowed: true,
        currentUsage: { tradesCount: 0, payoutsCount, payoutAmount },
      };
    } catch (error) {
      logger.error('Failed to check payout eligibility', { error, userId });
      return { allowed: false, reason: 'Security check failed' };
    }
  }

  /**
   * Vérifie le cooldown après changement d'IBAN (comparaison par paymentMethodId, IBAN chiffré en BDD).
   */
  private async checkIbanCooldown(userId: string, paymentMethodId: string): Promise<SecurityCheck> {
    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId },
    });

    if (!paymentMethod) {
      return { allowed: false, reason: 'Payment method not found' };
    }

    const recentPayouts = await prisma.payout.findMany({
      where: {
        userId,
        paymentMethod: { type: 'SEPA' },
        status: { in: ['PAID', 'PROCESSING'] },
      },
      select: { paymentMethodId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const lastDifferentIban = recentPayouts.find(p => p.paymentMethodId !== paymentMethodId);

    if (lastDifferentIban) {
      const cooldownEnd = new Date(lastDifferentIban.createdAt);
      cooldownEnd.setHours(cooldownEnd.getHours() + this.limits.cooldownAfterIbanChange);

      if (new Date() < cooldownEnd) {
        return {
          allowed: false,
          reason: `IBAN change cooldown active`,
          cooldownUntil: cooldownEnd,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Vérifie les limites par moyen de paiement (même paymentMethodId = même IBAN, stocké chiffré).
   */
  private async checkIbanLimits(paymentMethodId: string): Promise<SecurityCheck> {
    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId },
    });

    if (!paymentMethod) {
      return { allowed: false, reason: 'Payment method not found' };
    }

    const recentPayouts = await prisma.payout.count({
      where: {
        paymentMethodId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (recentPayouts >= this.limits.maxPayoutsPerIban) {
      return {
        allowed: false,
        reason: `IBAN payout limit reached (${this.limits.maxPayoutsPerIban}/24h)`,
      };
    }

    return { allowed: true };
  }

  /**
   * Vérifie les limites par IP
   */
  private async checkIpLimits(ipAddress: string): Promise<SecurityCheck> {
    // SÉCURITÉ: Utiliser l'action correcte définie dans AuditAction enum
    // (PAYOUT_REQUESTED = 'payout.requested', pas 'PAYOUT_CREATED')
    // Compte les payouts depuis cette IP dans les 24h
    const recentPayouts = await prisma.auditLog.count({
      where: {
        action: AuditAction.PAYOUT_REQUESTED,
        ipAddress,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (recentPayouts >= this.limits.maxPayoutsPerIp) {
      return {
        allowed: false,
        reason: `IP payout limit reached (${this.limits.maxPayoutsPerIp}/24h)`,
      };
    }

    return { allowed: true };
  }

  /**
   * Statistiques des payouts payés d'un utilisateur (derniers 10).
   */
  private async getUserPayoutStats(userId: string): Promise<UserPayoutStats> {
    const payouts = await prisma.payout.findMany({
      where: {
        userId,
        status: 'PAID',
      },
      select: { amountCents: true },
      take: 10,
    });

    if (payouts.length === 0) {
      return { avgAmount: 0, paidPayoutCount: 0 };
    }

    const total = payouts.reduce((sum, p) => sum + p.amountCents, 0);
    return {
      avgAmount: Math.round(total / payouts.length),
      paidPayoutCount: payouts.length,
    };
  }

  /**
   * Crée une alerte de fraude
   */
  async createFraudAlert(alert: FraudAlert): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: alert.userId,
          action: 'FRAUD_ALERT',
          details: {
            type: alert.type,
            severity: alert.severity,
            details: alert.details,
            triggeredAt: alert.triggeredAt,
          },
        },
      });

      logger.warn('Fraud alert created', {
        userId: alert.userId,
        type: alert.type,
        severity: alert.severity,
        details: alert.details,
      });

      // En production, on pourrait envoyer une notification aux admins
      if (alert.severity === 'HIGH') {
        logger.error('Critical fraud alert', alert);
      }
    } catch (error) {
      logger.error('Failed to create fraud alert', { error, alert });
    }
  }

  /**
   * Récupère les alertes de fraude récentes
   */
  async getRecentFraudAlerts(limit: number = 50): Promise<FraudAlert[]> {
    try {
      const alerts = await prisma.auditLog.findMany({
        where: { action: 'FRAUD_ALERT' },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return alerts.map((alert) => {
        const auditRecord = alert as AuditLogRecord;
        return {
          userId: auditRecord.userId,
          type: auditRecord.details.type as FraudAlert['type'],
          severity: auditRecord.details.severity as FraudAlert['severity'],
          details: auditRecord.details.details,
          triggeredAt: new Date(auditRecord.details.triggeredAt),
        };
      });
    } catch (error) {
      logger.error('Failed to retrieve fraud alerts', { error });
      return [];
    }
  }

  /**
   * Journalise une action sensible
   */
  async logSecurityEvent(
    userId: string,
    action: string,
    details: Record<string, any>,
    ipAddress?: string
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: `SECURITY_${action}`,
          details: {
            ...details,
            timestamp: new Date(),
            ipAddress,
          },
          ipAddress,
        },
      });

      logger.info('Security event logged', {
        userId,
        action,
        ipAddress,
      });
    } catch (error) {
      logger.error('Failed to log security event', { error });
    }
  }

  /**
   * Vérifie si un utilisateur est en cooldown
   */
  async getUserCooldownStatus(userId: string): Promise<{
    inCooldown: boolean;
    reason?: string;
    endsAt?: Date;
  }> {
    try {
      // Vérifie les cooldowns actifs
      const recentFailedAttempts = await prisma.auditLog.count({
        where: {
          userId,
          action: { in: ['PAYOUT_VERIFICATION_FAILED', 'FRAUD_ALERT'] },
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Dernière heure
          },
        },
      });

      if (recentFailedAttempts >= 3) {
        const cooldownEnd = new Date(Date.now() + 60 * 60 * 1000); // 1 heure
        return {
          inCooldown: true,
          reason: 'Too many failed attempts',
          endsAt: cooldownEnd,
        };
      }

      return { inCooldown: false };
    } catch (error) {
      logger.error('Failed to check cooldown status', { error, userId });
      return { inCooldown: false };
    }
  }
}

export const securityService = new SecurityService();

