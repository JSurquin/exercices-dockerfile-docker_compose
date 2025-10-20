import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter, applyRateLimit } from './rate-limiter';
import { FraudDetector } from './fraud-detector';
import { AuditLogger, AuditAction } from './audit-logger';
import { logger } from '@/lib/logger';

interface SecurityConfig {
  enableRateLimit?: boolean;
  enableFraudDetection?: boolean;
  enableAuditLogging?: boolean;
  rateLimiter?: keyof typeof import('./rate-limiter').rateLimiters;
  skipPaths?: string[];
  requireAuth?: boolean;
}

interface SecurityContext {
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  path: string;
  method: string;
}

/**
 * Middleware de sécurité principal
 */
export class SecurityMiddleware {
  private config: SecurityConfig;

  constructor(config: SecurityConfig = {}) {
    this.config = {
      enableRateLimit: true,
      enableFraudDetection: true,
      enableAuditLogging: true,
      skipPaths: ['/api/health', '/api/status'],
      ...config,
    };
  }

  /**
   * Applique les contrôles de sécurité
   */
  async apply(req: NextRequest, context: SecurityContext): Promise<NextResponse | null> {
    // Vérifier si le chemin doit être ignoré
    if (this.shouldSkipPath(context.path)) {
      return null;
    }

    try {
      // 1. Rate Limiting
      if (this.config.enableRateLimit && this.config.rateLimiter) {
        const rateLimitResponse = await applyRateLimit(
          req,
          this.config.rateLimiter,
          context.userId
        );
        
        if (rateLimitResponse) {
          return NextResponse.json(rateLimitResponse.body, {
            status: rateLimitResponse.status,
            headers: rateLimitResponse.headers,
          });
        }
      }

      // 2. Détection de fraude
      if (this.config.enableFraudDetection && context.userId) {
        const fraudResult = await FraudDetector.analyzeActivity({
          userId: context.userId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          action: `${context.method} ${context.path}`,
          timestamp: new Date(),
          metadata: {
            path: context.path,
            method: context.method,
          },
        });

        // Bloquer si l'activité est très suspecte
        if (fraudResult.recommendedAction === 'block') {
          await AuditLogger.log({
            userId: context.userId,
            ipAddress: context.ipAddress,
            action: AuditAction.ACCOUNT_LOCKED,
            details: {
              reason: 'Fraud detection - automatic block',
              riskScore: fraudResult.riskScore,
              reasons: fraudResult.reasons,
              path: context.path,
            },
            severity: 'critical',
          });

          return new NextResponse(
            JSON.stringify({
              error: 'Access denied',
              message: 'Suspicious activity detected. Please contact support.',
              code: 'FRAUD_DETECTED',
            }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        // Ajouter des headers d'information pour la review manuelle
        if (fraudResult.recommendedAction === 'review') {
          // TODO: Marquer pour review manuelle
          logger.warn('User flagged for manual review', {
            userId: context.userId,
            riskScore: fraudResult.riskScore,
            reasons: fraudResult.reasons,
          });
        }
      }

      // 3. Audit Logging
      if (this.config.enableAuditLogging) {
        // Logger les actions sensibles
        if (this.isSensitivePath(context.path)) {
          await AuditLogger.log({
            userId: context.userId,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            action: `api.${context.method.toLowerCase()}.${this.getActionFromPath(context.path)}` as AuditAction,
            details: {
              path: context.path,
              method: context.method,
              timestamp: new Date().toISOString(),
            },
            severity: 'medium',
          });
        }
      }

      return null; // Pas de blocage
    } catch (error) {
      logger.error('Security middleware error', { error, context });
      // En cas d'erreur, on laisse passer pour ne pas casser l'app
      return null;
    }
  }

  /**
   * Vérifie si le chemin doit être ignoré
   */
  private shouldSkipPath(path: string): boolean {
    return this.config.skipPaths?.some(skipPath => path.startsWith(skipPath)) || false;
  }

  /**
   * Vérifie si le chemin est sensible
   */
  private isSensitivePath(path: string): boolean {
    const sensitivePaths = [
      '/api/user/update',
      '/api/auth/',
      '/api/kyc/',
      '/api/payout/',
      '/api/payment/',
      '/api/trade/',
      '/api/admin/',
    ];

    return sensitivePaths.some(sensitivePath => path.startsWith(sensitivePath));
  }

  /**
   * Extrait l'action du chemin
   */
  private getActionFromPath(path: string): string {
    const segments = path.split('/').filter(Boolean);
    return segments.slice(1).join('_'); // Ignore 'api'
  }
}

/**
 * Factory pour créer des middlewares de sécurité spécialisés
 */
export class SecurityMiddlewareFactory {
  /**
   * Middleware pour les endpoints d'authentification
   */
  static createAuthMiddleware(): SecurityMiddleware {
    return new SecurityMiddleware({
      enableRateLimit: true,
      enableFraudDetection: true,
      enableAuditLogging: true,
      rateLimiter: 'login',
    });
  }

  /**
   * Middleware pour les actions sensibles (paiements, KYC)
   */
  static createSensitiveActionMiddleware(): SecurityMiddleware {
    return new SecurityMiddleware({
      enableRateLimit: true,
      enableFraudDetection: true,
      enableAuditLogging: true,
      rateLimiter: 'sensitiveActions',
      requireAuth: true,
    });
  }

  /**
   * Middleware pour les APIs générales
   */
  static createGeneralAPIMiddleware(): SecurityMiddleware {
    return new SecurityMiddleware({
      enableRateLimit: true,
      enableFraudDetection: false, // Pas nécessaire pour les APIs générales
      enableAuditLogging: false,
      rateLimiter: 'apiGeneral',
    });
  }

  /**
   * Middleware pour les changements d'IBAN
   */
  static createIBANChangeMiddleware(): SecurityMiddleware {
    return new SecurityMiddleware({
      enableRateLimit: true,
      enableFraudDetection: true,
      enableAuditLogging: true,
      rateLimiter: 'ibanChange',
      requireAuth: true,
    });
  }

  /**
   * Middleware pour les demandes de paiement
   */
  static createPayoutMiddleware(): SecurityMiddleware {
    return new SecurityMiddleware({
      enableRateLimit: true,
      enableFraudDetection: true,
      enableAuditLogging: true,
      rateLimiter: 'payoutRequest',
      requireAuth: true,
    });
  }

  /**
   * Middleware pour les uploads KYC
   */
  static createKYCMiddleware(): SecurityMiddleware {
    return new SecurityMiddleware({
      enableRateLimit: true,
      enableFraudDetection: true,
      enableAuditLogging: true,
      rateLimiter: 'kycUpload',
      requireAuth: true,
    });
  }

  /**
   * Middleware pour la création de trades
   */
  static createTradeMiddleware(): SecurityMiddleware {
    return new SecurityMiddleware({
      enableRateLimit: true,
      enableFraudDetection: true,
      enableAuditLogging: true,
      rateLimiter: 'tradeCreation',
      requireAuth: true,
    });
  }
}

/**
 * Helper pour extraire le contexte de sécurité d'une requête
 */
export function extractSecurityContext(req: NextRequest, userId?: string): SecurityContext {
  const url = new URL(req.url);
  
  return {
    userId,
    ipAddress: getClientIP(req),
    userAgent: req.headers.get('user-agent') || undefined,
    path: url.pathname,
    method: req.method,
  };
}

/**
 * Helper pour récupérer l'IP du client
 */
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
}

/**
 * Decorator pour appliquer automatiquement la sécurité aux routes API
 */
export function withSecurity(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  middlewareType: 'auth' | 'sensitive' | 'general' | 'iban' | 'payout' | 'kyc' | 'trade' = 'general'
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const middlewareMap = {
      auth: SecurityMiddlewareFactory.createAuthMiddleware(),
      sensitive: SecurityMiddlewareFactory.createSensitiveActionMiddleware(),
      general: SecurityMiddlewareFactory.createGeneralAPIMiddleware(),
      iban: SecurityMiddlewareFactory.createIBANChangeMiddleware(),
      payout: SecurityMiddlewareFactory.createPayoutMiddleware(),
      kyc: SecurityMiddlewareFactory.createKYCMiddleware(),
      trade: SecurityMiddlewareFactory.createTradeMiddleware(),
    };

    const middleware = middlewareMap[middlewareType];
    const securityContext = extractSecurityContext(req, context?.userId);
    
    const securityResponse = await middleware.apply(req, securityContext);
    if (securityResponse) {
      return securityResponse;
    }

    return handler(req, context);
  };
}
