import {
  formatPartnerErrorCodesGuide,
  formatPartnerPrerequisitesGuide,
  formatPartnerWebhookProse,
  type PartnerEndpointId,
} from '@/lib/partner-api/docs-i18n';

export const PARTNER_API_BASE_URL = 'https://www.moonskin.eu';

export type PartnerEndpointCatalogItem = {
  id: PartnerEndpointId;
  method: 'GET' | 'POST' | 'PUT';
  path: string;
  scope: string;
  rateLimit: string;
  body?: string;
  query?: string;
};

export const partnerEndpointCatalog: PartnerEndpointCatalogItem[] = [
  { id: 'me', method: 'GET', path: '/api/v1/partner/me', scope: 'read', rateLimit: '100/min' },
  { id: 'balance', method: 'GET', path: '/api/v1/partner/balance', scope: 'read', rateLimit: '100/min' },
  { id: 'inventory', method: 'GET', path: '/api/v1/partner/inventory', scope: 'read', rateLimit: '100/min' },
  {
    id: 'estimate',
    method: 'POST',
    path: '/api/v1/partner/estimate',
    scope: 'read',
    rateLimit: '100/min',
    body: '{ "asset_ids": ["12345678901234567"] }',
  },
  {
    id: 'createTrade',
    method: 'POST',
    path: '/api/v1/partner/trades',
    scope: 'trade',
    rateLimit: '100/min',
    body: '{ "items": [{ "asset_id": "12345678901234567" }], "trade_url": "https://steamcommunity.com/tradeoffer/new/?partner=123456789&token=AbCdEfGh" }',
  },
  {
    id: 'listTrades',
    method: 'GET',
    path: '/api/v1/partner/trades',
    scope: 'read',
    rateLimit: '100/min',
    query: '?limit=20&offset=0',
  },
  { id: 'getTrade', method: 'GET', path: '/api/v1/partner/trades/{id}', scope: 'read', rateLimit: '100/min' },
  {
    id: 'payouts',
    method: 'POST',
    path: '/api/v1/partner/payouts',
    scope: 'payout',
    rateLimit: '100/min',
    body: '{ "trade_id": "TRADE-123" }',
  },
  {
    id: 'putWebhook',
    method: 'PUT',
    path: '/api/v1/partner/webhook',
    scope: 'trade or payout',
    rateLimit: '10/min',
    body: '{ "webhook_url": "https://your-server.com/webhooks/moonskin" }',
  },
  { id: 'getWebhook', method: 'GET', path: '/api/v1/partner/webhook', scope: 'read', rateLimit: '100/min' },
];

export function buildPartnerEndpointCurl(endpoint: PartnerEndpointCatalogItem): string {
  const path = endpoint.path.replace('{id}', 'TRADE-123');
  const url = `${PARTNER_API_BASE_URL}${path}${endpoint.query ?? ''}`;
  const lines = [
    endpoint.method === 'GET' ? `curl -s "${url}" \\` : `curl -s -X ${endpoint.method} "${url}" \\`,
    '  -H "Authorization: Bearer msk_live_YOUR_KEY"',
  ];
  if (endpoint.body) {
    lines[lines.length - 1] += ' \\';
    lines.push('  -H "Content-Type: application/json" \\');
    lines.push(`  -d '${endpoint.body}'`);
  }
  return lines.join('\n');
}

export const partnerCurlExamples = partnerEndpointCatalog
  .map((endpoint) => `# ${endpoint.method} ${endpoint.path}\n${buildPartnerEndpointCurl(endpoint)}`)
  .join('\n\n');

export const partnerWebhookSignatureExample = `const crypto = require('crypto');
const header = req.headers['x-moonskin-signature']; // t=123,v1=abc...
const rawBody = req.rawBody; // raw unparsed body
const match = header.match(/t=(\\d+),v1=([a-f0-9]+)/);
const timestamp = parseInt(match[1], 10);
const provided = match[2];
const expected = crypto.createHmac('sha256', WEBHOOK_SECRET)
  .update(\`\${timestamp}.\${rawBody}\`)
  .digest('hex');
if (expected.length !== provided.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided))) {
  throw new Error('Invalid signature');
}
// Reject if |now - timestamp| > 300 seconds`;

export const partnerResponseExamples = {
  me: `{
  "success": true,
  "data": {
    "id": "clx123",
    "steam_id": "76561198012345678",
    "steam_username": "PlayerOne",
    "kyc_status": "verified",
    "accepted_terms_at": "2026-01-15T17:28:52.851Z",
    "trade_link": "https://steamcommunity.com/tradeoffer/new/?partner=...&token=...",
    "user_tag": "MERCHANT",
    "account_frozen": false,
    "created_at": "2026-01-15T17:28:52.737Z"
  }
}`,
  estimate: `{
  "success": true,
  "data": {
    "gross_cents": 125000,
    "fees": { "cashout": 0, "network": 0 },
    "net_cents": 126250,
    "vip_bonus_cents": 1250,
    "items": [
      { "asset_id": "123", "market_hash_name": "AK-47 | Redline (FT)", "price_cents": 125000 }
    ]
  }
}`,
  tradeDetail: `{
  "success": true,
  "data": {
    "id": "TRADE-123",
    "trade_id": "TRADE-123",
    "user_id": "clx123",
    "status": "in_trade_hold",
    "gross_cents": 125000,
    "fees": { "cashout": 625, "network": 4375 },
    "net_cents": 120000,
    "ticket_id": "TICK-20250728-0001",
    "payment_reference": "TICK-20250728-0001",
    "available_at": "2026-08-04T12:00:00.000Z",
    "created_at": "2026-07-28T12:00:00.000Z",
    "items": [
      { "market_hash_name": "AK-47 | Redline (FT)", "price_cents": 125000 }
    ]
  }
}`,
  payout: `{
  "success": true,
  "data": {
    "id": "payout_01",
    "status": "pending",
    "amount_cents": 120000,
    "trade_id": "TRADE-123",
    "payment_method": { "type": "sepa", "verified": true },
    "payment_reference": "payout_01"
  }
}`,
  webhook: `{
  "event_id": "trade.status_changed:TRADE-123:available:clxabc",
  "type": "trade.status_changed",
  "resource_id": "TRADE-123",
  "status": "available",
  "timestamp": "2026-07-13T12:00:00.000Z",
  "user_id": "clx123",
  "gross_cents": 125000,
  "net_cents": 120000,
  "fees": { "cashout": 625, "network": 4375 },
  "payment_reference": "order-abc"
}`,
  error: `{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Missing required scopes: trade"
  }
}`,
  balance: `{
  "success": true,
  "data": {
    "balance_cents": 150000,
    "pending_cents": 12000,
    "frozen_cents": 5000,
    "available_cents": 145000,
    "account_frozen": false
  }
}`,
  inventory: `{
  "success": true,
  "data": {
    "steam_id": "76561198012345678",
    "items": [
      { "asset_id": "12345678901234567", "market_hash_name": "AK-47 | Redline (FT)", "price_cents": 125000, "icon_url": null, "exterior": "Field-Tested", "stat_trak": false, "rarity": "Classified" }
    ],
    "total_items": 1,
    "total_value_cents": 125000
  }
}`,
  createTrade: `{
  "success": true,
  "data": {
    "id": "TRADE-123",
    "trade_id": "TRADE-123",
    "ticket_id": "TICK-20250728-0001",
    "status": "created",
    "gross_cents": 125000,
    "net_cents": 126250,
    "fees": { "cashout": 0, "network": 0 },
    "vip_bonus_cents": 1250,
    "expires_at": "2026-07-28T13:00:00.000Z",
    "available_at": null,
    "payment_reference": "TICK-20250728-0001"
  }
}`,
  listTrades: `{
  "success": true,
  "data": {
    "trades": [
      {
        "id": "TRADE-123",
        "trade_id": "TRADE-123",
        "status": "in_trade_hold",
        "gross_cents": 125000,
        "net_cents": 120000,
        "payment_reference": "TICK-20250728-0001"
      }
    ],
    "pagination": { "limit": 20, "offset": 0, "total": 1 }
  }
}`,
  putWebhook: `{
  "success": true,
  "data": {
    "webhook_url": "https://your-server.com/webhooks/moonskin",
    "message": "Webhook URL configured"
  }
}`,
  getWebhook: `{
  "success": true,
  "data": {
    "webhook_url": "https://your-server.com/webhooks/moonskin",
    "signature_header": "X-MoonSkin-Signature",
    "signature_format": "t=<unix_timestamp>,v1=<hmac_sha256_hex>",
    "note": "The signing secret is available in Settings → Developer. It is not returned by this endpoint."
  }
}`,
};

export const partnerEndpointResponseExamples: Record<PartnerEndpointId, string> = {
  me: partnerResponseExamples.me,
  balance: partnerResponseExamples.balance,
  inventory: partnerResponseExamples.inventory,
  estimate: partnerResponseExamples.estimate,
  createTrade: partnerResponseExamples.createTrade,
  listTrades: partnerResponseExamples.listTrades,
  getTrade: partnerResponseExamples.tradeDetail,
  payouts: partnerResponseExamples.payout,
  putWebhook: partnerResponseExamples.putWebhook,
  getWebhook: partnerResponseExamples.getWebhook,
};

export const partnerWebhookGuide = `${formatPartnerWebhookProse('en')}

JSON body (trade example):
${partnerResponseExamples.webhook}

Signature verification (Node.js):
${partnerWebhookSignatureExample}`;

export const partnerErrorCodesGuide = formatPartnerErrorCodesGuide('en');

export const partnerPrerequisitesGuide = formatPartnerPrerequisitesGuide('en');

