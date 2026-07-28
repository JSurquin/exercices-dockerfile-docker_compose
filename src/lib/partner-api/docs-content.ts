export const PARTNER_API_BASE_URL = 'https://api.moonskin.gg';

export const partnerCurlExamples = `# Authentification — toutes les routes partenaires
# Header requis : Authorization: Bearer msk_live_...

# Profil du compte lié
curl -s "${PARTNER_API_BASE_URL}/api/v1/partner/me" \\
  -H "Authorization: Bearer msk_live_VOTRE_CLE"

# Solde (centimes)
curl -s "${PARTNER_API_BASE_URL}/api/v1/partner/balance" \\
  -H "Authorization: Bearer msk_live_VOTRE_CLE"

# Inventaire CS2
curl -s "${PARTNER_API_BASE_URL}/api/v1/partner/inventory" \\
  -H "Authorization: Bearer msk_live_VOTRE_CLE"

# Estimation de prix
curl -s -X POST "${PARTNER_API_BASE_URL}/api/v1/partner/estimate" \\
  -H "Authorization: Bearer msk_live_VOTRE_CLE" \\
  -H "Content-Type: application/json" \\
  -d '{"asset_ids":["12345678901234567"]}'

# Créer une vente (scope trade requis)
curl -s -X POST "${PARTNER_API_BASE_URL}/api/v1/partner/trades" \\
  -H "Authorization: Bearer msk_live_VOTRE_CLE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "items":[{"asset_id":"12345678901234567"}],
    "trade_url":"https://steamcommunity.com/tradeoffer/new/?partner=123456789&token=AbCdEfGh"
  }'

# Liste des ventes
curl -s "${PARTNER_API_BASE_URL}/api/v1/partner/trades?limit=20&offset=0" \\
  -H "Authorization: Bearer msk_live_VOTRE_CLE"

# Détail d'une vente
curl -s "${PARTNER_API_BASE_URL}/api/v1/partner/trades/TRADE-123" \\
  -H "Authorization: Bearer msk_live_VOTRE_CLE"

# Demander un retrait (scope payout + KYC validé)
curl -s -X POST "${PARTNER_API_BASE_URL}/api/v1/partner/payouts" \\
  -H "Authorization: Bearer msk_live_VOTRE_CLE" \\
  -H "Content-Type: application/json" \\
  -d '{"trade_id":"TRADE-123"}'

# Configurer le webhook
curl -s -X PUT "${PARTNER_API_BASE_URL}/api/v1/partner/webhook" \\
  -H "Authorization: Bearer msk_live_VOTRE_CLE" \\
  -H "Content-Type: application/json" \\
  -d '{"webhook_url":"https://votre-serveur.com/webhooks/moonskin"}'`;

export const partnerWebhookGuide = `MoonSkin envoie des notifications POST vers l'URL HTTPS configurée via PUT /api/v1/partner/webhook.

En-têtes HTTP :
• Content-Type: application/json
• X-MoonSkin-Event-Id: identifiant unique de l'événement
• X-MoonSkin-Signature: t=<timestamp_unix>,v1=<hmac_sha256_hex>

Corps JSON (exemple vente) :
{
  "event_id": "trade.status_changed:TRADE-123:...",
  "type": "trade.status_changed",
  "resource_id": "TRADE-123",
  "statut": "en_trade_hold",
  "timestamp": "2026-07-13T12:00:00.000Z",
  "user_id": "cuid_utilisateur",
  "brut_centimes": 125000,
  "net_centimes": 120000,
  "frais": { "cashout": 625, "réseau": 4375 },
  "reference_paiement": "order-id-skinplace"
}

Types d'événements : trade.created, trade.status_changed, payout.created, payout.status_changed

Vérification de signature (Node.js) :
const crypto = require('crypto');
const header = req.headers['x-moonskin-signature']; // t=123,v1=abc...
const rawBody = req.rawBody; // corps brut non parsé
const match = header.match(/t=(\\d+),v1=([a-f0-9]+)/);
const timestamp = parseInt(match[1], 10);
const provided = match[2];
const expected = crypto.createHmac('sha256', WEBHOOK_SECRET)
  .update(\`\${timestamp}.\${rawBody}\`)
  .digest('hex');
if (expected !== provided) throw new Error('Signature invalide');
// Rejeter si |now - timestamp| > 300 secondes

Réponses attendues : HTTP 2xx pour confirmer la réception. En cas d'échec, MoonSkin retente jusqu'à 3 fois (1s, 5s, 15s).`;

export const partnerEndpointDetails = [
  {
    method: 'GET',
    path: '/api/v1/partner/me',
    scope: 'read',
    description: 'Profil du compte MoonSkin lié à la clé API.',
    response: '{ id, steam_id, steam_username, kyc_status, trade_link, account_frozen, ... }',
  },
  {
    method: 'GET',
    path: '/api/v1/partner/balance',
    scope: 'read',
    description: 'Soldes en centimes (disponible, gelé, en attente).',
    response: '{ balance_centimes, pending_centimes, frozen_centimes, available_centimes }',
  },
  {
    method: 'GET',
    path: '/api/v1/partner/inventory',
    scope: 'read',
    description: 'Inventaire CS2 du Steam ID lié.',
    response: '{ items: [{ asset_id, market_hash_name, prix_centimes, ... }] }',
  },
  {
    method: 'POST',
    path: '/api/v1/partner/estimate',
    scope: 'read',
    body: '{ "asset_ids": ["..."] }',
    description: 'Estimation brut, frais cashout (0,5 %), frais réseau et net.',
    response: '{ gross_centimes, frais: { cashout, réseau }, net_centimes, items }',
  },
  {
    method: 'POST',
    path: '/api/v1/partner/trades',
    scope: 'trade',
    body: '{ "items": [{ "asset_id": "..." }], "trade_url": "https://..." }',
    description: 'Crée une vente. Le trade_url doit correspondre au compte Steam lié.',
    response: '{ trade_id, ticket_id, statut, brut_centimes, net_centimes, disponible_le }',
  },
  {
    method: 'GET',
    path: '/api/v1/partner/trades',
    scope: 'read',
    query: '?limit=50&offset=0',
    description: 'Liste paginée des ventes du compte.',
    response: '{ trades: [...], pagination: { limit, offset, count } }',
  },
  {
    method: 'GET',
    path: '/api/v1/partner/trades/{id}',
    scope: 'read',
    description:
      'Détail complet d\'une vente avec items. À utiliser en complément des webhooks (secours si notification manquée ou reconnexion).',
    response:
      '{ id, statut, brut_centimes, frais, net_centimes, disponible_le, reference_paiement, items, ... }',
  },
  {
    method: 'POST',
    path: '/api/v1/partner/payouts',
    scope: 'payout',
    body: '{ "trade_id": "TRADE-..." }',
    description: 'Demande un retrait SEPA/crypto (KYC obligatoire, vente en statut disponible).',
    response: '{ id, statut, amount_centimes, reference_paiement }',
  },
  {
    method: 'PUT',
    path: '/api/v1/partner/webhook',
    scope: 'read',
    body: '{ "webhook_url": "https://..." }',
    description: 'Configure l\'URL de réception des webhooks (HTTPS obligatoire).',
    response: '{ webhook_url, message }',
  },
  {
    method: 'GET',
    path: '/api/v1/partner/webhook',
    scope: 'read',
    description: 'Consulte la configuration webhook active.',
    response: '{ webhook_url, signature_header, signature_format }',
  },
];

export const partnerPollingGuide = `Flux recommandé pour suivre une vente :
1. Configurer l'URL webhook (PUT /api/v1/partner/webhook)
2. Créer la vente (POST /api/v1/partner/trades) — conserver le trade_id retourné
3. Recevoir les notifications push à chaque changement de statut
4. En complément ou secours : interroger GET /api/v1/partner/trades/{id} avec ce trade_id

Le polling est utile si un webhook n'a pas été reçu (timeout réseau, maintenance côté partenaire) ou pour resynchroniser un état au redémarrage de votre serveur.`;

export const partnerScopesGuide = `Scopes disponibles par clé API :
• read — consultation (profil, solde, inventaire, estimation, liste ventes, webhook)
• trade — création de ventes (POST /trades)
• payout — demandes de retrait (POST /payouts)

Une clé « lecture seule » (scope read uniquement) ne peut pas créer de ventes ni de retraits. Réponse 403 si scope manquant.`;

export const partnerResponseExamples = {
  me: `{
  "success": true,
  "data": {
    "id": "clx123",
    "steam_id": "76561198012345678",
    "steam_username": "PlayerOne",
    "kyc_status": "APPROVED",
    "trade_link": "https://steamcommunity.com/tradeoffer/new/?partner=...",
    "account_frozen": false
  }
}`,
  estimate: `{
  "success": true,
  "data": {
    "gross_centimes": 125000,
    "frais": { "cashout": 625, "réseau": 4375 },
    "net_centimes": 120000,
    "items": [
      { "asset_id": "123", "market_hash_name": "AK-47 | Redline (FT)", "prix_centimes": 125000 }
    ]
  }
}`,
  webhook: `{
  "event_id": "trade.status_changed:TRADE-123:1720872000000:clxabc",
  "type": "trade.status_changed",
  "resource_id": "TRADE-123",
  "statut": "disponible",
  "timestamp": "2026-07-13T12:00:00.000Z",
  "user_id": "clx123",
  "brut_centimes": 125000,
  "net_centimes": 120000,
  "frais": { "cashout": 625, "réseau": 4375 },
  "reference_paiement": "order-abc"
}`,
  error: `{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Scopes requis manquants: trade"
  }
}`,
  tradeDetail: `{
  "success": true,
  "data": {
    "id": "TRADE-123",
    "user_id": "clx123",
    "statut": "en_trade_hold",
    "brut_centimes": 125000,
    "frais": { "cashout": 625, "réseau": 4375 },
    "net_centimes": 120000,
    "ticket_id": "TICK-20250728-0001",
    "reference_paiement": "TICK-20250728-0001",
    "disponible_le": "2026-08-04T12:00:00.000Z",
    "created_at": "2026-07-28T12:00:00.000Z",
    "items": [
      { "market_hash_name": "AK-47 | Redline (FT)", "prix_centimes": 125000 }
    ]
  }
}`,
};
