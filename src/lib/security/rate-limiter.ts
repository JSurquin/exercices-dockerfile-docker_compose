import { NextRequest } from 'next/server';
import { AuditLogger, AuditAction } from './audit-logger';
import { logger } from '@/lib/logger';

/**
 * ⚠️ LIMITATION: Rate limiting en mémoire (non distribué)
 * 
 * PROBLÈME:
 *   - Le Map en mémoire est local à chaque instance serverless/container
 *   - En environnement multi-instance (Vercel, AWS Lambda, K8s), chaque instance
 *     a son propre compteur → les limites peuvent être contournées par parallélisme
 *   - Pas de persistance entre les redémarrages
 * 
 * MIGRATION VERS REDIS:
 *   1. Installer Upstash Redis: npm install @upstash/redis
 *   2. Configurer UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN dans .env
 *   3. Utiliser redis-rate-limiter.ts qui contient l'implémentation Redis
 *   4. Remplacer les appels à RateLimiter par RedisRateLimiter dans les routes
 * 
 * SOLUTION TEMPORAIRE:
 *   - Ce rate limiter est mieux que rien pour le développement
 *   - En production avec multi-instance, considérer l'activation de Redis
 *   - Voir src/lib/redis-rate-limiter.ts pour l'implémentation distribuée
 */

interface RateLimitConfig {
  windowMs: number; // Fenêtre de temps en millisecondes
  maxRequests: number; // Nombre maximum de requêtes
  keyGenerator?: (req: NextRequest) => string; // Générateur de clé personnalisé
  skipSuccessfulRequests?: boolean; // Ignorer les requêtes réussies
  skipFailedRequests?: boolean; // Ignorer les requêtes échouées
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

// Stockage en mémoire (en production, utiliser Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configurations prédéfinies
export const RATE_LIMIT_CONFIGS = {
  // Authentification
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 tentatives de connexion
  },
  
  // API générale
  API_GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requêtes par minute
  },
  
  // Actions sensibles (paiements, KYC)
  SENSITIVE_ACTIONS: {
    windowMs: 60 * 60 * 1000, // 1 heure
    maxRequests: 10, // 10 actions sensibles par heure
  },
  
  // Changement d'IBAN
  IBAN_CHANGE: {
    windowMs: 24 * 60 * 60 * 1000, // 24 heures
    maxRequests: 3, // 3 changements d'IBAN par jour
  },
  
  // Demandes de paiement
  PAYOUT_REQUEST: {
    windowMs: 60 * 60 * 1000, // 1 heure
    maxRequests: 5, // 5 demandes de paiement par heure
  },
  
  // Upload de documents KYC
  KYC_UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 heure
    maxRequests: 20, // 20 uploads par heure
  },
  
  // Création de trades
  TRADE_CREATION: {
    windowMs: 60 * 60 * 1000, // 1 heure
    maxRequests: 20, // 20 trades par heure
  },

  // Inscription newsletter (public, anti-spam / anti-énumération lourde)
  NEWSLETTER_SUBSCRIBE: {
    windowMs: 60 * 60 * 1000, // 1 heure
    maxRequests: 10,
  },

  // Renvoi email de bienvenue
  NEWSLETTER_RESEND_WELCOME: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 5,
  },

  // Désabonnement (POST/GET, anti-bruteforce token)
  NEWSLETTER_UNSUBSCRIBE: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 40,
  },
} as const;

export class RateLimiter {
  private config: RateLimitConfig;
  private name: string;

  constructor(name: string, config: RateLimitConfig) {
    this.name = name;
    this.config = config;
  }

  /**
   * Vérifie si la requête est autorisée
   */
  async checkLimit(req: NextRequest, userId?: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    blocked: boolean;
  }> {
    const key = this.generateKey(req, userId);
    const now = Date.now();
    
    // Nettoyer les entrées expirées
    this.cleanupExpiredEntries(now);
    
    let entry = rateLimitStore.get(key);
    
    // Créer une nouvelle entrée si elle n'existe pas
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
        blocked: false,
      };
    }
    
    // Incrémenter le compteur
    entry.count++;
    
    // Vérifier si la limite est dépassée
    const allowed = entry.count <= this.config.maxRequests && !entry.blocked;
    
    if (!allowed && !entry.blocked) {
      // Première fois que la limite est dépassée
      entry.blocked = true;
      
      // Logger le dépassement
      await AuditLogger.logRateLimitExceeded(
        userId,
        this.getClientIP(req),
        this.name,
        entry.count
      );
      
      logger.warn('Rate limit exceeded', {
        rateLimiter: this.name,
        key,
        count: entry.count,
        maxRequests: this.config.maxRequests,
        userId,
        ip: this.getClientIP(req),
      });
    }
    
    // Sauvegarder l'entrée
    rateLimitStore.set(key, entry);
    
    return {
      allowed,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime,
      blocked: entry.blocked,
    };
  }

  /**
   * Bloque manuellement une clé
   */
  async blockKey(req: NextRequest, userId?: string, reason?: string): Promise<void> {
    const key = this.generateKey(req, userId);
    const entry = rateLimitStore.get(key) || {
      count: this.config.maxRequests + 1,
      resetTime: Date.now() + this.config.windowMs,
      blocked: true,
    };
    
    entry.blocked = true;
    rateLimitStore.set(key, entry);
    
    await AuditLogger.log({
      userId,
      ipAddress: this.getClientIP(req),
      action: AuditAction.IP_BLOCKED,
      details: {
        rateLimiter: this.name,
        reason: reason || 'Manual block',
        key,
      },
      severity: 'high',
    });
  }

  /**
   * Débloque une clé
   */
  unblockKey(req: NextRequest, userId?: string): void {
    const key = this.generateKey(req, userId);
    rateLimitStore.delete(key);
  }

  /**
   * Génère la clé de rate limiting
   */
  private generateKey(req: NextRequest, userId?: string): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
    }
    
    const ip = this.getClientIP(req);
    const baseKey = `${this.name}:${ip}`;
    
    // Inclure l'ID utilisateur si disponible pour un rate limiting plus précis
    return userId ? `${baseKey}:${userId}` : baseKey;
  }

  /**
   * Récupère l'IP du client
   */
  private getClientIP(req: NextRequest): string {
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
   * Nettoie les entrées expirées
   */
  private cleanupExpiredEntries(now: number): void {
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
}

// Instances prédéfinies
export const rateLimiters = {
  login: new RateLimiter('login', RATE_LIMIT_CONFIGS.LOGIN),
  apiGeneral: new RateLimiter('api_general', RATE_LIMIT_CONFIGS.API_GENERAL),
  sensitiveActions: new RateLimiter('sensitive_actions', RATE_LIMIT_CONFIGS.SENSITIVE_ACTIONS),
  ibanChange: new RateLimiter('iban_change', RATE_LIMIT_CONFIGS.IBAN_CHANGE),
  payoutRequest: new RateLimiter('payout_request', RATE_LIMIT_CONFIGS.PAYOUT_REQUEST),
  kycUpload: new RateLimiter('kyc_upload', RATE_LIMIT_CONFIGS.KYC_UPLOAD),
  tradeCreation: new RateLimiter('trade_creation', RATE_LIMIT_CONFIGS.TRADE_CREATION),
  newsletterSubscribe: new RateLimiter('newsletter_subscribe', RATE_LIMIT_CONFIGS.NEWSLETTER_SUBSCRIBE),
  newsletterResendWelcome: new RateLimiter('newsletter_resend_welcome', RATE_LIMIT_CONFIGS.NEWSLETTER_RESEND_WELCOME),
  newsletterUnsubscribe: new RateLimiter('newsletter_unsubscribe', RATE_LIMIT_CONFIGS.NEWSLETTER_UNSUBSCRIBE),
};

/**
 * Middleware helper pour appliquer le rate limiting
 */
export async function applyRateLimit(
  req: NextRequest,
  limiterName: keyof typeof rateLimiters,
  userId?: string
): Promise<Response | null> {
  const limiter = rateLimiters[limiterName];
  const result = await limiter.checkLimit(req, userId);
  
  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        resetTime: result.resetTime,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limiter['config'].maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
        },
      }
    );
  }
  
  return null; // Pas de rate limit dépassé
}

/**
 * Nettoie périodiquement le store (à appeler via un cron job)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    logger.info(`Cleaned up ${cleaned} expired rate limit entries`);
  }
}
