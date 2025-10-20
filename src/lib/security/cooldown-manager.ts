import { prisma } from '../../../prisma/prisma';
import { AuditLogger, AuditAction } from './audit-logger';
import { logger } from '@/lib/logger';

export enum CooldownType {
  IBAN_CHANGE = 'iban_change',
  PAYMENT_METHOD_CHANGE = 'payment_method_change',
  KYC_RESUBMISSION = 'kyc_resubmission',
  PAYOUT_REQUEST = 'payout_request',
  TRADE_CREATION = 'trade_creation',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
}

interface CooldownConfig {
  duration: number; // en millisecondes
  maxAttempts?: number; // nombre max de tentatives avant cooldown étendu
  extendedDuration?: number; // durée étendue si maxAttempts dépassé
  bypassWithVerification?: boolean; // peut être contourné avec vérification
}

// Configurations des cooldowns
const COOLDOWN_CONFIGS: Record<CooldownType, CooldownConfig> = {
  [CooldownType.IBAN_CHANGE]: {
    duration: 7 * 24 * 60 * 60 * 1000, // 7 jours
    maxAttempts: 3,
    extendedDuration: 30 * 24 * 60 * 60 * 1000, // 30 jours
    bypassWithVerification: true, // Micro-virement ou OTP
  },
  [CooldownType.PAYMENT_METHOD_CHANGE]: {
    duration: 24 * 60 * 60 * 1000, // 24 heures
    maxAttempts: 5,
    extendedDuration: 7 * 24 * 60 * 60 * 1000, // 7 jours
  },
  [CooldownType.KYC_RESUBMISSION]: {
    duration: 24 * 60 * 60 * 1000, // 24 heures
    maxAttempts: 3,
    extendedDuration: 7 * 24 * 60 * 60 * 1000, // 7 jours
  },
  [CooldownType.PAYOUT_REQUEST]: {
    duration: 60 * 60 * 1000, // 1 heure
    maxAttempts: 10,
    extendedDuration: 24 * 60 * 60 * 1000, // 24 heures
  },
  [CooldownType.TRADE_CREATION]: {
    duration: 5 * 60 * 1000, // 5 minutes
    maxAttempts: 20,
    extendedDuration: 60 * 60 * 1000, // 1 heure
  },
  [CooldownType.SUSPICIOUS_ACTIVITY]: {
    duration: 60 * 60 * 1000, // 1 heure
    maxAttempts: 1,
    extendedDuration: 24 * 60 * 60 * 1000, // 24 heures
  },
};

interface CooldownStatus {
  isActive: boolean;
  remainingTime: number; // en millisecondes
  canBypass: boolean;
  reason: string;
  attemptsCount: number;
  nextAttemptAt?: Date;
}

export class CooldownManager {
  /**
   * Vérifie si un utilisateur est en cooldown pour une action
   */
  static async checkCooldown(
    userId: string,
    cooldownType: CooldownType,
    ipAddress?: string
  ): Promise<CooldownStatus> {
    const config = COOLDOWN_CONFIGS[cooldownType];
    const now = new Date();

    // Récupérer les tentatives récentes
    const recentAttempts = await this.getRecentAttempts(userId, cooldownType, config.duration);
    
    if (recentAttempts.length === 0) {
      return {
        isActive: false,
        remainingTime: 0,
        canBypass: false,
        reason: 'No recent attempts',
        attemptsCount: 0,
      };
    }

    const lastAttempt = recentAttempts[0];
    const timeSinceLastAttempt = now.getTime() - lastAttempt.createdAt.getTime();
    
    // Déterminer la durée du cooldown
    let cooldownDuration = config.duration;
    if (config.maxAttempts && recentAttempts.length >= config.maxAttempts && config.extendedDuration) {
      cooldownDuration = config.extendedDuration;
    }

    const remainingTime = cooldownDuration - timeSinceLastAttempt;

    if (remainingTime > 0) {
      // Cooldown actif
      const canBypass = config.bypassWithVerification || false;
      
      await AuditLogger.log({
        userId,
        ipAddress,
        action: AuditAction.SUSPICIOUS_ACTIVITY,
        details: {
          type: 'cooldown_check',
          cooldownType,
          remainingTime,
          attemptsCount: recentAttempts.length,
          canBypass,
        },
        severity: 'medium',
      });

      return {
        isActive: true,
        remainingTime,
        canBypass,
        reason: `Cooldown active for ${cooldownType}`,
        attemptsCount: recentAttempts.length,
        nextAttemptAt: new Date(now.getTime() + remainingTime),
      };
    }

    return {
      isActive: false,
      remainingTime: 0,
      canBypass: false,
      reason: 'Cooldown expired',
      attemptsCount: recentAttempts.length,
    };
  }

  /**
   * Enregistre une tentative d'action
   */
  static async recordAttempt(
    userId: string,
    cooldownType: CooldownType,
    success: boolean,
    ipAddress?: string,
    details?: Record<string, any>
  ): Promise<void> {
    const auditAction = this.getAuditActionForCooldown(cooldownType);
    
    await AuditLogger.log({
      userId,
      ipAddress,
      action: auditAction,
      details: {
        cooldownType,
        success,
        timestamp: new Date().toISOString(),
        ...details,
      },
      severity: success ? 'low' : 'medium',
    });

    // Si l'action a échoué, vérifier si on doit activer un cooldown
    if (!success) {
      const config = COOLDOWN_CONFIGS[cooldownType];
      const recentAttempts = await this.getRecentAttempts(userId, cooldownType, config.duration);
      
      if (config.maxAttempts && recentAttempts.length >= config.maxAttempts) {
        await this.activateExtendedCooldown(userId, cooldownType, ipAddress);
      }
    }
  }

  /**
   * Active un cooldown étendu pour activité suspecte
   */
  static async activateExtendedCooldown(
    userId: string,
    cooldownType: CooldownType,
    ipAddress?: string,
    reason?: string
  ): Promise<void> {
    await AuditLogger.log({
      userId,
      ipAddress,
      action: AuditAction.ACCOUNT_LOCKED,
      details: {
        type: 'extended_cooldown',
        cooldownType,
        reason: reason || 'Too many failed attempts',
        duration: COOLDOWN_CONFIGS[cooldownType].extendedDuration,
        timestamp: new Date().toISOString(),
      },
      severity: 'high',
    });

    logger.warn('Extended cooldown activated', {
      userId,
      cooldownType,
      reason,
      ipAddress,
    });
  }

  /**
   * Contourne un cooldown avec vérification
   */
  static async bypassCooldown(
    userId: string,
    cooldownType: CooldownType,
    verificationMethod: 'otp' | 'micro_transfer' | 'admin_override',
    verificationData: Record<string, any>,
    ipAddress?: string
  ): Promise<boolean> {
    const config = COOLDOWN_CONFIGS[cooldownType];
    
    if (!config.bypassWithVerification) {
      return false;
    }

    // Vérifier que la méthode de vérification est valide
    const isValid = await this.validateBypassVerification(
      userId,
      verificationMethod,
      verificationData
    );

    if (isValid) {
      await AuditLogger.log({
        userId,
        ipAddress,
        action: AuditAction.ADMIN_ACTION, // Ou créer une nouvelle action
        details: {
          type: 'cooldown_bypass',
          cooldownType,
          verificationMethod,
          timestamp: new Date().toISOString(),
        },
        severity: 'medium',
      });

      logger.info('Cooldown bypassed with verification', {
        userId,
        cooldownType,
        verificationMethod,
      });

      return true;
    }

    return false;
  }

  /**
   * Récupère les tentatives récentes pour un type de cooldown
   */
  private static async getRecentAttempts(
    userId: string,
    cooldownType: CooldownType,
    duration: number
  ): Promise<any[]> {
    const since = new Date(Date.now() - duration);
    const auditAction = this.getAuditActionForCooldown(cooldownType);

    return await prisma.auditLog.findMany({
      where: {
        userId,
        action: auditAction,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mappe les types de cooldown aux actions d'audit
   */
  private static getAuditActionForCooldown(cooldownType: CooldownType): AuditAction {
    const mapping: Record<CooldownType, AuditAction> = {
      [CooldownType.IBAN_CHANGE]: AuditAction.IBAN_CHANGED,
      [CooldownType.PAYMENT_METHOD_CHANGE]: AuditAction.PAYMENT_METHOD_UPDATED,
      [CooldownType.KYC_RESUBMISSION]: AuditAction.KYC_DOCUMENT_UPLOADED,
      [CooldownType.PAYOUT_REQUEST]: AuditAction.PAYOUT_REQUESTED,
      [CooldownType.TRADE_CREATION]: AuditAction.TRADE_CREATED,
      [CooldownType.SUSPICIOUS_ACTIVITY]: AuditAction.SUSPICIOUS_ACTIVITY,
    };

    return mapping[cooldownType];
  }

  /**
   * Valide une méthode de contournement de cooldown
   */
  private static async validateBypassVerification(
    userId: string,
    method: 'otp' | 'micro_transfer' | 'admin_override',
    data: Record<string, any>
  ): Promise<boolean> {
    switch (method) {
      case 'otp':
        // TODO: Valider le code OTP
        return this.validateOTP(userId, data.code);
      
      case 'micro_transfer':
        // TODO: Valider le micro-virement
        return this.validateMicroTransfer(userId, data.code, data.amount);
      
      case 'admin_override':
        // TODO: Valider l'override admin
        return this.validateAdminOverride(data.adminUserId, data.reason);
      
      default:
        return false;
    }
  }

  /**
   * Valide un code OTP
   */
  private static async validateOTP(userId: string, code: string): Promise<boolean> {
    // TODO: Implémenter la validation OTP
    // Vérifier contre la base de données ou un service externe
    return false;
  }

  /**
   * Valide un micro-virement
   */
  private static async validateMicroTransfer(
    userId: string,
    code: string,
    amount: number
  ): Promise<boolean> {
    // TODO: Implémenter la validation du micro-virement
    // Vérifier que le code et le montant correspondent
    return false;
  }

  /**
   * Valide un override administrateur
   */
  private static async validateAdminOverride(
    adminUserId: string,
    reason: string
  ): Promise<boolean> {
    // TODO: Vérifier que l'admin a les permissions
    const admin = await prisma.user.findUnique({
      where: { id: adminUserId },
    });

    return admin?.role === 'ADMIN';
  }

  /**
   * Nettoie les anciens enregistrements de cooldown
   */
  static async cleanupOldRecords(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    
    // Les logs d'audit sont nettoyés par AuditLogger.cleanupOldLogs()
    // Ici on pourrait nettoyer d'autres structures si nécessaire
    
    logger.info('Cooldown cleanup completed');
    return 0;
  }

  /**
   * Récupère les statistiques de cooldown pour un utilisateur
   */
  static async getCooldownStats(userId: string): Promise<{
    activeCooldowns: Array<{
      type: CooldownType;
      remainingTime: number;
      canBypass: boolean;
    }>;
    recentAttempts: Record<CooldownType, number>;
  }> {
    const activeCooldowns = [];
    const recentAttempts: Record<CooldownType, number> = {} as any;

    for (const cooldownType of Object.values(CooldownType)) {
      const status = await this.checkCooldown(userId, cooldownType);
      
      if (status.isActive) {
        activeCooldowns.push({
          type: cooldownType,
          remainingTime: status.remainingTime,
          canBypass: status.canBypass,
        });
      }

      recentAttempts[cooldownType] = status.attemptsCount;
    }

    return {
      activeCooldowns,
      recentAttempts,
    };
  }
}
