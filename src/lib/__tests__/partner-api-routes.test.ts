import { NextRequest } from 'next/server';

jest.mock('~/prisma/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    trade: { findMany: jest.fn(), findFirst: jest.fn() },
    apiClient: { findUnique: jest.fn(), update: jest.fn() },
  },
}));

jest.mock('@/lib/partner-api/auth', () => ({
  requireApiKey: jest.fn(),
}));

jest.mock('@/lib/partner-api/trade-service', () => ({
  createPartnerTrade: jest.fn(),
  estimatePartnerItems: jest.fn(),
}));

import { prisma } from '~/prisma/prisma';
import { requireApiKey } from '@/lib/partner-api/auth';
import { GET as getMe } from '@/app/api/v1/partner/me/route';
import { GET as getTrades } from '@/app/api/v1/partner/trades/route';
import { GET as getTradeById } from '@/app/api/v1/partner/trades/[id]/route';

const mockedRequireApiKey = requireApiKey as jest.MockedFunction<typeof requireApiKey>;

function mockAuth(scopes: string[]) {
  const logApiCall = jest.fn().mockResolvedValue(undefined);
  mockedRequireApiKey.mockImplementation(async (_req, options = { endpoint: 'unknown', method: 'GET' }) => {
    const missing = (options.requiredScopes ?? []).filter((s) => !scopes.includes(s));
    if (missing.length > 0) {
      const { partnerError } = await import('@/lib/partner-api/response');
      return {
        ok: false as const,
        response: partnerError('FORBIDDEN', `Scopes requis manquants: ${missing.join(', ')}`, 403),
      };
    }
    return {
      ok: true as const,
      ctx: {
        apiClientId: 'client-1',
        userId: 'user-1',
        scopes,
        webhookSecret: 'whsec',
      },
      logApiCall,
      startMs: Date.now(),
    };
  });
  return logApiCall;
}

describe('partner API HTTP routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /me returns profile for read scope', async () => {
    mockAuth(['read']);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      steamId: '76561198012345678',
      steamUsername: 'Player',
      kycStatus: 'APPROVED',
      acceptedTermsAt: new Date('2026-01-01'),
      tradeLink: 'https://steamcommunity.com/tradeoffer/new/?partner=1&token=abc',
      userTag: null,
      role: 'USER',
      accountFrozen: false,
      createdAt: new Date('2025-01-01'),
    });

    const response = await getMe(new NextRequest('http://localhost/api/v1/partner/me'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.steam_username).toBe('Player');
  });

  it('GET /me is blocked for trade-only scope', async () => {
    mockAuth(['trade']);

    const response = await getMe(new NextRequest('http://localhost/api/v1/partner/me'));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
    expect(body.error.message).toContain('read');
  });

  it('GET /trades lists trades for read scope', async () => {
    mockAuth(['read']);
    (prisma.trade.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'TRADE-1',
        userId: 'user-1',
        status: 'CREATED',
        grossCents: 1000,
        cashoutFees: 5,
        networkFees: 0,
        netCents: 995,
        ticketId: 'T-1',
        steamId: '76561198012345678',
        tradeUrl: null,
        tradeAcceptedAt: null,
        availableAt: null,
        createdAt: new Date(),
        items: [],
      },
    ]);

    const response = await getTrades(new NextRequest('http://localhost/api/v1/partner/trades'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.trades).toHaveLength(1);
    expect(body.data.trades[0].statut).toBe('créé');
  });

  it('GET /trades/{id} returns trade detail for read scope', async () => {
    mockAuth(['read']);
    (prisma.trade.findFirst as jest.Mock).mockResolvedValue({
      id: 'TRADE-1',
      userId: 'user-1',
      status: 'IN_TRADE_HOLD',
      grossCents: 1000,
      cashoutFees: 5,
      networkFees: 0,
      netCents: 995,
      ticketId: 'TICK-1',
      steamId: '76561198012345678',
      tradeUrl: null,
      tradeAcceptedAt: new Date('2026-07-28T10:00:00Z'),
      availableAt: new Date('2026-08-04T10:00:00Z'),
      createdAt: new Date('2026-07-28T09:00:00Z'),
      items: [
        {
          id: 'item-1',
          name: 'AK-47 | Redline',
          marketHashName: 'AK-47 | Redline (Field-Tested)',
          priceCents: 1000,
          iconUrl: null,
          exterior: 'Field-Tested',
          statTrak: false,
          rarity: 'Classified',
        },
      ],
    });

    const response = await getTradeById(
      new NextRequest('http://localhost/api/v1/partner/trades/TRADE-1'),
      { params: Promise.resolve({ id: 'TRADE-1' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.id).toBe('TRADE-1');
    expect(body.data.statut).toBe('en_trade_hold');
    expect(body.data.reference_paiement).toBe('TICK-1');
    expect(body.data.items).toHaveLength(1);
  });

  it('GET /trades/{id} returns 404 when trade is missing', async () => {
    mockAuth(['read']);
    (prisma.trade.findFirst as jest.Mock).mockResolvedValue(null);

    const response = await getTradeById(
      new NextRequest('http://localhost/api/v1/partner/trades/UNKNOWN'),
      { params: Promise.resolve({ id: 'UNKNOWN' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });
});
