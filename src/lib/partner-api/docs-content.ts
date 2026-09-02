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

export const partnerCurlExamples = `# All partner routes require:
# Authorization: Bearer msk_live_...

# Profile
curl -s "${PARTNER_API_BASE_URL}/api/v1/partner/me" \\
  -H "Authorization: Bearer msk_live_YOUR_KEY"

# Balance (cents)
curl -s "${PARTNER_API_BASE_URL}/api/v1/partner/balance" \\
  -H "Authorization: Bearer msk_live_YOUR_KEY"

# Sellable CS2 inventory
curl -s "${PARTNER_API_BASE_URL}/api/v1/partner/inventory" \\
  -H "Authorization: Bearer msk_live_YOUR_KEY"

# Price estimate
curl -s -X POST "${PARTNER_API_BASE_URL}/api/v1/partner/estimate" \\
  -H "Authorization: Bearer msk_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"asset_ids":["12345678901234567"]}'

# Create a sale (trade scope)
curl -s -X POST "${PARTNER_API_BASE_URL}/api/v1/partner/trades" \\
  -H "Authorization: Bearer msk_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "items":[{"asset_id":"12345678901234567"}],
    "trade_url":"https://steamcommunity.com/tradeoffer/new/?partner=123456789&token=AbCdEfGh"
  }'

# List trades
curl -s "${PARTNER_API_BASE_URL}/api/v1/partner/trades?limit=20&offset=0" \\
  -H "Authorization: Bearer msk_live_YOUR_KEY"

# Trade detail
curl -s "${PARTNER_API_BASE_URL}/api/v1/partner/trades/TRADE-123" \\
  -H "Authorization: Bearer msk_live_YOUR_KEY"

# Request a payout (payout scope + approved KYC)
curl -s -X POST "${PARTNER_API_BASE_URL}/api/v1/partner/payouts" \\
  -H "Authorization: Bearer msk_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"trade_id":"TRADE-123"}'

# Configure webhook
curl -s -X PUT "${PARTNER_API_BASE_URL}/api/v1/partner/webhook" \\
  -H "Authorization: Bearer msk_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"webhook_url":"https://your-server.com/webhooks/moonskin"}'

# Read active webhook
curl -s "${PARTNER_API_BASE_URL}/api/v1/partner/webhook" \\
  -H "Authorization: Bearer msk_live_YOUR_KEY"`;

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
};

export const partnerWebhookGuide = `${formatPartnerWebhookProse('en')}

JSON body (trade example):
${partnerResponseExamples.webhook}

Signature verification (Node.js):
${partnerWebhookSignatureExample}`;

export const partnerErrorCodesGuide = formatPartnerErrorCodesGuide('en');

export const partnerPrerequisitesGuide = formatPartnerPrerequisitesGuide('en');

