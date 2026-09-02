import { NextRequest } from 'next/server';

jest.mock('~/prisma/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    trade: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), count: jest.fn() },
    payout: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn() },
    paymentMethod: { findFirst: jest.fn() },
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

jest.mock('@/lib/kycaid', () => ({
  canUserMakePayout: jest.fn(),
}));

jest.mock('@/lib/balance-service', () => ({
  checkWithdrawalLimit: jest.fn(),
}));

jest.mock('@/lib/payout-lifecycle', () => ({
  PayoutLifecycle: { onCreated: jest.fn() },
}));

jest.mock('@/lib/partner-api/webhook-service', () => ({
  notifyPayoutStatusChange: jest.fn(),
  notifyTradeStatusChange: jest.fn(),
}));

jest.mock('@/lib/skinplace-instant-inventory', () => {
  const actual = jest.requireActual('@/lib/skinplace-instant-inventory') as typeof import('@/lib/skinplace-instant-inventory');
  return {
    ...actual,
    fetchSkinplaceInstantInventory: jest.fn(),
  };
});

import { prisma } from '~/prisma/prisma';
import { requireApiKey } from '@/lib/partner-api/auth';
import { createPartnerTrade, estimatePartnerItems } from '@/lib/partner-api/trade-service';
import { canUserMakePayout } from '@/lib/kycaid';
import { fetchSkinplaceInstantInventory } from '@/lib/skinplace-instant-inventory';
import { GET as getMe } from '@/app/api/v1/partner/me/route';
import { GET as getTrades, POST as postTrades } from '@/app/api/v1/partner/trades/route';
import { GET as getTradeById } from '@/app/api/v1/partner/trades/[id]/route';
import { POST as postEstimate } from '@/app/api/v1/partner/estimate/route';
import { POST as postPayouts, GET as getPayouts } from '@/app/api/v1/partner/payouts/route';
import { PUT as putWebhook, GET as getWebhook } from '@/app/api/v1/partner/webhook/route';
import { GET as getInventory } from '@/app/api/v1/partner/inventory/route';

const mockedRequireApiKey = requireApiKey as jest.MockedFunction<typeof requireApiKey>;

function mockAuth(scopes: string[]) {
  const logApiCall = jest.fn().mockResolvedValue(undefined);
  mockedRequireApiKey.mockImplementation(async (_req, options = { endpoint: 'unknown', method: 'GET' }) => {
    const missing = (options.requiredScopes ?? []).filter((s) => !scopes.includes(s));
    if (missing.length > 0) {
      const { partnerError } = await import('@/lib/partner-api/response');
      return {
        ok: false as const,
        response: partnerError('FORBIDDEN', `Missing required scopes: ${missing.join(', ')}`, 403),
      };
    }
    if (options.requiredAnyScopes?.length && !options.requiredAnyScopes.some((s) => scopes.includes(s))) {
      const { partnerError } = await import('@/lib/partner-api/response');
      return {
        ok: false as const,
        response: partnerError(
          'FORBIDDEN',
          `Missing required scopes: ${options.requiredAnyScopes.join(' or ')}`,
          403
        ),
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

const sampleDbTrade = {
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
  createdAt: new Date('2026-07-28T09:00:00Z'),
  items: [],
};

describe('partner API HTTP routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /me returns profile without leaking role', async () => {
    mockAuth(['read']);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      steamId: '76561198012345678',
      steamUsername: 'Player',
      kycStatus: 'KYCAID_VERIFIED',
      acceptedTermsAt: new Date('2026-01-01'),
      tradeLink: 'https://steamcommunity.com/tradeoffer/new/?partner=1&token=abc',
      userTag: null,
      accountFrozen: false,
      createdAt: new Date('2025-01-01'),
    });

    const response = await getMe(new NextRequest('http://localhost/api/v1/partner/me'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.steam_username).toBe('Player');
    expect(body.data.kyc_status).toBe('verified');
    expect(body.data).not.toHaveProperty('role');
  });

  it('GET /inventory returns sellable Skinplace items and skips locked skins', async () => {
    mockAuth(['read']);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ steamId: '76561198012345678' });
    (fetchSkinplaceInstantInventory as jest.Mock).mockResolvedValue({
      ok: true,
      inventory: [
        {
          assetid: 'sellable-1',
          market_hash_name: 'AK-47 | Redline (FT)',
          price: 12.5,
          icon_url: 'abc',
          exterior: 'Field-Tested',
          is_stattrak: 0,
          is_souvenir: 0,
          rarity: 'Classified',
          untouchable: false,
        },
        {
          assetid: 'locked-1',
          market_hash_name: 'AWP | Dragon Lore (FN)',
          price: 9000,
          icon_url: 'def',
          exterior: 'Factory New',
          is_stattrak: 0,
          is_souvenir: 0,
          rarity: 'Covert',
          untouchable: true,
          skip_reason: 'system_lock',
        },
      ],
    });

    const response = await getInventory(new NextRequest('http://localhost/api/v1/partner/inventory'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.total_items).toBe(1);
    expect(body.data.items).toEqual([
      expect.objectContaining({
        asset_id: 'sellable-1',
        market_hash_name: 'AK-47 | Redline (FT)',
        price_cents: 1250,
      }),
    ]);
  });

  it('GET /inventory uses trade_url Steam ID instead of the saved account', async () => {
    mockAuth(['read']);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      steamId: '76561199040420116',
      tradeLink: 'https://steamcommunity.com/tradeoffer/new/?partner=1080154388&token=savedTok',
    });
    (fetchSkinplaceInstantInventory as jest.Mock).mockResolvedValue({
      ok: true,
      inventory: [],
    });

    const tradeUrl = 'https://steamcommunity.com/tradeoffer/new/?partner=52079950&token=AbCdEfGh';
    const response = await getInventory(
      new NextRequest(
        `http://localhost/api/v1/partner/inventory?trade_url=${encodeURIComponent(tradeUrl)}`
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchSkinplaceInstantInventory).toHaveBeenCalledWith('76561198012345678');
    expect(body.data.steam_id).toBe('76561198012345678');
    expect(body.data.total_items).toBe(0);
  });

  it('GET /inventory returns 503 JSON with provider_error instead of 502', async () => {
    mockAuth(['read']);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ steamId: '76561198012345678' });
    (fetchSkinplaceInstantInventory as jest.Mock).mockResolvedValue({
      ok: false,
      code: 'API_ERROR',
      error: 'Unable to fetch inventory from the trade provider',
      provider: { status: 'error', error_message: 'need_auth' },
    });

    const response = await getInventory(new NextRequest('http://localhost/api/v1/partner/inventory'));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error.code).toBe('API_ERROR');
    expect(body.error.provider_error).toBe('need_auth');
    expect(body.error.provider_status).toBe('error');
  });

  it('GET /inventory returns an empty list when Skinplace reports empty_inventory', async () => {
    mockAuth(['read']);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ steamId: '76561198012345678' });
    (fetchSkinplaceInstantInventory as jest.Mock).mockResolvedValue({
      ok: true,
      inventory: [],
    });

    const response = await getInventory(new NextRequest('http://localhost/api/v1/partner/inventory'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.total_items).toBe(0);
    expect(body.data.items).toEqual([]);
  });

  it('GET /me is blocked for trade-only scope', async () => {
    mockAuth(['trade']);

    const response = await getMe(new NextRequest('http://localhost/api/v1/partner/me'));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
    expect(body.error.message).toContain('read');
  });

  it('GET /trades lists English statuses and returns total, not page length as count', async () => {
    mockAuth(['read']);
    (prisma.trade.findMany as jest.Mock).mockResolvedValue([sampleDbTrade]);
    (prisma.trade.count as jest.Mock).mockResolvedValue(42);

    const response = await getTrades(new NextRequest('http://localhost/api/v1/partner/trades?limit=1&offset=0'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.trades).toHaveLength(1);
    expect(body.data.trades[0].status).toBe('created');
    expect(body.data.trades[0].trade_id).toBe('TRADE-1');
    expect(body.data.trades[0].id).toBe('TRADE-1');
    expect(body.data.trades[0]).not.toHaveProperty('statut');
    expect(body.data.pagination).toEqual({ limit: 1, offset: 0, total: 42 });
  });

  it('GET /trades rejects non-integer pagination instead of querying with NaN', async () => {
    mockAuth(['read']);

    const response = await getTrades(new NextRequest('http://localhost/api/v1/partner/trades?limit=nope'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(prisma.trade.findMany).not.toHaveBeenCalled();
  });

  it('GET /trades/{id} returns English trade detail with payment_reference', async () => {
    mockAuth(['read']);
    (prisma.trade.findFirst as jest.Mock).mockResolvedValue({
      ...sampleDbTrade,
      status: 'IN_TRADE_HOLD',
      ticketId: 'TICK-1',
      tradeAcceptedAt: new Date('2026-07-28T10:00:00Z'),
      availableAt: new Date('2026-08-04T10:00:00Z'),
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
    expect(body.data.status).toBe('in_trade_hold');
    expect(body.data.payment_reference).toBe('TICK-1');
    expect(body.data.gross_cents).toBe(1000);
    expect(body.data.items[0].price_cents).toBe(1000);
    expect(body.data).not.toHaveProperty('reference_paiement');
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

  it('POST /trades maps provider status and keeps API_ERROR instead of VALIDATION_ERROR', async () => {
    mockAuth(['read', 'trade']);
    (createPartnerTrade as jest.Mock).mockResolvedValueOnce({
      ok: true,
      trade: {
        id: 'TRADE-9',
        ticketId: 'order-1',
        status: 'CREATED',
        grossCents: 2000,
        netCents: 1990,
        cashoutFees: 10,
        networkFees: 0,
        expiresAt: new Date('2026-08-04T00:00:00Z'),
        availableAt: null,
      },
    });

    const created = await postTrades(
      new NextRequest('http://localhost/api/v1/partner/trades', {
        method: 'POST',
        body: JSON.stringify({
          items: [{ asset_id: 'asset-1' }],
          trade_url: 'https://steamcommunity.com/tradeoffer/new/?partner=123456789&token=AbCdEfGh',
        }),
        headers: { 'content-type': 'application/json' },
      })
    );
    const createdBody = await created.json();

    expect(created.status).toBe(201);
    expect(createdBody.data.status).toBe('created');
    expect(createdBody.data.gross_cents).toBe(2000);
    expect(createdBody.data.id).toBe('TRADE-9');

    (createPartnerTrade as jest.Mock).mockResolvedValueOnce({
      ok: false,
      error: 'Trade provider rejected the request',
      code: 'API_ERROR',
      status: 502,
    });

    const failed = await postTrades(
      new NextRequest('http://localhost/api/v1/partner/trades', {
        method: 'POST',
        body: JSON.stringify({
          items: [{ asset_id: 'asset-1' }],
          trade_url: 'https://steamcommunity.com/tradeoffer/new/?partner=123456789&token=AbCdEfGh',
        }),
        headers: { 'content-type': 'application/json' },
      })
    );
    const failedBody = await failed.json();
    expect(failed.status).toBe(502);
    expect(failedBody.error.code).toBe('API_ERROR');
  });

  it('POST /trades returns VALIDATION_ERROR envelope on invalid JSON', async () => {
    mockAuth(['read', 'trade']);

    const response = await postTrades(
      new NextRequest('http://localhost/api/v1/partner/trades', {
        method: 'POST',
        body: '{not-json',
        headers: { 'content-type': 'application/json' },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(createPartnerTrade).not.toHaveBeenCalled();
  });

  it('POST /estimate does not leak the internal ok flag', async () => {
    mockAuth(['read']);
    (estimatePartnerItems as jest.Mock).mockResolvedValue({
      ok: true,
      data: {
        gross_cents: 1000,
        fees: { cashout: 5, network: 0 },
        net_cents: 995,
        vip_bonus_cents: 0,
        items: [{ asset_id: '1', market_hash_name: 'AK', price_cents: 1000 }],
      },
    });

    const response = await postEstimate(
      new NextRequest('http://localhost/api/v1/partner/estimate', {
        method: 'POST',
        body: JSON.stringify({ asset_ids: ['1'] }),
        headers: { 'content-type': 'application/json' },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.gross_cents).toBe(1000);
    expect(body.data).not.toHaveProperty('ok');
    expect(body.data.fees.network).toBe(0);
  });

  it('POST /estimate forwards trade_url to the estimator', async () => {
    mockAuth(['read']);
    (estimatePartnerItems as jest.Mock).mockResolvedValue({
      ok: true,
      data: {
        gross_cents: 1000,
        fees: { cashout: 5, network: 0 },
        net_cents: 995,
        vip_bonus_cents: 0,
        items: [{ asset_id: '1', market_hash_name: 'AK', price_cents: 1000 }],
      },
    });
    const tradeUrl = 'https://steamcommunity.com/tradeoffer/new/?partner=123456789&token=AbCdEfGh';

    const response = await postEstimate(
      new NextRequest('http://localhost/api/v1/partner/estimate', {
        method: 'POST',
        body: JSON.stringify({ asset_ids: ['1'], trade_url: tradeUrl }),
        headers: { 'content-type': 'application/json' },
      })
    );

    expect(response.status).toBe(200);
    expect(estimatePartnerItems).toHaveBeenCalledWith('user-1', ['1'], tradeUrl);
  });

  it('GET /payouts lists English statuses and returns total, not page length as count', async () => {
    mockAuth(['read']);
    (prisma.payout.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'payout-1',
        status: 'PENDING',
        amountCents: 120000,
        tradeId: 'TRADE-1',
        createdAt: new Date('2026-07-28T12:00:00Z'),
        paidAt: null,
        paymentMethod: { type: 'SEPA', isVerified: true },
      },
    ]);
    (prisma.payout.count as jest.Mock).mockResolvedValue(7);

    const response = await getPayouts(
      new NextRequest('http://localhost/api/v1/partner/payouts?limit=1&offset=0')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.payouts).toHaveLength(1);
    expect(body.data.payouts[0].id).toBe('payout-1');
    expect(body.data.payouts[0].status).toBe('pending');
    expect(body.data.payouts[0].amount_cents).toBe(120000);
    expect(body.data.payouts[0].trade_id).toBe('TRADE-1');
    expect(body.data.payouts[0].created_at).toBe('2026-07-28T12:00:00.000Z');
    expect(body.data.pagination).toEqual({ limit: 1, offset: 0, total: 7 });
    expect(prisma.payout.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        take: 1,
        skip: 0,
      })
    );
  });

  it('GET /payouts rejects non-integer pagination instead of querying', async () => {
    mockAuth(['read']);

    const response = await getPayouts(new NextRequest('http://localhost/api/v1/partner/payouts?limit=nope'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(prisma.payout.findMany).not.toHaveBeenCalled();
  });

  it('GET /payouts is blocked without read scope', async () => {
    mockAuth(['payout']);

    const response = await getPayouts(new NextRequest('http://localhost/api/v1/partner/payouts'));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
    expect(prisma.payout.findMany).not.toHaveBeenCalled();
  });

  it('POST /payouts refuses to create an empty SEPA method', async () => {
    mockAuth(['payout']);
    (prisma.trade.findUnique as jest.Mock).mockResolvedValue({
      ...sampleDbTrade,
      status: 'AVAILABLE',
      user: { accountFrozen: false, acceptedTermsAt: new Date('2026-01-01') },
    });
    (prisma.payout.findFirst as jest.Mock).mockResolvedValue(null);
    (canUserMakePayout as jest.Mock).mockResolvedValue({ allowed: true });
    const { checkWithdrawalLimit } = jest.requireMock('@/lib/balance-service') as {
      checkWithdrawalLimit: jest.Mock;
    };
    checkWithdrawalLimit.mockResolvedValue({ allowed: true });
    (prisma.paymentMethod.findFirst as jest.Mock).mockResolvedValue({
      id: 'pm-empty',
      type: 'SEPA',
      isVerified: false,
      details: {},
    });

    const response = await postPayouts(
      new NextRequest('http://localhost/api/v1/partner/payouts', {
        method: 'POST',
        body: JSON.stringify({ trade_id: 'TRADE-1' }),
        headers: { 'content-type': 'application/json' },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toMatch(/payout method/i);
    expect(prisma.payout.create).not.toHaveBeenCalled();
  });

  it('POST /payouts requires accepted terms before KYC', async () => {
    mockAuth(['payout']);
    (prisma.trade.findUnique as jest.Mock).mockResolvedValue({
      ...sampleDbTrade,
      status: 'AVAILABLE',
      user: { accountFrozen: false, acceptedTermsAt: null },
    });

    const response = await postPayouts(
      new NextRequest('http://localhost/api/v1/partner/payouts', {
        method: 'POST',
        body: JSON.stringify({ trade_id: 'TRADE-1' }),
        headers: { 'content-type': 'application/json' },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('TERMS_REQUIRED');
    expect(canUserMakePayout).not.toHaveBeenCalled();
  });

  it('PUT /webhook rejects localhost URLs', async () => {
    mockAuth(['trade']);

    const response = await putWebhook(
      new NextRequest('http://localhost/api/v1/partner/webhook', {
        method: 'PUT',
        body: JSON.stringify({ webhook_url: 'https://127.0.0.1/hooks' }),
        headers: { 'content-type': 'application/json' },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(prisma.apiClient.update).not.toHaveBeenCalled();
  });

  it('PUT /webhook is blocked for read-only keys', async () => {
    mockAuth(['read']);

    const response = await putWebhook(
      new NextRequest('http://localhost/api/v1/partner/webhook', {
        method: 'PUT',
        body: JSON.stringify({ webhook_url: 'https://partner.example.com/hooks' }),
        headers: { 'content-type': 'application/json' },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
    expect(prisma.apiClient.update).not.toHaveBeenCalled();
  });

  it('GET /webhook returns the active config without the signing secret', async () => {
    mockAuth(['read']);
    (prisma.apiClient.findUnique as jest.Mock).mockResolvedValue({
      webhookUrl: 'https://partner.example.com/hooks',
    });

    const response = await getWebhook(new NextRequest('http://localhost/api/v1/partner/webhook'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.webhook_url).toBe('https://partner.example.com/hooks');
    expect(body.data.signature_header).toBe('X-MoonSkin-Signature');
    expect(JSON.stringify(body.data)).not.toMatch(/webhookSecret|webhook_secret/);
  });
});
