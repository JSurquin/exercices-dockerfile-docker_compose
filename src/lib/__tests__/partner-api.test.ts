import { createHmac } from 'crypto';
import {
  hashApiKey,
  generateApiKey,
  generateWebhookSecret,
} from '@/lib/partner-api/key-service';
import { verifyWebhookSignature } from '@/lib/partner-api/webhook-service';
import { mapTradeStatus } from '@/lib/partner-api/response';

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
});

describe('partner-api response', () => {
  it('mapTradeStatus maps DB enums to French slugs', () => {
    expect(mapTradeStatus('CREATED')).toBe('créé');
    expect(mapTradeStatus('IN_TRADE_HOLD')).toBe('en_trade_hold');
    expect(mapTradeStatus('PAID')).toBe('payé');
  });
});
