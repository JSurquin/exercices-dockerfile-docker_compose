import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import { createHash } from 'crypto';
export enum AuditAction {
  // Authentification
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_LOGIN_FAILED = 'user.login_failed',
  
  // KYC
  KYC_DOCUMENT_UPLOADED = 'kyc.document_uploaded',
  KYC_STATUS_CHANGED = 'kyc.status_changed',
  KYC_DOCUMENT_REJECTED = 'kyc.document_rejected',
  
  // Paiements
  PAYMENT_METHOD_ADDED = 'payment.method_added',
  PAYMENT_METHOD_UPDATED = 'payment.method_updated',
  PAYMENT_METHOD_DELETED = 'payment.method_deleted',
  IBAN_CHANGED = 'payment.iban_changed',
  PAYOUT_REQUESTED = 'payout.requested',
  PAYOUT_PROCESSED = 'payout.processed',
  PAYOUT_FAILED = 'payout.failed',
  
  // Trades
  TRADE_CREATED = 'trade.created',
  TRADE_ACCEPTED = 'trade.accepted',
  TRADE_CANCELLED = 'trade.cancelled',
  TRADE_COMPLETED = 'trade.completed',
  
  // Sécurité
  SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'security.rate_limit_exceeded',
  IP_BLOCKED = 'security.ip_blocked',
  ACCOUNT_LOCKED = 'security.account_locked',
  
  // Admin
  ADMIN_LOGIN = 'admin.login',
  ADMIN_ACTION = 'admin.action',
  USER_IMPERSONATION = 'admin.user_impersonation',
  USER_CREATED_BY_ADMIN = 'user.created_by_admin',
  AFFILIATE_CREATED_BY_ADMIN = 'affiliate.created_by_admin',
  
  // Affiliation
  AFFILIATE_APPLIED = 'affiliate.applied',
  AFFILIATE_APPROVED = 'affiliate.approved',
  COMMISSION_PAID = 'affiliate.commission_paid',
}

export interface AuditLogData {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  action: AuditAction;
  details: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export class AuditLogger {
  /**
   * Enregistre une action dans les logs d'audit
   */
  static async log(data: AuditLogData): Promise<void> {
    try {
      // Enregistrer en base de données
      await prisma.auditLog.create({
        data: {
          userId: data.userId || 'system',
          action: data.action,
          details: {
            ...data.details,
            severity: data.severity || 'low',
            timestamp: new Date().toISOString(),
            metadata: data.metadata,
          },
          ipAddress: data.ipAddress,
        },
      });

      // Log également dans les fichiers pour monitoring
      const logLevel = this.getSeverityLogLevel(data.severity);
      logger[logLevel]('Audit Log', {
        action: data.action,
        userId: data.userId,
        ipAddress: data.ipAddress,
        details: data.details,
      });

      // Alertes pour les actions critiques
      if (data.severity === 'critical') {
        await this.sendCriticalAlert(data);
      }
    } catch (error) {
      logger.error('Failed to log audit entry', { error, data });
    }
  }

  /**
   * Enregistre une connexion utilisateur
   */
  static async logUserLogin(userId: string, ipAddress: string, userAgent?: string, success: boolean = true): Promise<void> {
    await this.log({
      userId,
      ipAddress,
      userAgent,
      action: success ? AuditAction.USER_LOGIN : AuditAction.USER_LOGIN_FAILED,
      details: {
        success,
        timestamp: new Date().toISOString(),
      },
      severity: success ? 'low' : 'medium',
    });
  }

  /**
   * Enregistre un changement d'IBAN
   */
  static async logIbanChange(userId: string, oldIban: string, newIban: string, ipAddress: string): Promise<void> {
    await this.log({
      userId,
      ipAddress,
      action: AuditAction.IBAN_CHANGED,
      details: {
        oldIbanHash: this.hashSensitiveData(oldIban),
        newIbanHash: this.hashSensitiveData(newIban),
        timestamp: new Date().toISOString(),
      },
      severity: 'high',
    });
  }

  /**
   * Enregistre une activité suspecte
   */
  static async logSuspiciousActivity(
    userId: string | undefined,
    ipAddress: string,
    reason: string,
    details: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      ipAddress,
      action: AuditAction.SUSPICIOUS_ACTIVITY,
      details: {
        reason,
        ...details,
        timestamp: new Date().toISOString(),
      },
      severity: 'critical',
    });
  }

  /**
   * Enregistre un dépassement de rate limit
   */
  static async logRateLimitExceeded(
    userId: string | undefined,
    ipAddress: string,
    endpoint: string,
    attempts: number
  ): Promise<void> {
    await this.log({
      userId,
      ipAddress,
      action: AuditAction.RATE_LIMIT_EXCEEDED,
      details: {
        endpoint,
        attempts,
        timestamp: new Date().toISOString(),
      },
      severity: 'medium',
    });
  }

  /**
   * Enregistre une action de paiement
   */
  static async logPayoutAction(
    userId: string,
    action: 'requested' | 'processed' | 'failed',
    payoutId: string,
    amountCents: number,
    ipAddress: string,
    details?: Record<string, any>
  ): Promise<void> {
    const auditAction = {
      requested: AuditAction.PAYOUT_REQUESTED,
      processed: AuditAction.PAYOUT_PROCESSED,
      failed: AuditAction.PAYOUT_FAILED,
    }[action];

    await this.log({
      userId,
      ipAddress,
      action: auditAction,
      details: {
        payoutId,
        amountCents,
        ...details,
        timestamp: new Date().toISOString(),
      },
      severity: action === 'failed' ? 'high' : 'medium',
    });
  }

  /**
   * Enregistre une action admin
   */
  static async logAdminAction(
    adminUserId: string,
    action: string,
    targetUserId?: string,
    details?: Record<string, any>,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId: adminUserId,
      ipAddress,
      action: AuditAction.ADMIN_ACTION,
      details: {
        adminAction: action,
        targetUserId,
        ...details,
        timestamp: new Date().toISOString(),
      },
      severity: 'high',
    });
  }

  /**
   * Récupère les logs d'audit pour un utilisateur
   */
  static async getUserAuditLogs(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    return await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Récupère les logs d'audit par action
   */
  static async getAuditLogsByAction(
    action: AuditAction,
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    return await prisma.auditLog.findMany({
      where: { action },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Récupère les activités suspectes récentes
   */
  static async getSuspiciousActivities(hours: number = 24): Promise<any[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return await prisma.auditLog.findMany({
      where: {
        action: AuditAction.SUSPICIOUS_ACTIVITY,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Nettoie les anciens logs (RGPD compliance)
   */
  static async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    
    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        // Garder les logs critiques plus longtemps
        details: {
          path: ['severity'],
          not: 'critical',
        },
      },
    });

    logger.info(`Cleaned up ${result.count} old audit logs`);
    return result.count;
  }

  /**
   * Hash des données sensibles pour les logs
   */
  private static hashSensitiveData(data: string): string {
    return createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Convertit la sévérité en niveau de log
   */
  private static getSeverityLogLevel(severity?: string): 'info' | 'warn' | 'error' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      default:
        return 'info';
    }
  }

  /**
   * Envoie une alerte pour les actions critiques
   */
  private static async sendCriticalAlert(data: AuditLogData): Promise<void> {
    // TODO: Implémenter l'envoi d'alertes (email, Slack, etc.)
    logger.error('CRITICAL SECURITY ALERT', {
      action: data.action,
      userId: data.userId,
      ipAddress: data.ipAddress,
      details: data.details,
    });
  }
}
