import { NextRequest } from 'next/server';
import { requireApiKey } from '@/lib/partner-api/auth';
import { findApiClientByKey } from '@/lib/partner-api/key-service';
import { prisma } from '~/prisma/prisma';

jest.mock('@/lib/partner-api/key-service', () => ({
  findApiClientByKey: jest.fn(),
}));

jest.mock('~/prisma/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    partnerApiLog: { create: jest.fn() },
    apiClient: { update: jest.fn() },
    auditLog: { create: jest.fn() },
  },
}));

jest.mock('@/lib/security/rate-limiter', () => {
  const checkLimit = jest.fn().mockResolvedValue({
    allowed: true,
    remaining: 99,
    resetTime: Date.now() + 60_000,
    blocked: false,
  });
  return {
    RateLimiter: class {
      checkLimit = checkLimit;
    },
    __checkLimit: checkLimit,
  };
});

const { __checkLimit: mockedCheckLimit } = jest.requireMock('@/lib/security/rate-limiter') as {
  __checkLimit: jest.Mock;
};

const mockedFind = findApiClientByKey as jest.MockedFunction<typeof findApiClientByKey>;

function sampleClient(overrides: Record<string, unknown> = {}) {
  return {
    id: 'client-1',
    name: 'Partner',
    keyPrefix: 'msk_live_abcdef',
    keyHash: 'a'.repeat(64),
    webhookSecret: 'secret',
    webhookUrl: null,
    scopes: ['read', 'trade', 'payout'],
    rateLimitPerMin: 100,
    status: 'ACTIVE',
    expiresAt: null,
    userId: 'user-1',
    createdBy: 'admin',
    lastUsedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function bearerRequest(path: string, key = 'msk_live_test') {
  return new NextRequest(`http://localhost${path}`, {
    headers: { authorization: `Bearer ${key}` },
  });
}

describe('partner-api requireApiKey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.partnerApiLog.create as jest.Mock).mockResolvedValue({});
    (prisma.apiClient.update as jest.Mock).mockResolvedValue({});
    (prisma.auditLog.create as jest.Mock).mockResolvedValue({});
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ banned: false, banExpires: null });
    mockedCheckLimit.mockResolvedValue({
      allowed: true,
      remaining: 99,
      resetTime: Date.now() + 60_000,
      blocked: false,
    });
  });

  it('rejects missing bearer without logging (no client)', async () => {
    const result = await requireApiKey(new NextRequest('http://localhost/api/v1/partner/me'), {
      endpoint: '/api/v1/partner/me',
      method: 'GET',
      requiredScopes: ['read'],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      expect(result.logApiCall).toBeUndefined();
    }
    expect(mockedFind).not.toHaveBeenCalled();
  });

  it('rate-limits repeated missing or invalid API keys', async () => {
    mockedCheckLimit.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 60_000,
      blocked: true,
    });

    const result = await requireApiKey(new NextRequest('http://localhost/api/v1/partner/me'), {
      endpoint: '/api/v1/partner/me',
      method: 'GET',
      requiredScopes: ['read'],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const body = await result.response.json();
      expect(result.response.status).toBe(429);
      expect(body.error.code).toBe('RATE_LIMITED');
    }
  });

  it('rejects invalid keys without logging a client', async () => {
    mockedFind.mockResolvedValue(null);

    const result = await requireApiKey(bearerRequest('/api/v1/partner/me', 'msk_live_bad'), {
      endpoint: '/api/v1/partner/me',
      method: 'GET',
      requiredScopes: ['read'],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      expect(result.logApiCall).toBeUndefined();
    }
  });

  it('rejects banned accounts and exposes a logger', async () => {
    mockedFind.mockResolvedValue(sampleClient() as never);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ banned: true, banExpires: null });

    const result = await requireApiKey(bearerRequest('/api/v1/partner/me'), {
      endpoint: '/api/v1/partner/me',
      method: 'GET',
      requiredScopes: ['read'],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const body = await result.response.json();
      expect(result.response.status).toBe(403);
      expect(body.error.code).toBe('ACCOUNT_BANNED');
      expect(result.logApiCall).toEqual(expect.any(Function));
      await result.logApiCall?.(403, Date.now());
    }
    expect(prisma.partnerApiLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          apiClientId: 'client-1',
          statusCode: 403,
          endpoint: '/api/v1/partner/me',
        }),
      })
    );
  });

  it('rejects missing scopes and exposes a logger', async () => {
    mockedFind.mockResolvedValue(sampleClient({ scopes: ['read'] }) as never);

    const result = await requireApiKey(bearerRequest('/api/v1/partner/trades'), {
      endpoint: '/api/v1/partner/trades',
      method: 'POST',
      requiredScopes: ['trade'],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const body = await result.response.json();
      expect(result.response.status).toBe(403);
      expect(body.error.code).toBe('FORBIDDEN');
      expect(result.logApiCall).toEqual(expect.any(Function));
    }
  });
});
