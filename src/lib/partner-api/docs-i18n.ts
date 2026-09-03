import { PARTNER_ERROR_CODE_LIST, type PartnerErrorCode } from '@/lib/partner-api/response';

export type PartnerDocsLocale = 'fr' | 'en' | 'cn';

export type PartnerEndpointId =
  | 'me'
  | 'balance'
  | 'inventory'
  | 'estimate'
  | 'createTrade'
  | 'listTrades'
  | 'getTrade'
  | 'listPayouts'
  | 'payouts'
  | 'putWebhook'
  | 'getWebhook';

export type PartnerDocsCopy = {
  conventionItems: string[];
  scopesItems: string[];
  scopesReadOnly: string;
  prerequisitesItems: string[];
  flowItems: string[];
  webhookIntro: string;
  webhookHeaders: string[];
  webhookEvents: string;
  webhookIdempotence: string;
  webhookRetries: string;
  webhookSecretHint: string;
  errorIntro: string;
  errorCodes: Record<PartnerErrorCode, string>;
  errorEnvelope: string;
  errorExtras: string;
  endpoints: Record<
    PartnerEndpointId,
    {
      description: string;
      response: string;
    }
  >;
};

const errorEnvelope = '{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }';

const fr: PartnerDocsCopy = {
  conventionItems: [
    'Réponses JSON en anglais uniquement.',
    'Succès : { "success": true, "data": { ... } }',
    'Erreur : { "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }',
    'Montants en centimes entiers (*_cents), jamais de flottants.',
    'Statuts en snake_case anglais : created, accepted_by_bot, in_trade_hold, available, payout_pending, paid, failed, cancelled.',
    'Codes d’erreur en MAJUSCULES : UNAUTHORIZED, KYC_REQUIRED, RATE_LIMITED, …',
    'HTTP : 200, 201 (création de vente), 400, 401, 403, 404, 409, 429, 503, 500.',
  ],
  scopesItems: [
    'read — profil, solde, inventaire, estimation, liste et détail des ventes, liste des retraits, lecture du webhook.',
    'trade — créer une vente (POST /trades) et configurer le webhook (PUT /webhook).',
    'payout — demander un retrait (POST /payouts) et configurer le webhook (PUT /webhook).',
  ],
  scopesReadOnly:
    'Une clé read seule ne peut ni vendre, ni retirer, ni changer le webhook. Réponse HTTP 403 si un scope manque.',
  prerequisitesItems: [
    'Compte MoonSkin avec Steam lié et conditions d’utilisation acceptées.',
    'Trade Link : passez trade_url à chaque appel (inventaire, estimation, vente). Inutile de le changer dans Paramètres. Un Trade Link enregistré sert seulement de défaut si trade_url est omis.',
    'KYC validé avant tout retrait automatique. Les ventes peuvent commencer avant le KYC.',
    'Un moyen de paiement SEPA ou crypto déjà configuré dans le dashboard avant POST /payouts.',
    'URL webhook HTTPS publique (localhost, IP privées et URLs avec identifiants refusés).',
    'Limite par défaut : 100 requêtes / minute / clé (l’admin peut régler 10–1000).',
    'Contact technique : contact@moonskin.fun',
  ],
  flowItems: [
    'Configurer le webhook : PUT /api/v1/partner/webhook',
    'Inventaire : GET /api/v1/partner/inventory?trade_url=… (URL encodée). Même trade_url pour estimer puis vendre.',
    'Estimer : POST /api/v1/partner/estimate avec asset_ids et trade_url.',
    'Créer la vente : POST /api/v1/partner/trades avec items (price_cents optionnel pour figer le devis) et le même trade_url — conserver l’id renvoyé.',
    'Recevoir un POST à chaque changement de statut (trade.* et payout.*).',
    'Secours : interroger GET /api/v1/partner/trades/{id} ou GET /api/v1/partner/payouts si un webhook a été manqué.',
  ],
  webhookIntro:
    'MoonSkin envoie un POST JSON vers l’URL HTTPS configurée. Le secret de signature est visible dans Paramètres → Développeur (et sur la fiche admin).',
  webhookHeaders: [
    'Content-Type: application/json',
    'X-MoonSkin-Event-Id : identifiant unique de l’événement',
    'X-MoonSkin-Signature : t=<timestamp_unix>,v1=<hmac_sha256_hex>',
  ],
  webhookEvents: 'Types : trade.created, trade.status_changed, payout.created, payout.status_changed.',
  webhookIdempotence:
    'event_id est déterministe (type + ressource + statut + clé API) : le même changement n’est jamais livré deux fois.',
  webhookRetries:
    'Répondez HTTP 2xx pour accuser réception. En cas d’échec, MoonSkin réessaie jusqu’à 3 fois (1s, 5s, 15s). Rejetez une signature dont |now − t| > 300 secondes.',
  webhookSecretHint:
    'Le secret n’est pas renvoyé par GET /webhook. Récupérez-le dans Paramètres → Développeur.',
  errorIntro: 'Codes d’erreur standard de l’API partenaires :',
  errorCodes: {
    UNAUTHORIZED: 'Clé API absente, invalide ou révoquée (401).',
    FORBIDDEN: 'Scope manquant, ou règle métier (ex. plafond de retrait mensuel) (403).',
    NOT_FOUND: 'Compte, vente ou clé introuvable (404).',
    VALIDATION_ERROR:
      'JSON invalide, champs manquants, Trade URL invalide, prix coté obsolète (price_cents), trade pas prêt pour le payout, ou solde insuffisant (400 / 409).',
    RATE_LIMITED: 'Quota dépassé, 100 req/min par défaut. Peut inclure retry_after_seconds (429).',
    KYC_REQUIRED: 'Retrait bloqué tant que le KYC n’est pas validé. Peut inclure requires_kyc: true (403).',
    TERMS_REQUIRED: 'CGU non acceptées sur le compte lié (403).',
    ACCOUNT_FROZEN: 'Compte MoonSkin gelé (403).',
    ACCOUNT_BANNED: 'Compte MoonSkin banni (403).',
    API_ERROR:
      'Le prestataire de trade (inventaire / création de vente) a échoué (503). Peut inclure provider_status et provider_error.',
    CONFIG_ERROR: 'Problème de configuration serveur (500).',
    INTERNAL_ERROR: 'Erreur serveur inattendue (500).',
  },
  errorEnvelope,
  errorExtras:
    'RATE_LIMITED peut inclure retry_after_seconds. KYC_REQUIRED peut inclure requires_kyc: true. API_ERROR peut inclure provider_status et provider_error.',
  endpoints: {
    me: {
      description: 'Compte MoonSkin lié à la clé : Steam, KYC, Trade Link, gel du compte, taux de bonus merchant/VIP.',
      response:
        '{ id, steam_id, steam_username, kyc_status, accepted_terms_at, trade_link, user_tag, bonus_rate_percent, account_frozen, created_at }',
    },
    balance: {
      description: 'Soldes en centimes : total, en attente, gelé, disponible.',
      response: '{ balance_cents, pending_cents, frozen_cents, available_cents, account_frozen }',
    },
    inventory: {
      description:
        'Skins CS2 rachetables (même source que la page Vendre). Passez ?trade_url= (URL encodée) pour viser un compte Steam sans passer par Paramètres ; sinon le Trade Link enregistré est utilisé. Les items lockés / non rachetables sont omis. Un tableau vide avec success: true signifie « rien à vendre », pas une erreur. Prix source en USD. ?currency=USD|EUR|CNY (défaut USD) convertit les cents à chaque requête. price_cents = prix regular (tarif public). merchant_price_cents = regular + bonus du compte lié (bonus_rate_percent). Sans bonus les deux sont égaux. Pour figer un devis sur POST /trades, passez price_cents (pas merchant_price_cents).',
      response:
        '{ steam_id, currency, bonus_rate_percent, items: [{ asset_id, market_hash_name, price_cents, merchant_price_cents, icon_url, exterior, stat_trak, rarity }], total_items, total_value_cents, total_merchant_value_cents }',
    },
    estimate: {
      description:
        'Estimation brut, bonus merchant/VIP et net. trade_url optionnel : même lien que pour l’inventaire / la vente. currency optionnel (USD, EUR, CNY ; défaut USD), même unité que GET /inventory. Les frais cashout/réseau de la vente sont 0 ; les frais plateforme s’appliquent au payout. 1 à 50 asset_id, sans doublon. Sur chaque item : price_cents (regular) et merchant_price_cents (regular + bonus). vip_bonus_cents est le bonus arrondi sur le total (c’est ce qui est crédité). bonus_rate_percent est le taux du compte.',
      response:
        '{ gross_cents, fees: { cashout, network }, net_cents, vip_bonus_cents, bonus_rate_percent, currency, items: [{ asset_id, market_hash_name, price_cents, merchant_price_cents }] }',
    },
    createTrade: {
      description:
        'Crée une vraie vente Steam : le bot MoonSkin envoie une offre d’échange. trade_url (obligatoire) est le Trade Link du compte Steam visé, à la volée — pas besoin de l’enregistrer sur le site. Scope trade requis. Réponse HTTP 201. Minimum 100 centimes. price_cents optionnel (par item et/ou total) pour refuser la vente si le prix a changé depuis le chargement de l’inventaire : VALIDATION_ERROR 409 avec expected_price_cents et actual_price_cents. Passez currency (USD, EUR, CNY) si le devis vient de GET /inventory?currency=… — les montants renvoyés à la création restent en USD. steam_trade_offer_id (nullable) est l’identifiant Steam de l’offre : ouvrez https://steamcommunity.com/tradeoffer/{id}. S’il est null à la création, il est renseigné ensuite sur GET /trades/{id} et les webhooks trade.*',
      response:
        '{ id, trade_id, ticket_id, status, gross_cents, net_cents, fees, vip_bonus_cents, expires_at, available_at, payment_reference, steam_trade_offer_id }',
    },
    listTrades: {
      description: 'Liste paginée des ventes du compte (plus récentes d’abord).',
      response: '{ trades: [...], pagination: { limit, offset, total } }',
    },
    getTrade: {
      description: 'Détail complet d’une vente, y compris les items. À utiliser en secours si un webhook a été manqué.',
      response:
        '{ id, trade_id, status, gross_cents, fees, net_cents, ticket_id, steam_id, trade_link, steam_trade_offer_id, available_at, payment_reference, items, ... }',
    },
    listPayouts: {
      description:
        'Liste paginée des retraits du compte lié à la clé (GET /payouts, plus récents d’abord), y compris ceux demandés via l’API. Scope read. Même pagination que GET /trades (limit, offset).',
      response: '{ payouts: [...], pagination: { limit, offset, total } }',
    },
    payouts: {
      description:
        'Demande un retrait SEPA/crypto pour une vente au statut available. KYC validé et moyen de paiement déjà configuré. Rejouer le même trade_id renvoie le payout existant avec already_exists: true.',
      response:
        '{ id, status, amount_cents, trade_id, payment_method: { type, verified }, payment_reference, created_at, paid_at, already_exists? }',
    },
    putWebhook: {
      description:
        'Enregistre l’URL de notification (HTTPS public uniquement). Scope trade ou payout. Une clé read seule ne peut pas la changer.',
      response: '{ webhook_url, message }',
    },
    getWebhook: {
      description: 'Lit la configuration webhook active (sans le secret de signature).',
      response: '{ webhook_url, signature_header, signature_format, note }',
    },
  },
};

const en: PartnerDocsCopy = {
  conventionItems: [
    'JSON responses are English-only.',
    'Success: { "success": true, "data": { ... } }',
    'Error: { "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }',
    'Amounts are integer cents (*_cents), never floats.',
    'Statuses use English snake_case: created, accepted_by_bot, in_trade_hold, available, payout_pending, paid, failed, cancelled.',
    'Error codes are uppercase: UNAUTHORIZED, KYC_REQUIRED, RATE_LIMITED, …',
    'HTTP: 200, 201 (sale created), 400, 401, 403, 404, 409, 429, 503, 500.',
  ],
  scopesItems: [
    'read — profile, balance, inventory, estimate, trade list/detail, payout list, GET webhook.',
    'trade — create a sale (POST /trades) and set the webhook URL (PUT /webhook).',
    'payout — request a payout (POST /payouts) and set the webhook URL (PUT /webhook).',
  ],
  scopesReadOnly:
    'A read-only key cannot create sales, request payouts, or change the webhook URL. HTTP 403 if a required scope is missing.',
  prerequisitesItems: [
    'MoonSkin account with Steam linked and terms of service accepted.',
    'Pass trade_url on each call (inventory, estimate, sale). You do not need to change it in Settings. A saved Trade Link is only the default when trade_url is omitted.',
    'KYC approved before any automated payout. Sales can start earlier.',
    'A SEPA or crypto payout method already configured in the dashboard before POST /payouts.',
    'Public HTTPS webhook URL (localhost, private IPs and credentialed URLs are rejected).',
    'Default rate limit: 100 requests / minute / key (admin can set 10–1000).',
    'Technical contact: contact@moonskin.fun',
  ],
  flowItems: [
    'Configure the webhook: PUT /api/v1/partner/webhook',
    'Inventory: GET /api/v1/partner/inventory?trade_url=… (URL-encoded). Reuse the same trade_url to estimate then sell.',
    'Estimate: POST /api/v1/partner/estimate with asset_ids and trade_url.',
    'Create the sale: POST /api/v1/partner/trades with items (optional price_cents to lock the quote) and the same trade_url — keep the returned id.',
    'Receive a POST on every status change (trade.* and payout.*).',
    'Fallback: poll GET /api/v1/partner/trades/{id} or GET /api/v1/partner/payouts if a webhook was missed.',
  ],
  webhookIntro:
    'MoonSkin sends a JSON POST to the HTTPS URL you configured. The signing secret is visible in Settings → Developer (and on the admin user page).',
  webhookHeaders: [
    'Content-Type: application/json',
    'X-MoonSkin-Event-Id: unique event identifier',
    'X-MoonSkin-Signature: t=<unix_timestamp>,v1=<hmac_sha256_hex>',
  ],
  webhookEvents: 'Event types: trade.created, trade.status_changed, payout.created, payout.status_changed.',
  webhookIdempotence:
    'event_id is deterministic (type + resource + status + API key) so the same status change is never delivered twice.',
  webhookRetries:
    'Respond HTTP 2xx to acknowledge. On failure, MoonSkin retries up to 3 times (1s, 5s, 15s). Reject a signature if |now − t| > 300 seconds.',
  webhookSecretHint:
    'The signing secret is not returned by GET /webhook. Read it from Settings → Developer.',
  errorIntro: 'Standard partner API error codes:',
  errorCodes: {
    UNAUTHORIZED: 'Missing, invalid or revoked API key (401).',
    FORBIDDEN: 'Missing required scope, or a business rule blocked the call (e.g. monthly withdrawal limit) (403).',
    NOT_FOUND: 'Account, trade or API key not found (404).',
    VALIDATION_ERROR:
      'Invalid JSON, missing fields, invalid trade URL, stale quoted price (price_cents), trade not ready for payout, or insufficient balance (400 / 409).',
    RATE_LIMITED: 'Quota exceeded, default 100 req/min. May include retry_after_seconds (429).',
    KYC_REQUIRED: 'Payout blocked until KYC is approved. May include requires_kyc: true (403).',
    TERMS_REQUIRED: 'Terms of service have not been accepted on the linked account (403).',
    ACCOUNT_FROZEN: 'Linked MoonSkin account is frozen (403).',
    ACCOUNT_BANNED: 'Linked MoonSkin account is banned (403).',
    API_ERROR:
      'Upstream trade provider failed (inventory or sale creation) (503). May include provider_status and provider_error.',
    CONFIG_ERROR: 'Server-side configuration issue (500).',
    INTERNAL_ERROR: 'Unexpected server error (500).',
  },
  errorEnvelope,
  errorExtras:
    'RATE_LIMITED may include retry_after_seconds. KYC_REQUIRED may include requires_kyc: true. API_ERROR may include provider_status and provider_error.',
  endpoints: {
    me: {
      description: 'MoonSkin account linked to the API key: Steam, KYC, Trade Link, freeze status, merchant/VIP bonus rate.',
      response:
        '{ id, steam_id, steam_username, kyc_status, accepted_terms_at, trade_link, user_tag, bonus_rate_percent, account_frozen, created_at }',
    },
    balance: {
      description: 'Balances in cents: total, pending, frozen, available.',
      response: '{ balance_cents, pending_cents, frozen_cents, available_cents, account_frozen }',
    },
    inventory: {
      description:
        'Sellable CS2 items (same source as the Sell page). Pass ?trade_url= (URL-encoded) to target a Steam account without using Settings; otherwise the saved Trade Link is used. Locked / unsellable items are omitted. An empty array with success: true means nothing is sellable, not an error. Source prices are USD. ?currency=USD|EUR|CNY (default USD) converts cents on every request. price_cents is the regular public buy price. merchant_price_cents is regular plus the linked account bonus (bonus_rate_percent). Without a bonus they are equal. When locking a quote on POST /trades, send price_cents — not merchant_price_cents.',
      response:
        '{ steam_id, currency, bonus_rate_percent, items: [{ asset_id, market_hash_name, price_cents, merchant_price_cents, icon_url, exterior, stat_trak, rarity }], total_items, total_value_cents, total_merchant_value_cents }',
    },
    estimate: {
      description:
        'Estimate gross, merchant/VIP bonus and net. Optional trade_url: same link as inventory / sale. Optional currency (USD, EUR, CNY; default USD), same unit as GET /inventory. Sale cashout/network fees are 0; platform fees apply at payout. 1–50 unique asset_ids. Each item has price_cents (regular) and merchant_price_cents (regular + bonus). vip_bonus_cents is the bonus rounded on the total (what is credited). bonus_rate_percent is the account rate.',
      response:
        '{ gross_cents, fees: { cashout, network }, net_cents, vip_bonus_cents, bonus_rate_percent, currency, items: [{ asset_id, market_hash_name, price_cents, merchant_price_cents }] }',
    },
    createTrade: {
      description:
        'Creates a real Steam sale: the MoonSkin bot sends a trade offer. Required trade_url is the target Steam Trade Link, passed per request — no need to save it in Settings. Requires trade scope. HTTP 201. Minimum 100 cents. Optional price_cents (per item and/or total) rejects the sale if the live price changed since inventory was loaded: VALIDATION_ERROR 409 with expected_price_cents and actual_price_cents. Pass currency (USD, EUR, CNY) when the quote comes from GET /inventory?currency=… — created sale amounts stay in USD. steam_trade_offer_id (nullable) is the Steam trade offer id: open https://steamcommunity.com/tradeoffer/{id}. If it is null at creation, it is filled later on GET /trades/{id} and trade.* webhooks.',
      response:
        '{ id, trade_id, ticket_id, status, gross_cents, net_cents, fees, vip_bonus_cents, expires_at, available_at, payment_reference, steam_trade_offer_id }',
    },
    listTrades: {
      description: 'Paginated list of the account trades (newest first).',
      response: '{ trades: [...], pagination: { limit, offset, total } }',
    },
    getTrade: {
      description: 'Full trade detail including items. Use as a webhook fallback if a notification was missed.',
      response:
        '{ id, trade_id, status, gross_cents, fees, net_cents, ticket_id, steam_id, trade_link, steam_trade_offer_id, available_at, payment_reference, items, ... }',
    },
    listPayouts: {
      description:
        'Paginated list of payouts on the account linked to the key (newest first), including those requested via the API. Requires read scope. Same pagination as GET /trades (limit, offset).',
      response: '{ payouts: [...], pagination: { limit, offset, total } }',
    },
    payouts: {
      description:
        'Request a SEPA/crypto payout for a trade in available status. KYC must be approved and a payout method already configured. Replaying the same trade_id returns the existing payout with already_exists: true.',
      response:
        '{ id, status, amount_cents, trade_id, payment_method: { type, verified }, payment_reference, created_at, paid_at, already_exists? }',
    },
    putWebhook: {
      description:
        'Set the notification URL (public HTTPS only). Requires trade or payout scope. A read-only key cannot change it.',
      response: '{ webhook_url, message }',
    },
    getWebhook: {
      description: 'Read the active webhook configuration (signing secret is not included).',
      response: '{ webhook_url, signature_header, signature_format, note }',
    },
  },
};

const cn: PartnerDocsCopy = {
  conventionItems: [
    'JSON 响应仅为英文。',
    '成功：{ "success": true, "data": { ... } }',
    '错误：{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }',
    '金额为整数分 (*_cents)，禁止浮点数。',
    '状态使用英文 snake_case：created, accepted_by_bot, in_trade_hold, available, payout_pending, paid, failed, cancelled。',
    '错误码为大写：UNAUTHORIZED, KYC_REQUIRED, RATE_LIMITED, …',
    'HTTP：200、201（创建销售）、400、401、403、404、409、429、503、500。',
  ],
  scopesItems: [
    'read — 资料、余额、库存、估价、销售列表/详情、提现列表、读取 webhook。',
    'trade — 创建销售（POST /trades）并配置 webhook（PUT /webhook）。',
    'payout — 申请提现（POST /payouts）并配置 webhook（PUT /webhook）。',
  ],
  scopesReadOnly: '只读密钥无法创建销售、申请提现或修改 webhook。缺少所需 scope 时返回 HTTP 403。',
  prerequisitesItems: [
    'MoonSkin 账户已绑定 Steam 并已接受服务条款。',
    '每次调用传入 trade_url（库存、估价、销售），无需在设置中修改。仅当省略 trade_url 时，才使用已保存的 Trade Link 作为默认值。',
    '自动提现前需完成 KYC。销售可在 KYC 之前开始。',
    '调用 POST /payouts 前，须在控制台配置好 SEPA 或加密货币收款方式。',
    '公开 HTTPS webhook 地址（拒绝 localhost、内网 IP 和带凭据的 URL）。',
    '默认限流：每密钥每分钟 100 次（管理员可设为 10–1000）。',
    '技术联系：contact@moonskin.fun',
  ],
  flowItems: [
    '配置 webhook：PUT /api/v1/partner/webhook',
    '库存：GET /api/v1/partner/inventory?trade_url=…（需 URL 编码）。估价和销售使用同一个 trade_url。',
    '估价：POST /api/v1/partner/estimate，传入 asset_ids 和 trade_url。',
    '创建销售：POST /api/v1/partner/trades，传入 items（可选 price_cents 锁定报价）和同一个 trade_url — 保存返回的 id。',
    '每次状态变化会收到 POST（trade.* 与 payout.*）。',
    '备用：若漏收 webhook，轮询 GET /api/v1/partner/trades/{id} 或 GET /api/v1/partner/payouts。',
  ],
  webhookIntro:
    'MoonSkin 会向您配置的 HTTPS 地址发送 JSON POST。签名密钥可在 设置 → 开发者（以及管理员用户页）查看。',
  webhookHeaders: [
    'Content-Type: application/json',
    'X-MoonSkin-Event-Id：事件唯一标识',
    'X-MoonSkin-Signature：t=<unix_timestamp>,v1=<hmac_sha256_hex>',
  ],
  webhookEvents: '事件类型：trade.created、trade.status_changed、payout.created、payout.status_changed。',
  webhookIdempotence: 'event_id 是确定性的（类型 + 资源 + 状态 + API 密钥），同一状态变化不会重复投递。',
  webhookRetries:
    '请返回 HTTP 2xx 表示已接收。失败时 MoonSkin 最多重试 3 次（1s、5s、15s）。若 |now − t| > 300 秒，请拒绝该签名。',
  webhookSecretHint: 'GET /webhook 不会返回签名密钥。请到 设置 → 开发者 查看。',
  errorIntro: '合作伙伴 API 标准错误码：',
  errorCodes: {
    UNAUTHORIZED: '缺少、无效或已吊销的 API 密钥（401）。',
    FORBIDDEN: '缺少所需 scope，或业务规则拦截（例如月度提现限额）（403）。',
    NOT_FOUND: '找不到账户、销售或密钥（404）。',
    VALIDATION_ERROR:
      'JSON 无效、缺字段、Trade URL 无效、报价已过期（price_cents）、销售尚未可提现，或余额不足（400 / 409）。',
    RATE_LIMITED: '超出配额，默认每分钟 100 次。可能包含 retry_after_seconds（429）。',
    KYC_REQUIRED: 'KYC 通过前无法提现。可能包含 requires_kyc: true（403）。',
    TERMS_REQUIRED: '关联账户尚未接受服务条款（403）。',
    ACCOUNT_FROZEN: '关联 MoonSkin 账户已冻结（403）。',
    ACCOUNT_BANNED: '关联 MoonSkin 账户已封禁（403）。',
    API_ERROR: '上游交易服务失败（库存或创建销售）（503）。可能包含 provider_status 和 provider_error。',
    CONFIG_ERROR: '服务器配置问题（500）。',
    INTERNAL_ERROR: '意外的服务器错误（500）。',
  },
  errorEnvelope,
  errorExtras:
    'RATE_LIMITED 可能包含 retry_after_seconds。KYC_REQUIRED 可能包含 requires_kyc: true。API_ERROR 可能包含 provider_status 和 provider_error。',
  endpoints: {
    me: {
      description: '密钥绑定的 MoonSkin 账户：Steam、KYC、Trade Link、冻结状态、商家/VIP 奖励比率。',
      response:
        '{ id, steam_id, steam_username, kyc_status, accepted_terms_at, trade_link, user_tag, bonus_rate_percent, account_frozen, created_at }',
    },
    balance: {
      description: '以分为单位的余额：总额、待入账、冻结、可用。',
      response: '{ balance_cents, pending_cents, frozen_cents, available_cents, account_frozen }',
    },
    inventory: {
      description:
        '可回购的 CS2 皮肤（与「出售」页同一数据源）。传入 ?trade_url=（需 URL 编码）可指定 Steam 账户，无需改设置；省略时使用已保存的 Trade Link。锁定/不可售物品会被省略。success: true 且空数组表示没有可售物品，不是错误。源价格为 USD。?currency=USD|EUR|CNY（默认 USD）会在每次请求转换分值。price_cents 为 regular（公开）价。merchant_price_cents 为 regular 加上绑定账户奖励（bonus_rate_percent）。无奖励时两者相同。在 POST /trades 锁定报价时请传 price_cents，不要传 merchant_price_cents。',
      response:
        '{ steam_id, currency, bonus_rate_percent, items: [{ asset_id, market_hash_name, price_cents, merchant_price_cents, icon_url, exterior, stat_trak, rarity }], total_items, total_value_cents, total_merchant_value_cents }',
    },
    estimate: {
      description:
        '估算毛额、商家/VIP 加成和净额。可选 trade_url：与库存/销售使用同一链接。可选 currency（USD、EUR、CNY；默认 USD），单位与 GET /inventory 相同。销售的 cashout/网络费用为 0；平台费用在提现时收取。1–50 个不重复的 asset_id。每个物品含 price_cents（regular）和 merchant_price_cents（regular + 奖励）。vip_bonus_cents 是按总额四舍五入的奖励（实际入账）。bonus_rate_percent 为账户比率。',
      response:
        '{ gross_cents, fees: { cashout, network }, net_cents, vip_bonus_cents, bonus_rate_percent, currency, items: [{ asset_id, market_hash_name, price_cents, merchant_price_cents }] }',
    },
    createTrade: {
      description:
        '创建真实的 Steam 销售：MoonSkin 机器人会发送报价。必填 trade_url 是目标 Steam Trade Link，每次请求传入，无需先保存到网站。需要 trade scope。HTTP 201。最低 100 分。可选 price_cents（按物品和/或总额）用于在库存加载后价格变动时拒绝销售：VALIDATION_ERROR 409，包含 expected_price_cents 和 actual_price_cents。若报价来自 GET /inventory?currency=…，请传入相同的 currency（USD、EUR、CNY）— 创建销售返回的金额仍为 USD。steam_trade_offer_id（可为 null）是 Steam 报价 ID，用于打开 https://steamcommunity.com/tradeoffer/{id}。若创建时为 null，稍后会在 GET /trades/{id} 和 trade.* webhook 中补全。',
      response:
        '{ id, trade_id, ticket_id, status, gross_cents, net_cents, fees, vip_bonus_cents, expires_at, available_at, payment_reference, steam_trade_offer_id }',
    },
    listTrades: {
      description: '账户销售的分页列表（最新在前）。',
      response: '{ trades: [...], pagination: { limit, offset, total } }',
    },
    getTrade: {
      description: '销售完整详情（含物品）。若漏收 webhook，可用此接口作为备用。',
      response:
        '{ id, trade_id, status, gross_cents, fees, net_cents, ticket_id, steam_id, trade_link, steam_trade_offer_id, available_at, payment_reference, items, ... }',
    },
    listPayouts: {
      description:
        '密钥绑定账户的提现分页列表 GET /payouts（最新在前），包含通过 API 申请的提现。需要 read scope。分页参数与 GET /trades 相同（limit、offset）。',
      response: '{ payouts: [...], pagination: { limit, offset, total } }',
    },
    payouts: {
      description:
        '对状态为 available 的销售申请 SEPA/加密货币提现。须已通过 KYC 并配置收款方式。重复提交同一 trade_id 会返回已有 payout，并带 already_exists: true。',
      response:
        '{ id, status, amount_cents, trade_id, payment_method: { type, verified }, payment_reference, created_at, paid_at, already_exists? }',
    },
    putWebhook: {
      description: '设置通知 URL（仅限公开 HTTPS）。需要 trade 或 payout scope。只读密钥无法修改。',
      response: '{ webhook_url, message }',
    },
    getWebhook: {
      description: '读取当前 webhook 配置（不含签名密钥）。',
      response: '{ webhook_url, signature_header, signature_format, note }',
    },
  },
};

const COPY: Record<PartnerDocsLocale, PartnerDocsCopy> = { fr, en, cn };

export function getPartnerDocsCopy(locale: PartnerDocsLocale): PartnerDocsCopy {
  return COPY[locale] ?? COPY.en;
}

export function formatPartnerErrorCodesGuide(locale: PartnerDocsLocale): string {
  const copy = getPartnerDocsCopy(locale);
  const lines = PARTNER_ERROR_CODE_LIST.map((code) => `• ${code} — ${copy.errorCodes[code]}`);
  return `${copy.errorIntro}\n${lines.join('\n')}\n\nError envelope:\n${copy.errorEnvelope}\n\n${copy.errorExtras}`;
}

export function formatPartnerPrerequisitesGuide(locale: PartnerDocsLocale): string {
  const copy = getPartnerDocsCopy(locale);
  return copy.prerequisitesItems.map((item) => `• ${item}`).join('\n');
}

export function formatPartnerWebhookProse(locale: PartnerDocsLocale): string {
  const copy = getPartnerDocsCopy(locale);
  return [
    copy.webhookIntro,
    copy.webhookHeaders.map((h) => `• ${h}`).join('\n'),
    copy.webhookEvents,
    copy.webhookIdempotence,
    copy.webhookRetries,
    copy.webhookSecretHint,
  ].join('\n');
}
