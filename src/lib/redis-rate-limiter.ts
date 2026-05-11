import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logger';

/**
 * Configuration Redis/Upstash pour le rate limiting distribué.
 * 
 * INSTALLATION:
 * ```bash
 * npm install @upstash/redis
 * ```
 * 
 * CONFIGURATION (.env):
 * ```
 * UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
 * UPSTASH_REDIS_REST_TOKEN=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxXxxxxxxxxxxxxx
 * ```
 * 
 * Pour obtenir les credentials:
 * 1. Créer un compte sur https://upstash.com/
 * 2. Créer une database Redis (région la plus proche)
 * 3. Copier REST URL et REST TOKEN depuis le dashboard
 */

let redisClient: Redis | null = null;

/**
 * Initialise le client Redis/Upstash.
 * Retourne null si les credentials ne sont pas configurés.
 */
export function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    logger.warn('[Redis] Upstash credentials not configured, using in-memory fallback');
    return null;
  }

  try {
    redisClient = new Redis({
      url,
      token,
    });
    logger.debug('[Redis] Connected to Upstash');
    return redisClient;
  } catch (error) {
    logger.error('[Redis] Failed to connect to Upstash', error);
    return null;
  }
}

/**
 * Vérifie et incrémente un compteur avec expiration (sliding window).
 * 
 * @param key - Clé unique (ex: 'rate_limit:api_call:userId')
 * @param limit - Nombre max de requêtes autorisées
 * @param windowSeconds - Durée de la fenêtre en secondes
 * @returns { allowed: boolean, current: number, remaining: number, resetAt: Date }
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{
  allowed: boolean;
  current: number;
  remaining: number;
  resetAt: Date;
}> {
  const redis = getRedisClient();

  if (!redis) {
    // Fallback: toujours autoriser si Redis n'est pas configuré
    // (le rate limiter en mémoire sera utilisé à la place)
    return {
      allowed: true,
      current: 0,
      remaining: limit,
      resetAt: new Date(Date.now() + windowSeconds * 1000),
    };
  }

  try {
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    // Utiliser une transaction pour atomicité
    const pipeline = redis.pipeline();
    
    // Supprimer les entrées expirées
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Compter les entrées dans la fenêtre
    pipeline.zcard(key);
    
    // Ajouter la nouvelle requête
    pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    
    // Définir l'expiration de la clé
    pipeline.expire(key, windowSeconds);

    const results = await pipeline.exec();
    
    // results[1] contient le count avant l'ajout
    const current = (results[1] as number) || 0;
    const allowed = current < limit;
    const remaining = Math.max(0, limit - current - 1);
    const resetAt = new Date(now + windowSeconds * 1000);

    return {
      allowed,
      current: current + 1,
      remaining,
      resetAt,
    };
  } catch (error) {
    logger.error('[Redis] Rate limit check failed', error);
    // En cas d'erreur Redis, autoriser par sécurité (éviter de bloquer l'app)
    return {
      allowed: true,
      current: 0,
      remaining: limit,
      resetAt: new Date(Date.now() + windowSeconds * 1000),
    };
  }
}

/**
 * Nettoie une clé de rate limiting (utilisé pour reset manuel).
 */
export async function clearRateLimit(key: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (error) {
    logger.error('[Redis] Failed to clear rate limit', error);
  }
}

/**
 * Récupère le statut actuel d'une clé de rate limiting sans l'incrémenter.
 */
export async function getRateLimitStatus(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{
  current: number;
  remaining: number;
  resetAt: Date;
}> {
  const redis = getRedisClient();

  if (!redis) {
    return {
      current: 0,
      remaining: limit,
      resetAt: new Date(Date.now() + windowSeconds * 1000),
    };
  }

  try {
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    // Nettoyer les entrées expirées
    await redis.zremrangebyscore(key, 0, windowStart);
    
    // Compter les entrées
    const current = await redis.zcard(key);
    const remaining = Math.max(0, limit - current);
    const resetAt = new Date(now + windowSeconds * 1000);

    return {
      current,
      remaining,
      resetAt,
    };
  } catch (error) {
    logger.error('[Redis] Failed to get rate limit status', error);
    return {
      current: 0,
      remaining: limit,
      resetAt: new Date(Date.now() + windowSeconds * 1000),
    };
  }
}
