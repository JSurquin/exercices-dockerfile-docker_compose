import type { NextRequest } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { findApiClientByKey } from '@/lib/partner-api/key-service';
import { partnerError } from '@/lib/partner-api/response';
import { RateLimiter } from '@/lib/security/rate-limiter';

export interface PartnerApiContext {
  apiClientId: string;
  userId: string;
  scopes: string[];
  webhookSecret: string;
}

const partnerRateLimiters = new Map<number, RateLimiter>();

function getPartnerRateLimiter(limitPerMin: number): RateLimiter {
  let limiter = partnerRateLimiters.get(limitPerMin);
  if (!limiter) {
    limiter = new RateLimiter(`PARTNER_API_${limitPerMin}`, {
      windowMs: 60 * 1000,
      maxRequests: limitPerMin,
    });
    partnerRateLimiters.set(limitPerMin, limiter);
  }
  return limiter;
}

function extractBearerToken(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7).trim();
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function requireApiKey(
  request: NextRequest,
  options: { requiredScopes?: string[]; endpoint: string; method: string } = {
    endpoint: 'unknown',
    method: 'GET',
  }
): Promise<
  | {
      ok: true;
      ctx: PartnerApiContext;
      logApiCall: (statusCode: number, startMs: number) => Promise<void>;
      startMs: number;
    }
  | { ok: false; response: ReturnType<typeof partnerError> }
> {
  const startMs = Date.now();
  const rawKey = extractBearerToken(request);

  if (!rawKey) {
    return {
      ok: false,
      response: partnerError('UNAUTHORIZED', 'Clé API manquante ou invalide', 401),
    };
  }

  const client = await findApiClientByKey(rawKey);
  if (!client) {
    return {
      ok: false,
      response: partnerError('UNAUTHORIZED', 'Clé API invalide ou révoquée', 401),
    };
  }

  if (options.requiredScopes?.length) {
    const missing = options.requiredScopes.filter((s) => !client.scopes.includes(s));
    if (missing.length > 0) {
      return {
        ok: false,
        response: partnerError('FORBIDDEN', `Scopes requis manquants: ${missing.join(', ')}`, 403),
      };
    }
  }

  const limiter = getPartnerRateLimiter(client.rateLimitPerMin);
  const rateCheck = await limiter.checkLimit(request, client.id);
  if (!rateCheck.allowed) {
    return {
      ok: false,
      response: partnerError('RATE_LIMITED', 'Limite de requêtes atteinte', 429, {
        retry_after_seconds: Math.ceil((rateCheck.resetTime - Date.now()) / 1000),
      }),
    };
  }

  const ip = getClientIp(request);
  const ctx: PartnerApiContext = {
    apiClientId: client.id,
    userId: client.userId,
    scopes: client.scopes,
    webhookSecret: client.webhookSecret,
  };

  const logApiCall = async (statusCode: number, callStartMs: number) => {
    const durationMs = Date.now() - callStartMs;
    try {
      await Promise.all([
        prisma.partnerApiLog.create({
          data: {
            apiClientId: client.id,
            endpoint: options.endpoint,
            method: options.method,
            statusCode,
            ipAddress: ip,
            durationMs,
          },
        }),
        prisma.apiClient.update({
          where: { id: client.id },
          data: { lastUsedAt: new Date() },
        }),
      ]);
    } catch {
      /* non bloquant */
    }
  };

  return { ok: true, ctx, logApiCall, startMs };
}

export function hasScope(ctx: PartnerApiContext, scope: string): boolean {
  return ctx.scopes.includes(scope);
}
