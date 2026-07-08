import { NextRequest } from 'next/server';
import {
  buildWebhookAuditBase,
  extractFlexifyWebhookMeta,
  extractWhitepayWebhookMeta,
  logIntegrationWebhookCall,
} from '@/lib/integration-webhook-audit';

jest.mock('~/prisma/prisma', () => ({
  prisma: {
    auditLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/security/audit-helpers', () => ({
  getClientIP: jest.fn(() => '203.0.113.10'),
}));

import { prisma } from '~/prisma/prisma';

const auditLogCreate = prisma.auditLog.create as jest.Mock;

function makeRequest(url = 'https://www.moonskin.eu/api/whitepay/webhook'): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: {
      'user-agent': 'Whitepay-Webhook/1.0',
      'x-forwarded-for': '203.0.113.10',
    },
  });
}

describe('extractWhitepayWebhookMeta', () => {
  it('extracts withdrawal event fields from payload', () => {
    expect(
      extractWhitepayWebhookMeta({
        event_type: 'conversion_withdrawal::completed',
        transaction: {
          id: 'tx-123',
          external_id: 'order-456',
          status: 'COMPLETE',
          hash: '0xabc',
        },
      })
    ).toEqual({
      eventType: 'conversion_withdrawal::completed',
      transactionId: 'tx-123',
      externalId: 'order-456',
      whitepayStatus: 'COMPLETE',
      txHash: '0xabc',
    });
  });

  it('returns empty object for invalid payload', () => {
    expect(extractWhitepayWebhookMeta(null)).toEqual({});
  });
});

describe('extractFlexifyWebhookMeta', () => {
  it('extracts payout webhook fields from payload', () => {
    expect(
      extractFlexifyWebhookMeta({
        identifier: 'PT000000000000K',
        reference: 'MOON-REF-1',
        status: 'completed',
        type: 'payout',
        method: 'sepa',
        amount: '42.50',
        currency: 'EUR',
        error_code: 0,
        error_reason: '',
      })
    ).toEqual({
      reference: 'MOON-REF-1',
      transactionId: 'PT000000000000K',
      flexifyStatus: 'completed',
      eventType: 'payout',
      method: 'sepa',
      amount: '42.50',
      currency: 'EUR',
    });
  });
});

describe('buildWebhookAuditBase', () => {
  it('captures body length, signature flag and user agent', () => {
    expect(buildWebhookAuditBase(makeRequest(), '{"a":1}', true)).toEqual({
      bodyLength: 7,
      signaturePresent: true,
      userAgent: 'Whitepay-Webhook/1.0',
    });
  });
});

describe('logIntegrationWebhookCall', () => {
  beforeEach(() => {
    auditLogCreate.mockReset();
    auditLogCreate.mockResolvedValue({ id: 'log-1' });
  });

  it('persists a complete audit row for whitepay', async () => {
    await logIntegrationWebhookCall(
      'whitepay',
      makeRequest(),
      {
        outcome: 'processed',
        httpStatus: 200,
        eventType: 'conversion_withdrawal::completed',
        transactionId: 'tx-123',
        externalId: 'order-456',
        payoutId: 'payout-1',
        webhookId: 'wp_tx-123_COMPLETE',
        whitepayStatus: 'COMPLETE',
        internalStatus: 'WHITEPAY_COMPLETE',
        txHash: '0xabc',
        bodyLength: 120,
        signaturePresent: true,
        userAgent: 'Whitepay-Webhook/1.0',
      },
      'user-1'
    );

    expect(auditLogCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        action: 'webhook.whitepay.call',
        ipAddress: '203.0.113.10',
        details: expect.objectContaining({
          provider: 'whitepay',
          endpoint: '/api/whitepay/webhook',
          method: 'POST',
          outcome: 'processed',
          httpStatus: 200,
          severity: 'low',
          eventType: 'conversion_withdrawal::completed',
          transactionId: 'tx-123',
          externalId: 'order-456',
          payoutId: 'payout-1',
          webhookId: 'wp_tx-123_COMPLETE',
          whitepayStatus: 'COMPLETE',
          internalStatus: 'WHITEPAY_COMPLETE',
          txHash: '0xabc',
        }),
      },
    });
  });

  it('uses system user and high severity for invalid signature', async () => {
    await logIntegrationWebhookCall('flexify', makeRequest('https://www.moonskin.eu/api/flexify/webhook'), {
      outcome: 'invalid_signature',
      httpStatus: 401,
      signaturePresent: false,
      digestPresent: true,
      dateHeaderPresent: true,
      bodyLength: 10,
    });

    expect(auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'system',
        action: 'webhook.flexify.call',
        details: expect.objectContaining({
          outcome: 'invalid_signature',
          httpStatus: 401,
          severity: 'high',
          digestPresent: true,
          dateHeaderPresent: true,
        }),
      }),
    });
  });

  it('does not throw when prisma fails', async () => {
    auditLogCreate.mockRejectedValue(new Error('db down'));

    await expect(
      logIntegrationWebhookCall('whitepay', makeRequest(), {
        outcome: 'error',
        httpStatus: 500,
        errorMessage: 'boom',
      })
    ).resolves.toBeUndefined();
  });
});
