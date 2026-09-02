export const PARTNER_API_BASE_URL = 'https://www.moonskin.eu';

export const partnerApiConventionGuide = `All partner API responses follow a consistent English JSON convention:
• HTTP status codes: 200, 201, 400, 401, 403, 404, 409, 429, 502, 500
• Success envelope: { "success": true, "data": { ... } }
• Error envelope: { "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
• Monetary amounts use *_cents fields (integers, never floats)
• Status values use English snake_case (created, in_trade_hold, available, paid, failed, ...)
• Error codes are uppercase English identifiers (UNAUTHORIZED, KYC_REQUIRED, TERMS_REQUIRED, RATE_LIMITED, ...)`;

export const partnerCurlExamples = `# Authentication — all partner routes
# Required header: Authorization: Bearer msk_live_...

# Linked account profile
curl -s "${PARTNER_API_BASE_URL}/api/v1/partner/me" \\
  -H "Authorization: Bearer msk_live_YOUR_KEY"

# Balance (cents)
curl -s "${PARTNER_API_BASE_URL}/api/v1/partner/balance" \\
  -H "Authorization: Bearer msk_live_YOUR_KEY"

# CS2 inventory
curl -s "${PARTNER_API_BASE_URL}/api/v1/partner/inventory" \\
  -H "Authorization: Bearer msk_live_YOUR_KEY"

# Price estimate
curl -s -X POST "${PARTNER_API_BASE_URL}/api/v1/partner/estimate" \\
  -H "Authorization: Bearer msk_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"asset_ids":["12345678901234567"]}'

# Create a trade (trade scope required)
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

# Read active webhook config
curl -s "${PARTNER_API_BASE_URL}/api/v1/partner/webhook" \\
  -H "Authorization: Bearer msk_live_YOUR_KEY"`;

export const partnerWebhookGuide = `MoonSkin sends POST notifications to the HTTPS URL configured via PUT /api/v1/partner/webhook.

HTTP headers:
• Content-Type: application/json
• X-MoonSkin-Event-Id: unique event identifier
• X-MoonSkin-Signature: t=<unix_timestamp>,v1=<hmac_sha256_hex>

JSON body (trade example):
{
  "event_id": "trade.status_changed:TRADE-123:in_trade_hold:clxabc",
  "type": "trade.status_changed",
  "resource_id": "TRADE-123",
  "status": "in_trade_hold",
  "timestamp": "2026-07-13T12:00:00.000Z",
  "user_id": "user_cuid",
  "gross_cents": 125000,
  "net_cents": 120000,
  "fees": { "cashout": 625, "network": 4375 },
  "payment_reference": "order-id-skinplace"
}

Event types: trade.created, trade.status_changed, payout.created, payout.status_changed
event_id is deterministic (type + resource + status + API key) so the same status change is never delivered twice.

Signature verification (Node.js):
const crypto = require('crypto');
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
// Reject if |now - timestamp| > 300 seconds

Expected responses: HTTP 2xx to acknowledge receipt. On failure, MoonSkin retries up to 3 times (1s, 5s, 15s).`;

export const partnerEndpointDetails = [
  {
    method: 'GET',
    path: '/api/v1/partner/me',
    scope: 'read',
    description: 'MoonSkin account linked to the API key.',
    response: '{ id, steam_id, steam_username, kyc_status, trade_link, account_frozen, ... }',
  },
  {
    method: 'GET',
    path: '/api/v1/partner/balance',
    scope: 'read',
    description: 'Balances in cents (available, frozen, pending).',
    response: '{ balance_cents, pending_cents, frozen_cents, available_cents }',
  },
  {
    method: 'GET',
    path: '/api/v1/partner/inventory',
    scope: 'read',
    description:
      'Sellable CS2 items for the linked Steam ID (Skinplace-priced). Locked or unsellable Steam items are omitted.',
    response: '{ steam_id, items: [{ asset_id, market_hash_name, price_cents, ... }], total_items, total_value_cents }',
  },
  {
    method: 'POST',
    path: '/api/v1/partner/estimate',
    scope: 'read',
    body: '{ "asset_ids": ["..."] }',
    description: 'Estimate gross, VIP bonus and net. Sale cashout/network fees are 0; platform fees apply at payout.',
    response: '{ gross_cents, fees: { cashout, network }, net_cents, vip_bonus_cents, items }',
  },
  {
    method: 'POST',
    path: '/api/v1/partner/trades',
    scope: 'trade',
    body: '{ "items": [{ "asset_id": "..." }], "trade_url": "https://..." }',
    description: 'Creates a sale. trade_url must match the linked Steam account.',
    response: '{ id, trade_id, ticket_id, status, gross_cents, net_cents, available_at, payment_reference }',
  },
  {
    method: 'GET',
    path: '/api/v1/partner/trades',
    scope: 'read',
    query: '?limit=50&offset=0',
    description: 'Paginated list of the account trades.',
    response: '{ trades: [...], pagination: { limit, offset, total } }',
  },
  {
    method: 'GET',
    path: '/api/v1/partner/trades/{id}',
    scope: 'read',
    description:
      'Full trade detail including items. Use as a webhook fallback (missed notification or resync).',
    response:
      '{ id, status, gross_cents, fees, net_cents, available_at, payment_reference, items, ... }',
  },
  {
    method: 'POST',
    path: '/api/v1/partner/payouts',
    scope: 'payout',
    body: '{ "trade_id": "TRADE-..." }',
    description:
      'Request a SEPA/crypto payout (KYC required, trade must be available, a payout method must already be configured). Replaying the same trade_id returns the existing payout with already_exists: true.',
    response: '{ id, status, amount_cents, payment_reference }',
  },
  {
    method: 'PUT',
    path: '/api/v1/partner/webhook',
    scope: 'trade or payout',
    body: '{ "webhook_url": "https://..." }',
    description: 'Set the webhook receiver URL (public HTTPS only, private/local addresses rejected). Read-only keys cannot change it.',
    response: '{ webhook_url, message }',
  },
  {
    method: 'GET',
    path: '/api/v1/partner/webhook',
    scope: 'read',
    description: 'Read the active webhook configuration.',
    response: '{ webhook_url, signature_header, signature_format }',
  },
];

export const partnerPollingGuide = `Recommended flow to track a sale:
1. Configure the webhook URL (PUT /api/v1/partner/webhook)
2. Create the sale (POST /api/v1/partner/trades) — keep the returned id (also exposed as trade_id)
3. Receive push notifications on every status change
4. Fallback: poll GET /api/v1/partner/trades/{id} with that id

Polling is useful if a webhook was missed (network timeout, partner maintenance) or to resynchronize state after a restart.`;

export const partnerScopesGuide = `Available scopes per API key:
• read — lookup (profile, balance, inventory, estimate, trade list/detail, GET webhook)
• trade — create sales (POST /trades) and configure the webhook URL (PUT /webhook)
• payout — request payouts (POST /payouts) and configure the webhook URL (PUT /webhook)

A read-only key (read scope only) cannot create sales, request payouts, or change the webhook URL. HTTP 403 if a required scope is missing.`;

export const partnerResponseExamples = {
  me: `{
  "success": true,
  "data": {
    "id": "clx123",
    "steam_id": "76561198012345678",
    "steam_username": "PlayerOne",
    "kyc_status": "verified",
    "trade_link": "https://steamcommunity.com/tradeoffer/new/?partner=...",
    "account_frozen": false
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
  tradeDetail: `{
  "success": true,
  "data": {
    "id": "TRADE-123",
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
};

export const partnerErrorCodesGuide = `Standard partner API error codes:
• UNAUTHORIZED (401) — Missing, invalid or revoked API key
• FORBIDDEN (403) — Missing required scope, or a business rule blocked the call (e.g. monthly withdrawal limit)
• NOT_FOUND (404) — Account, trade or API key not found
• VALIDATION_ERROR (400) — Invalid JSON, missing fields, invalid trade URL, or the trade is not ready for payout
• RATE_LIMITED (429) — Quota exceeded (default 100 requests/minute per key, adjustable by admin)
• KYC_REQUIRED (403) — Payout blocked until KYC is approved
• TERMS_REQUIRED (403) — Terms of service have not been accepted on the linked MoonSkin account
• ACCOUNT_FROZEN (403) — The linked MoonSkin account is frozen
• ACCOUNT_BANNED (403) — The linked MoonSkin account is banned
• API_ERROR (502) — Upstream trade provider failed (inventory or sale creation)
• CONFIG_ERROR (500) — Server-side configuration issue
• INTERNAL_ERROR (500) — Unexpected server error

Error envelope:
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }

RATE_LIMITED may also include retry_after_seconds. KYC_REQUIRED may include requires_kyc: true.`;

export const partnerPrerequisitesGuide = `Before go-live (partner side):
• MoonSkin account with Steam linked and terms of service accepted
• KYC approved before any automated payout (sales can start earlier)
• Steam Trade Link saved on the account and matching the Steam ID used in POST /trades
• Public HTTPS webhook URL — localhost, private IPs and credentialed URLs are rejected. Provide a test receiver for recette.
• Rate limits: default 100 requests/minute per key (admin can set 10–1000). V1 scopes are read, trade, payout only.
• Technical contact for recette: api-support@moonskin.gg or Telegram via the MoonSkin team`;
