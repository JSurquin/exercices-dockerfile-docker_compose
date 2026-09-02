import type { NextRequest } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { findApiClientByKey } from '@/lib/partner-api/key-service';
import { partnerError } from '@/lib/partner-api/response';
import { RateLimiter } from '@/lib/security/rate-limiter';
import { isUserBanned } from '@/lib/user-ban-logic';

export interface PartnerApiContext {
  apiClientId: string;
  userId: string;
  scopes: string[];
  webhookSecret: string;
}

const partnerRateLimiters = new Map<number, RateLimiter>();
const invalidAuthLimiter = new RateLimiter('PARTNER_API_INVALID_AUTH', {
  windowMs: 60 * 1000,
  maxRequests: 30,
});

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

type PartnerAuthSuccess = {
  ok: true;
  ctx: PartnerApiContext;
  logApiCall: (statusCode: number, startMs: number) => Promise<void>;
  startMs: number;
};

type PartnerAuthFailure = {
  ok: false;
  response: ReturnType<typeof partnerError>;
  logApiCall?: (statusCode: number, startMs: number) => Promise<void>;
  startMs?: number;
};

async function rejectUnauthorized(
  request: NextRequest,
  message: string
): Promise<PartnerAuthFailure> {
  const rate = await invalidAuthLimiter.checkLimit(request);
  if (!rate.allowed) {
    return {
      ok: false,
      response: partnerError('RATE_LIMITED', 'Rate limit exceeded', 429, {
        retry_after_seconds: Math.ceil((rate.resetTime - Date.now()) / 1000),
      }),
    };
  }
  return {
    ok: false,
    response: partnerError('UNAUTHORIZED', message, 401),
  };
}

export async function requireApiKey(
  request: NextRequest,
  options: {
    requiredScopes?: string[];
    requiredAnyScopes?: string[];
    endpoint: string;
    method: string;
  } = {
    endpoint: 'unknown',
    method: 'GET',
  }
): Promise<PartnerAuthSuccess | PartnerAuthFailure> {
  const startMs = Date.now();
  const rawKey = extractBearerToken(request);

  if (!rawKey) {
    return rejectUnauthorized(request, 'Missing or invalid API key');
  }

  const client = await findApiClientByKey(rawKey);
  if (!client) {
    return rejectUnauthorized(request, 'Invalid or revoked API key');
  }

  const ip = getClientIp(request);
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
        prisma.auditLog.create({
          data: {
            userId: client.userId,
            action: 'PARTNER_API_CALL',
            ipAddress: ip,
            details: {
              type: 'partner_api_call',
              apiClientId: client.id,
              endpoint: options.endpoint,
              method: options.method,
              statusCode,
              durationMs,
            },
          },
        }),
      ]);
    } catch {
      /* non bloquant */
    }
  };

  const fail = (response: ReturnType<typeof partnerError>): PartnerAuthFailure => ({
    ok: false,
    response,
    logApiCall,
    startMs,
  });

  const linkedUser = await prisma.user.findUnique({
    where: { id: client.userId },
    select: { banned: true, banExpires: true },
  });
  if (linkedUser && isUserBanned(linkedUser)) {
    return fail(partnerError('ACCOUNT_BANNED', 'Account is banned', 403));
  }

  if (options.requiredScopes?.length) {
    const missing = options.requiredScopes.filter((s) => !client.scopes.includes(s));
    if (missing.length > 0) {
      return fail(partnerError('FORBIDDEN', `Missing required scopes: ${missing.join(', ')}`, 403));
    }
  }

  if (options.requiredAnyScopes?.length) {
    const hasAny = options.requiredAnyScopes.some((s) => client.scopes.includes(s));
    if (!hasAny) {
      return fail(
        partnerError(
          'FORBIDDEN',
          `Missing required scopes: ${options.requiredAnyScopes.join(' or ')}`,
          403
        )
      );
    }
  }

  const limiter = getPartnerRateLimiter(client.rateLimitPerMin);
  const rateCheck = await limiter.checkLimit(request, client.id);
  if (!rateCheck.allowed) {
    return fail(
      partnerError('RATE_LIMITED', 'Rate limit exceeded', 429, {
        retry_after_seconds: Math.ceil((rateCheck.resetTime - Date.now()) / 1000),
      })
    );
  }

  const ctx: PartnerApiContext = {
    apiClientId: client.id,
    userId: client.userId,
    scopes: client.scopes,
    webhookSecret: client.webhookSecret,
  };

  return { ok: true, ctx, logApiCall, startMs };
}

export function hasScope(ctx: PartnerApiContext, scope: string): boolean {
  return ctx.scopes.includes(scope);
}
