import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';
import {
  hashApiKey,
  generateApiKey,
  generateWebhookSecret,
} from '@/lib/partner-api/key-service';
import { buildPartnerWebhookEventId, verifyWebhookSignature } from '@/lib/partner-api/webhook-service';
import {
  formatCreatedTradeForPartner,
  formatInventoryForPartner,
  formatPayoutForPartner,
  formatTradeForPartner,
  mapKycStatus,
  mapPaymentMethodType,
  mapPayoutStatus,
  mapTradeStatus,
  partnerInventoryFetchFailed,
  toPartnerErrorCode,
  toPartnerFacingProviderError,
  PARTNER_ERROR_CODE_LIST,
} from '@/lib/partner-api/response';
import { validatePartnerTradeUrl } from '@/lib/partner-api/trade-url-validation';
import { withPartnerApi } from '@/lib/partner-api/handler';
import { requireApiKey } from '@/lib/partner-api/auth';
import { partnerCreateTradeSchema, partnerEstimateSchema, partnerWebhookConfigSchema } from '@/lib/partner-api/schemas';
import { parsePartnerPagination, safeParsePartnerJson } from '@/lib/partner-api/validation';
import { assertPublicHttpsWebhookUrl } from '@/lib/partner-api/webhook-url';
import { isUsablePartnerPaymentMethod } from '@/lib/partner-api/payout-guards';
import { partnerErrorCodesGuide, partnerPrerequisitesGuide, partnerResponseExamples, partnerWebhookGuide, partnerCurlExamples } from '@/lib/partner-api/docs-content';
import {
  assertPartnerAccountReady,
  assertPartnerTermsAccepted,
  partnerAccountGuardFrMessage,
} from '@/lib/partner-api/account-guards';

jest.mock('@/lib/partner-api/auth', () => ({
  requireApiKey: jest.fn(),
}));

const mockedRequireApiKey = requireApiKey as jest.MockedFunction<typeof requireApiKey>;

function sampleTrade() {
  return {
    id: 'TRADE-1',
    userId: 'user-1',
    status: 'CREATED',
    grossCents: 125000,
    cashoutFees: 625,
    networkFees: 4375,
    netCents: 120000,
    ticketId: 'TICK-1',
    steamId: '76561198012345678',
    tradeUrl: 'https://steamcommunity.com/tradeoffer/new/?partner=1&token=abc',
    tradeAcceptedAt: null,
    availableAt: null,
    createdAt: new Date('2026-07-28T12:00:00.000Z'),
    items: [
      {
        id: 'item-1',
        name: 'AK-47 | Redline',
        marketHashName: 'AK-47 | Redline (Field-Tested)',
        priceCents: 125000,
        iconUrl: null,
        exterior: 'Field-Tested',
        statTrak: false,
        rarity: 'Classified',
      },
    ],
  };
}

describe('partner-api key-service', () => {
  it('hashApiKey is deterministic', () => {
    const key = 'msk_live_abc123def456';
    expect(hashApiKey(key)).toBe(hashApiKey(key));
    expect(hashApiKey(key)).toHaveLength(64);
  });

  it('generateApiKey produces valid prefix and hash', () => {
    const { rawKey, keyPrefix, keyHash } = generateApiKey();
    expect(rawKey).toMatch(/^msk_live_[a-f0-9]{48}$/);
    expect(keyPrefix).toBe(rawKey.slice(0, 16));
    expect(keyHash).toBe(hashApiKey(rawKey));
  });

  it('generateWebhookSecret is 64 hex chars', () => {
    expect(generateWebhookSecret()).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('partner-api webhook signature', () => {
  it('verifyWebhookSignature accepts valid HMAC', () => {
    const secret = 'test-secret';
    const body = JSON.stringify({ event_id: 'evt-1', type: 'trade.created' });
    const timestamp = Math.floor(Date.now() / 1000);
    const signed = `${timestamp}.${body}`;
    const sig = createHmac('sha256', secret).update(signed).digest('hex');
    const header = `t=${timestamp},v1=${sig}`;

    expect(verifyWebhookSignature(secret, body, header)).toBe(true);
  });

  it('verifyWebhookSignature rejects tampered body', () => {
    const secret = 'test-secret';
    const body = JSON.stringify({ event_id: 'evt-1' });
    const timestamp = Math.floor(Date.now() / 1000);
    const signed = `${timestamp}.${body}`;
    const sig = createHmac('sha256', secret).update(signed).digest('hex');
    const header = `t=${timestamp},v1=${sig}`;

    expect(verifyWebhookSignature(secret, '{"event_id":"evt-2"}', header)).toBe(false);
  });

  it('verifyWebhookSignature rejects expired timestamp', () => {
    const secret = 'test-secret';
    const body = JSON.stringify({ event_id: 'evt-1' });
    const timestamp = Math.floor(Date.now() / 1000) - 600;
    const signed = `${timestamp}.${body}`;
    const sig = createHmac('sha256', secret).update(signed).digest('hex');
    const header = `t=${timestamp},v1=${sig}`;

    expect(verifyWebhookSignature(secret, body, header, 300)).toBe(false);
  });

  it('verifyWebhookSignature rejects malformed headers without throwing', () => {
    expect(verifyWebhookSignature('secret', '{}', 'not-a-signature')).toBe(false);
    expect(verifyWebhookSignature('secret', '{}', 't=abc,v1=ffff')).toBe(false);
  });
});

describe('partner-api webhook event idempotence', () => {
  it('buildPartnerWebhookEventId is stable for the same status change', () => {
    const first = buildPartnerWebhookEventId(
      'trade.status_changed',
      'TRADE-123',
      'in_trade_hold',
      'client-1'
    );
    const second = buildPartnerWebhookEventId(
      'trade.status_changed',
      'TRADE-123',
      'in_trade_hold',
      'client-1'
    );
    expect(first).toBe('trade.status_changed:TRADE-123:in_trade_hold:client-1');
    expect(first).toBe(second);
  });

  it('buildPartnerWebhookEventId changes when status or resource changes', () => {
    const hold = buildPartnerWebhookEventId('trade.status_changed', 'TRADE-123', 'in_trade_hold', 'c1');
    const available = buildPartnerWebhookEventId('trade.status_changed', 'TRADE-123', 'available', 'c1');
    const otherTrade = buildPartnerWebhookEventId('trade.status_changed', 'TRADE-999', 'in_trade_hold', 'c1');
    expect(hold).not.toBe(available);
    expect(hold).not.toBe(otherTrade);
  });
});

describe('partner-api JSON contract', () => {
  it('maps DB trade enums to English snake_case slugs', () => {
    expect(mapTradeStatus('CREATED')).toBe('created');
    expect(mapTradeStatus('ACCEPTED_BY_BOT')).toBe('accepted_by_bot');
    expect(mapTradeStatus('IN_TRADE_HOLD')).toBe('in_trade_hold');
    expect(mapTradeStatus('AVAILABLE')).toBe('available');
    expect(mapTradeStatus('PAYOUT_PENDING')).toBe('payout_pending');
    expect(mapTradeStatus('PAID')).toBe('paid');
  });

  it('maps payout enums including provider-specific states', () => {
    expect(mapPayoutStatus('PENDING')).toBe('pending');
    expect(mapPayoutStatus('VERIFICATION_REQUIRED')).toBe('verification_required');
    expect(mapPayoutStatus('PAID')).toBe('paid');
    expect(mapPayoutStatus('WHITEPAY_COMPLETE')).toBe('paid');
    expect(mapPayoutStatus('FAILED')).toBe('failed');
  });

  it('formatTradeForPartner uses English fields and never accented keys', () => {
    const payload = formatTradeForPartner(sampleTrade());
    const json = JSON.stringify(payload);

    expect(payload.status).toBe('created');
    expect(payload.gross_cents).toBe(125000);
    expect(payload.net_cents).toBe(120000);
    expect(payload.fees).toEqual({ cashout: 625, network: 4375 });
    expect(payload.payment_reference).toBe('TICK-1');
    expect(payload.items[0].price_cents).toBe(125000);
    expect(json).not.toMatch(/statut|brut_centimes|net_centimes|prix_centimes|réseau|disponible_le|reference_paiement/);
    expect(json).not.toMatch(/[éèàùôî]/);
  });

  it('public docs examples stay aligned with the English contract', () => {
    const docs = `${partnerResponseExamples.estimate}${partnerResponseExamples.webhook}${partnerResponseExamples.tradeDetail}${partnerWebhookGuide}`;
    expect(docs).toMatch(/"gross_cents"/);
    expect(docs).toMatch(/"payment_reference"/);
    expect(docs).not.toMatch(/brut_centimes|statut|reference_paiement|"réseau"/);
    expect(partnerResponseExamples.webhook).toContain('trade.status_changed:TRADE-123:available:clxabc');
    expect(partnerWebhookGuide).toMatch(/deterministic/);
    expect(partnerCurlExamples).toContain('/api/v1/partner/webhook');
    expect(partnerCurlExamples).toMatch(/GET.*webhook|Read active webhook/i);
  });

  it('documents every standard partner error code', () => {
    for (const code of PARTNER_ERROR_CODE_LIST) {
      expect(partnerErrorCodesGuide).toContain(code);
    }
    expect(partnerErrorCodesGuide).toMatch(/"success": false/);
  });

  it('documents partner go-live prerequisites from the quote', () => {
    expect(partnerPrerequisitesGuide).toMatch(/Steam linked/i);
    expect(partnerPrerequisitesGuide).toMatch(/terms of service/i);
    expect(partnerPrerequisitesGuide).toMatch(/KYC/i);
    expect(partnerPrerequisitesGuide).toMatch(/Trade Link/i);
    expect(partnerPrerequisitesGuide).toMatch(/HTTPS/);
    expect(partnerPrerequisitesGuide).toMatch(/100 requests/);
    expect(partnerPrerequisitesGuide).toContain('api-support@moonskin.gg');
  });

  it('POST create payload maps raw Prisma status instead of leaking CREATED', () => {
    const payload = formatCreatedTradeForPartner({
      id: 'TRADE-1',
      ticketId: 'TICK-1',
      status: 'CREATED',
      grossCents: 1000,
      netCents: 995,
      cashoutFees: 5,
      networkFees: 0,
      expiresAt: new Date('2026-08-04T12:00:00.000Z'),
      availableAt: null,
    });

    expect(payload.status).toBe('created');
    expect(payload.id).toBe('TRADE-1');
    expect(payload.trade_id).toBe('TRADE-1');
    expect(payload.gross_cents).toBe(1000);
    expect(payload.fees.network).toBe(0);
    expect(payload.payment_reference).toBe('TICK-1');
    expect(payload.vip_bonus_cents).toBe(0);
  });

  it('inventory formatter unwraps Skinplace envelope into the partner contract', () => {
    const payload = formatInventoryForPartner('76561198012345678', {
      data: {
        items: [
          {
            id: 'asset-1',
            market_hash_name: 'AK-47 | Redline (FT)',
            price: 125000,
            icon_url: null,
            exterior: 'Field-Tested',
            stat_trak: false,
            rarity: 'Classified',
          },
        ],
        total_items: 1,
        total_value: 125000,
      },
    });

    expect(payload).toEqual({
      steam_id: '76561198012345678',
      items: [
        {
          asset_id: 'asset-1',
          market_hash_name: 'AK-47 | Redline (FT)',
          price_cents: 125000,
          icon_url: null,
          exterior: 'Field-Tested',
          stat_trak: false,
          rarity: 'Classified',
        },
      ],
      total_items: 1,
      total_value_cents: 125000,
    });
    expect(payload).not.toHaveProperty('success');
    expect(payload).not.toHaveProperty('data');
  });

  it('inventory formatter unwraps the raw Skinplace instant envelope', () => {
    const payload = formatInventoryForPartner('76561198012345678', {
      inventory: [
        {
          assetid: 'asset-9',
          market_hash_name: 'AWP | Asiimov (FT)',
          price: 12.5,
          icon_url: null,
          exterior: 'Field-Tested',
          is_stattrak: 0,
          rarity: 'Covert',
        },
      ],
    });

    expect(payload.items[0].asset_id).toBe('asset-9');
    expect(payload.items[0].price_cents).toBe(1250);
    expect(payload.items[0].icon_url).toBeNull();
    expect(payload.total_items).toBe(1);
    expect(payload.total_value_cents).toBe(1250);
  });

  it('inventory formatter prefixes Skinplace icon hashes', () => {
    const payload = formatInventoryForPartner('76561198012345678', {
      inventory: [
        {
          assetid: 'asset-2',
          market_hash_name: 'Glock-18 | Water Elemental (FT)',
          price: 1.2,
          icon_url: '-9a81dlWLw',
        },
      ],
    });
    expect(payload.items[0].icon_url).toBe(
      'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLw'
    );
  });

  it('treats success:false inventory as a provider failure', () => {
    expect(partnerInventoryFetchFailed({ success: false, error: 'nope' })).toBe(true);
    expect(partnerInventoryFetchFailed({ success: true, data: { items: [] } })).toBe(false);
  });

  it('maps KYC and payment method enums to English slugs', () => {
    expect(mapKycStatus('KYCAID_VERIFIED')).toBe('verified');
    expect(mapKycStatus('PENDING')).toBe('pending');
    expect(mapKycStatus('KYCAID_REJECTED')).toBe('rejected');
    expect(mapPaymentMethodType('WHITEPAY_CRYPTO')).toBe('crypto');
    expect(mapPaymentMethodType('FLEXIFY_SEPA')).toBe('sepa');
  });

  it('maps provider errors to English partner messages', () => {
    expect(toPartnerFacingProviderError('ITEMS_NOT_FOUND')).toMatch(/Steam inventory/i);
    expect(toPartnerFacingProviderError('API_ERROR')).not.toMatch(/[éèàùôî]/);
    expect(toPartnerFacingProviderError('CONFIG_ERROR')).toMatch(/not configured/i);
  });

  it('payout formatter uses payout id as payment_reference', () => {
    const payload = formatPayoutForPartner({
      id: 'payout-1',
      status: 'PENDING',
      amountCents: 120000,
      tradeId: 'TRADE-1',
      paymentMethod: { type: 'SEPA', isVerified: true },
    });
    expect(payload.payment_reference).toBe('payout-1');
    expect(payload.payment_method.type).toBe('sepa');
    expect(payload.status).toBe('pending');
  });

  it('toPartnerErrorCode keeps API_ERROR and maps unknown item errors', () => {
    expect(toPartnerErrorCode('API_ERROR')).toBe('API_ERROR');
    expect(toPartnerErrorCode('ACCOUNT_FROZEN')).toBe('ACCOUNT_FROZEN');
    expect(toPartnerErrorCode('TERMS_REQUIRED')).toBe('TERMS_REQUIRED');
    expect(toPartnerErrorCode('ITEMS_NOT_FOUND')).toBe('VALIDATION_ERROR');
    expect(toPartnerErrorCode('SOMETHING_ELSE')).toBe('VALIDATION_ERROR');
  });
});

describe('partner-api pagination and validation envelope', () => {
  it('defaults limit/offset and rejects NaN or negative values', async () => {
    const defaults = parsePartnerPagination(new URLSearchParams());
    expect(defaults).toEqual({ ok: true, data: { limit: 50, offset: 0 } });

    const invalid = parsePartnerPagination(new URLSearchParams('limit=abc'));
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      const body = await invalid.response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(typeof body.error.message).toBe('string');
    }

    const negative = parsePartnerPagination(new URLSearchParams('offset=-1'));
    expect(negative.ok).toBe(false);
  });

  it('Zod failures use the partner error envelope, not a flat string', async () => {
    const parsed = safeParsePartnerJson({ items: [] }, partnerCreateTradeSchema);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      const body = await parsed.response.json();
      expect(body).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
        },
      });
    }
  });

  it('rejects duplicate asset ids because they would double-count value', () => {
    expect(
      partnerEstimateSchema.safeParse({ asset_ids: ['1', '1'] }).success
    ).toBe(false);
    expect(
      partnerCreateTradeSchema.safeParse({
        items: [{ asset_id: '1' }, { asset_id: '1' }],
        trade_url: 'https://steamcommunity.com/tradeoffer/new/?partner=1&token=AbCdEfGh',
      }).success
    ).toBe(false);
  });
});

describe('partner-api webhook URL and payout guards', () => {
  it('accepts a public HTTPS webhook and rejects SSRF targets', () => {
    expect(assertPublicHttpsWebhookUrl('https://partner.example.com/hooks').ok).toBe(true);
    expect(assertPublicHttpsWebhookUrl('http://partner.example.com/hooks').ok).toBe(false);
    expect(assertPublicHttpsWebhookUrl('https://localhost/hooks').ok).toBe(false);
    expect(assertPublicHttpsWebhookUrl('https://127.0.0.1/hooks').ok).toBe(false);
    expect(assertPublicHttpsWebhookUrl('https://169.254.169.254/latest/meta-data').ok).toBe(false);
    expect(assertPublicHttpsWebhookUrl('https://192.168.1.10/hooks').ok).toBe(false);
    expect(assertPublicHttpsWebhookUrl('https://10.0.0.8/hooks').ok).toBe(false);
    expect(assertPublicHttpsWebhookUrl('https://user:pass@example.com/hooks').ok).toBe(false);
    expect(assertPublicHttpsWebhookUrl('https://127.1/hooks').ok).toBe(false);
    expect(assertPublicHttpsWebhookUrl('https://2130706433/hooks').ok).toBe(false);
    expect(assertPublicHttpsWebhookUrl('https://[::1]/hooks').ok).toBe(false);
    expect(partnerWebhookConfigSchema.safeParse({ webhook_url: 'https://127.0.0.1/x' }).success).toBe(false);
  });

  it('refuses empty payment methods that would create unpaid SEPA stubs', () => {
    expect(isUsablePartnerPaymentMethod(null)).toBe(false);
    expect(isUsablePartnerPaymentMethod({ details: {} })).toBe(false);
    expect(isUsablePartnerPaymentMethod({ details: [] })).toBe(false);
    expect(isUsablePartnerPaymentMethod({ details: { iban: 'FR76' } })).toBe(true);
  });
});

describe('partner-api trade URL validation', () => {
  const steamId = '76561198012345678';
  const partner = '52079950';
  const token = 'AbCdEfGh';
  const tradeLink = `https://steamcommunity.com/tradeoffer/new/?partner=${partner}&token=${token}`;

  it('accepts matching trade URL and account link', () => {
    expect(validatePartnerTradeUrl(tradeLink, steamId, tradeLink)).toEqual({ ok: true });
  });

  it('rejects trade URL with wrong Steam account', () => {
    const wrongPartnerUrl = `https://steamcommunity.com/tradeoffer/new/?partner=99999999&token=${token}`;
    const result = validatePartnerTradeUrl(wrongPartnerUrl, steamId, tradeLink);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/Steam account/i);
    }
  });

  it('rejects trade URL with wrong token vs account link', () => {
    const wrongTokenUrl = `https://steamcommunity.com/tradeoffer/new/?partner=${partner}&token=WrongToken1`;
    const result = validatePartnerTradeUrl(wrongTokenUrl, steamId, tradeLink);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/trade link/i);
    }
  });
});

describe('partner-api account guards (quote prerequisites)', () => {
  const readyUser = {
    steamId: '76561198012345678',
    acceptedTermsAt: new Date('2026-01-01'),
    tradeLink: 'https://steamcommunity.com/tradeoffer/new/?partner=1&token=abc',
  };

  it('accepts a complete account', () => {
    expect(assertPartnerAccountReady(readyUser, { requireTradeLink: true })).toEqual({ ok: true });
  });

  it('rejects missing Steam, terms, or trade link', () => {
    expect(assertPartnerAccountReady({ ...readyUser, steamId: null }, { requireTradeLink: true }).ok).toBe(false);
    const terms = assertPartnerTermsAccepted({ acceptedTermsAt: null });
    expect(terms).toMatchObject({ ok: false, code: 'TERMS_REQUIRED', status: 403 });
    expect(
      assertPartnerAccountReady({ ...readyUser, tradeLink: null }, { requireTradeLink: true })
    ).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
  });

  it('maps failures to French self-service messages', () => {
    const terms = assertPartnerTermsAccepted({ acceptedTermsAt: null });
    if (terms.ok) throw new Error('expected failure');
    expect(partnerAccountGuardFrMessage(terms)).toMatch(/CGV/);
  });
});

describe('partner-api handler scope enforcement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards scopes as requiredScopes to requireApiKey', async () => {
    const logApiCall = jest.fn().mockResolvedValue(undefined);
    mockedRequireApiKey.mockResolvedValue({
      ok: true,
      ctx: {
        apiClientId: 'client-1',
        userId: 'user-1',
        scopes: ['read'],
        webhookSecret: 'secret',
      },
      logApiCall,
      startMs: Date.now(),
    });

    const request = new NextRequest('http://localhost/api/v1/partner/trades', { method: 'POST' });
    const handler = jest.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 201 }));

    await withPartnerApi(
      request,
      { endpoint: '/api/v1/partner/trades', method: 'POST', scopes: ['trade'] },
      handler
    );

    expect(mockedRequireApiKey).toHaveBeenCalledWith(request, {
      endpoint: '/api/v1/partner/trades',
      method: 'POST',
      requiredScopes: ['trade'],
    });
    expect(handler).toHaveBeenCalled();
    expect(logApiCall).toHaveBeenCalledWith(201, expect.any(Number));
  });

  it('returns auth error without calling handler when requireApiKey fails', async () => {
    mockedRequireApiKey.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ success: false }), { status: 403 }) as never,
    });

    const request = new NextRequest('http://localhost/api/v1/partner/payouts', { method: 'POST' });
    const handler = jest.fn();

    const response = await withPartnerApi(
      request,
      { endpoint: '/api/v1/partner/payouts', method: 'POST', scopes: ['payout'] },
      handler
    );

    expect(response.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it('logs known-client auth failures before returning', async () => {
    const logApiCall = jest.fn().mockResolvedValue(undefined);
    mockedRequireApiKey.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ success: false }), { status: 403 }) as never,
      logApiCall,
      startMs: 123,
    });

    const request = new NextRequest('http://localhost/api/v1/partner/trades', { method: 'POST' });
    const response = await withPartnerApi(
      request,
      { endpoint: '/api/v1/partner/trades', method: 'POST', scopes: ['trade'] },
      jest.fn()
    );

    expect(response.status).toBe(403);
    expect(logApiCall).toHaveBeenCalledWith(403, 123);
  });
});
