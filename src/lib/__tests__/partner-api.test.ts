import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';
import {
  hashApiKey,
  generateApiKey,
  generateWebhookSecret,
} from '@/lib/partner-api/key-service';
import { verifyWebhookSignature } from '@/lib/partner-api/webhook-service';
import { mapPayoutStatus, mapTradeStatus } from '@/lib/partner-api/response';
import { validatePartnerTradeUrl } from '@/lib/partner-api/trade-url-validation';
import { withPartnerApi } from '@/lib/partner-api/handler';
import { requireApiKey } from '@/lib/partner-api/auth';

jest.mock('@/lib/partner-api/auth', () => ({
  requireApiKey: jest.fn(),
}));

const mockedRequireApiKey = requireApiKey as jest.MockedFunction<typeof requireApiKey>;

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
});

describe('partner-api response', () => {
  it('mapTradeStatus maps DB enums to French slugs', () => {
    expect(mapTradeStatus('CREATED')).toBe('créé');
    expect(mapTradeStatus('IN_TRADE_HOLD')).toBe('en_trade_hold');
    expect(mapTradeStatus('PAID')).toBe('payé');
  });

  it('mapPayoutStatus maps DB enums to French slugs', () => {
    expect(mapPayoutStatus('PENDING')).toBe('en_attente');
    expect(mapPayoutStatus('VERIFICATION_REQUIRED')).toBe('vérification_requise');
    expect(mapPayoutStatus('PAID')).toBe('payé');
    expect(mapPayoutStatus('WHITEPAY_COMPLETE')).toBe('payé');
    expect(mapPayoutStatus('FAILED')).toBe('échoué');
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
      expect(result.error).toContain('Steam lié');
    }
  });

  it('rejects trade URL with wrong token vs account link', () => {
    const wrongTokenUrl = `https://steamcommunity.com/tradeoffer/new/?partner=${partner}&token=WrongToken1`;
    const result = validatePartnerTradeUrl(wrongTokenUrl, steamId, tradeLink);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('trade link enregistré');
    }
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
});
