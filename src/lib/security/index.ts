// Export principal du système de sécurité
export { AuditLogger, AuditAction, type AuditLogData } from './audit-logger';
export { 
  RateLimiter, 
  rateLimiters, 
  applyRateLimit, 
  cleanupRateLimitStore,
  RATE_LIMIT_CONFIGS 
} from './rate-limiter';
export { FraudDetector } from './fraud-detector';
export { 
  SecurityMiddleware, 
  SecurityMiddlewareFactory, 
  withSecurity, 
  extractSecurityContext 
} from './security-middleware';
export { 
  CooldownManager, 
  CooldownType 
} from './cooldown-manager';

// Types utiles
export interface SecurityEvent {
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  action: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
}

export interface SecurityMetrics {
  rateLimitHits: number;
  fraudDetections: number;
  blockedIPs: number;
  activeCooldowns: number;
  suspiciousActivities: number;
}

/**
 * Classe principale pour gérer la sécurité de l'application
 */
export class SecurityManager {
  /**
   * Initialise le système de sécurité
   */
  static async initialize(): Promise<void> {
    // TODO: Initialiser les services de sécurité
    // - Charger les IPs bloquées depuis la DB
    // - Initialiser les connexions Redis si utilisé
    // - Configurer les alertes
  }

  /**
   * Récupère les métriques de sécurité
   */
  static async getSecurityMetrics(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<SecurityMetrics> {
    const timeframeMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
    }[timeframe];

    const since = new Date(Date.now() - timeframeMs);

    // TODO: Implémenter la collecte de métriques depuis la DB
    return {
      rateLimitHits: 0,
      fraudDetections: 0,
      blockedIPs: 0,
      activeCooldowns: 0,
      suspiciousActivities: 0,
    };
  }

  /**
   * Effectue un nettoyage périodique
   */
  static async performMaintenance(): Promise<void> {
    // Nettoyer les rate limits expirés
    await cleanupRateLimitStore();

    // Nettoyer les anciens logs d'audit
    await AuditLogger.cleanupOldLogs();

    // Nettoyer les anciens cooldowns
    await CooldownManager.cleanupOldRecords();
  }
}
