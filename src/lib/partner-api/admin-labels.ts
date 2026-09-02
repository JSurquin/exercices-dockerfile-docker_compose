import type { Locale } from '@/lib/i18n';

type Copy = {
  event: Record<string, string>;
  status: Record<string, string>;
  scope: Record<string, string>;
  scopeHelp: Record<string, string>;
  endpoint: Record<string, string>;
  method: Record<string, string>;
  call: Record<string, string>;
  http: { ok: string; denied: string; error: string };
};

const FR: Copy = {
  event: {
    'trade.created': 'Vente créée',
    'trade.status_changed': 'Statut de vente',
    'payout.created': 'Retrait demandé',
    'payout.status_changed': 'Statut de retrait',
  },
  status: {
    created: 'Créée',
    accepted_by_bot: 'Offre envoyée',
    in_trade_hold: 'Hold Steam',
    available: 'Disponible',
    payout_pending: 'Retrait en cours',
    paid: 'Payée',
    failed: 'Échouée',
    cancelled: 'Annulée',
    pending: 'En attente',
    success: 'Livré',
    verification_required: 'Vérification',
    verified: 'Vérifié',
    scheduled: 'Planifié',
    processing: 'En cours',
    pending_approval: 'À valider',
    ACTIVE: 'Active',
    REVOKED: 'Révoquée',
  },
  scope: {
    read: 'Lecture',
    trade: 'Ventes',
    payout: 'Retraits',
  },
  scopeHelp: {
    read: 'Voir le profil, le solde, l’inventaire, estimer un lot et suivre les ventes. Sans ça, la clé ne sert à rien.',
    trade: 'Créer une vente : le bot récupère les skins. Décochez seulement si le partenaire ne doit pas vendre.',
    payout: 'Demander un virement (SEPA ou crypto). Décochez si l’argent doit rester sur MoonSkin.',
  },
  endpoint: {
    '/api/v1/partner/me': 'Profil',
    '/api/v1/partner/balance': 'Solde',
    '/api/v1/partner/inventory': 'Inventaire',
    '/api/v1/partner/estimate': 'Estimation',
    '/api/v1/partner/trades': 'Ventes',
    '/api/v1/partner/payouts': 'Retrait',
    '/api/v1/partner/webhook': 'Webhook',
  },
  method: {
    GET: 'Lecture',
    POST: 'Création',
    PUT: 'Mise à jour',
    PATCH: 'Mise à jour',
    DELETE: 'Suppression',
  },
  call: {
    'GET /api/v1/partner/me': 'A consulté le profil',
    'GET /api/v1/partner/balance': 'A consulté le solde',
    'GET /api/v1/partner/inventory': 'A lu l’inventaire',
    'POST /api/v1/partner/estimate': 'A demandé une estimation',
    'GET /api/v1/partner/trades': 'A listé les ventes',
    'POST /api/v1/partner/trades': 'A créé une vente',
    'GET /api/v1/partner/payouts': 'A listé les retraits',
    'POST /api/v1/partner/payouts': 'A demandé un retrait',
    'GET /api/v1/partner/webhook': 'A consulté le webhook',
    'PUT /api/v1/partner/webhook': 'A mis à jour le webhook',
    'PATCH /api/v1/partner/webhook': 'A mis à jour le webhook',
    'DELETE /api/v1/partner/webhook': 'A retiré le webhook',
  },
  http: { ok: 'OK', denied: 'Refusé', error: 'Erreur' },
};

const EN: Copy = {
  event: {
    'trade.created': 'Sale created',
    'trade.status_changed': 'Sale status',
    'payout.created': 'Payout requested',
    'payout.status_changed': 'Payout status',
  },
  status: {
    created: 'Created',
    accepted_by_bot: 'Offer sent',
    in_trade_hold: 'Steam hold',
    available: 'Available',
    payout_pending: 'Payout pending',
    paid: 'Paid',
    failed: 'Failed',
    cancelled: 'Cancelled',
    pending: 'Pending',
    success: 'Delivered',
    verification_required: 'Verification',
    verified: 'Verified',
    scheduled: 'Scheduled',
    processing: 'Processing',
    pending_approval: 'To approve',
    ACTIVE: 'Active',
    REVOKED: 'Revoked',
  },
  scope: {
    read: 'Read',
    trade: 'Sales',
    payout: 'Payouts',
  },
  scopeHelp: {
    read: 'See profile, balance, inventory, estimates and sales. Without this the key cannot do much.',
    trade: 'Create a sale so the bot can collect skins. Untick only if they must not sell.',
    payout: 'Request a SEPA or crypto payout. Untick if funds should stay on MoonSkin.',
  },
  endpoint: {
    '/api/v1/partner/me': 'Profile',
    '/api/v1/partner/balance': 'Balance',
    '/api/v1/partner/inventory': 'Inventory',
    '/api/v1/partner/estimate': 'Estimate',
    '/api/v1/partner/trades': 'Sales',
    '/api/v1/partner/payouts': 'Payout',
    '/api/v1/partner/webhook': 'Webhook',
  },
  method: {
    GET: 'Read',
    POST: 'Create',
    PUT: 'Update',
    PATCH: 'Update',
    DELETE: 'Delete',
  },
  call: {
    'GET /api/v1/partner/me': 'Looked up the profile',
    'GET /api/v1/partner/balance': 'Checked the balance',
    'GET /api/v1/partner/inventory': 'Read the inventory',
    'POST /api/v1/partner/estimate': 'Requested an estimate',
    'GET /api/v1/partner/trades': 'Listed sales',
    'POST /api/v1/partner/trades': 'Created a sale',
    'GET /api/v1/partner/payouts': 'Listed payouts',
    'POST /api/v1/partner/payouts': 'Requested a payout',
    'GET /api/v1/partner/webhook': 'Checked the webhook',
    'PUT /api/v1/partner/webhook': 'Updated the webhook',
    'PATCH /api/v1/partner/webhook': 'Updated the webhook',
    'DELETE /api/v1/partner/webhook': 'Removed the webhook',
  },
  http: { ok: 'OK', denied: 'Denied', error: 'Error' },
};

const CN: Copy = {
  event: {
    'trade.created': '销售已创建',
    'trade.status_changed': '销售状态',
    'payout.created': '已申请提现',
    'payout.status_changed': '提现状态',
  },
  status: {
    created: '已创建',
    accepted_by_bot: '已发送报价',
    in_trade_hold: 'Steam 锁定',
    available: '可提现',
    payout_pending: '提现中',
    paid: '已支付',
    failed: '失败',
    cancelled: '已取消',
    pending: '等待中',
    success: '已送达',
    verification_required: '需验证',
    verified: '已验证',
    scheduled: '已计划',
    processing: '处理中',
    pending_approval: '待审批',
    ACTIVE: '有效',
    REVOKED: '已撤销',
  },
  scope: {
    read: '读取',
    trade: '销售',
    payout: '提现',
  },
  scopeHelp: {
    read: '查看资料、余额、库存、估价和销售。没有它密钥几乎无法使用。',
    trade: '创建销售，由机器人收取皮肤。仅在不允许销售时取消勾选。',
    payout: '申请 SEPA 或加密货币提现。若资金应留在 MoonSkin，请取消勾选。',
  },
  endpoint: {
    '/api/v1/partner/me': '资料',
    '/api/v1/partner/balance': '余额',
    '/api/v1/partner/inventory': '库存',
    '/api/v1/partner/estimate': '估价',
    '/api/v1/partner/trades': '销售',
    '/api/v1/partner/payouts': '提现',
    '/api/v1/partner/webhook': 'Webhook',
  },
  method: {
    GET: '读取',
    POST: '创建',
    PUT: '更新',
    PATCH: '更新',
    DELETE: '删除',
  },
  call: {
    'GET /api/v1/partner/me': '查看了资料',
    'GET /api/v1/partner/balance': '查看了余额',
    'GET /api/v1/partner/inventory': '读取了库存',
    'POST /api/v1/partner/estimate': '请求了估价',
    'GET /api/v1/partner/trades': '列出了销售',
    'POST /api/v1/partner/trades': '创建了销售',
    'GET /api/v1/partner/payouts': '列出了提现',
    'POST /api/v1/partner/payouts': '申请了提现',
    'GET /api/v1/partner/webhook': '查看了 Webhook',
    'PUT /api/v1/partner/webhook': '更新了 Webhook',
    'PATCH /api/v1/partner/webhook': '更新了 Webhook',
    'DELETE /api/v1/partner/webhook': '移除了 Webhook',
  },
  http: { ok: '成功', denied: '拒绝', error: '错误' },
};

function copyFor(locale: Locale): Copy {
  if (locale === 'en') return EN;
  if (locale === 'cn') return CN;
  return FR;
}

export function partnerEventLabel(eventType: string, locale: Locale): string {
  return copyFor(locale).event[eventType] ?? eventType.replace(/\./g, ' · ');
}

export function partnerStatusLabel(status: string, locale: Locale): string {
  return copyFor(locale).status[status] ?? status.replace(/_/g, ' ');
}

export function partnerScopeLabel(scope: string, locale: Locale): string {
  return copyFor(locale).scope[scope] ?? scope;
}

export function partnerScopeHelp(scope: string, locale: Locale): string {
  return copyFor(locale).scopeHelp[scope] ?? '';
}

export function partnerEndpointLabel(endpoint: string, locale: Locale): string {
  const exact = copyFor(locale).endpoint[endpoint];
  if (exact) return exact;
  const base = endpoint.split('?')[0].replace(/\/+$/, '');
  const mapped = copyFor(locale).endpoint[base];
  if (mapped) return mapped;
  const tradeDetail = base.match(/^\/api\/v1\/partner\/trades\/.+/);
  if (tradeDetail) {
    return locale === 'en' ? 'Sale detail' : locale === 'cn' ? '销售详情' : 'Détail vente';
  }
  return base.replace('/api/v1/partner', '') || endpoint;
}

export function partnerMethodLabel(method: string, locale: Locale): string {
  return copyFor(locale).method[method.toUpperCase()] ?? method;
}

export function partnerCallLabel(method: string, endpoint: string, locale: Locale): string {
  const base = endpoint.split('?')[0].replace(/\/+$/, '');
  const key = `${method.toUpperCase()} ${base}`;
  const exact = copyFor(locale).call[key];
  if (exact) return exact;
  if (/^\/api\/v1\/partner\/trades\/.+/.test(base)) {
    return locale === 'en'
      ? 'Opened a sale'
      : locale === 'cn'
        ? '查看了销售详情'
        : 'A ouvert une vente';
  }
  if (/^\/api\/v1\/partner\/payouts\/.+/.test(base)) {
    return locale === 'en'
      ? 'Opened a payout'
      : locale === 'cn'
        ? '查看了提现详情'
        : 'A ouvert un retrait';
  }
  return `${partnerMethodLabel(method, locale)} · ${partnerEndpointLabel(endpoint, locale)}`;
}

export function partnerHttpResultLabel(code: number, locale: Locale): string {
  const http = copyFor(locale).http;
  if (code < 300) return http.ok;
  if (code < 500) return http.denied;
  return http.error;
}

export type PartnerStatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export function partnerStatusTone(status: string): PartnerStatusTone {
  const s = status.toLowerCase();
  if (['paid', 'success', 'available', 'verified', 'active'].includes(s)) return 'success';
  if (['cancelled', 'failed', 'rejected', 'revoked'].includes(s)) return 'danger';
  if (
    [
      'in_trade_hold',
      'pending',
      'payout_pending',
      'processing',
      'pending_approval',
      'verification_required',
      'scheduled',
    ].includes(s)
  ) {
    return 'warning';
  }
  if (['created', 'accepted_by_bot'].includes(s)) return 'info';
  return 'neutral';
}

/** `trade.status_changed:TRADE-1:cancelled:clientId` → cancelled */
export function parsePartnerWebhookEventStatus(eventId: string): string | null {
  const parts = eventId.split(':');
  if (parts.length < 4) return null;
  const status = parts[parts.length - 2];
  return status || null;
}

export function partnerUserAvatarUrl(user: {
  steamAvatar?: string | null;
  image?: string | null;
}): string {
  return (user.steamAvatar || user.image || '').trim();
}

type PageCopy = {
  title: string;
  subtitle: string;
  statPartners: string;
  statCalls: string;
  statWebhooks: string;
  createTitle: string;
  createHint: string;
  nameLabel: string;
  namePlaceholder: string;
  userLabel: string;
  userPlaceholder: string;
  rateLabel: string;
  scopesLabel: string;
  scopesHint: string;
  generate: string;
  generating: string;
  copyTitle: string;
  copyDesc: string;
  copied: string;
  keysTitle: string;
  noKeys: string;
  loading: string;
  webhookUrl: string;
  lastUsed: string;
  reqMin: string;
  save: string;
  revoke: string;
  revokeTitle: string;
  revokeDesc: string;
  revokeConfirm: string;
  cancel: string;
  logsTitle: string;
  noLogs: string;
  colAccount: string;
  colAction: string;
  colHttp: string;
  colIp: string;
  unknownIp: string;
  colDuration: string;
  colDate: string;
  webhooksTitle: string;
  noWebhooks: string;
  delivered: string;
  failed: string;
  attempts: string;
  createError: string;
  rateError: string;
  updateError: string;
};

const PAGE_FR: PageCopy = {
  title: 'API partenaires',
  subtitle: 'Clés, appels et notifications pour les comptes professionnels — tout en un coup d’œil.',
  statPartners: 'Partenaires actifs',
  statCalls: 'Appels récents',
  statWebhooks: 'Notifications',
  createTitle: 'Donner un accès',
  createHint: 'Le partenaire recevra une clé à copier une seule fois.',
  nameLabel: 'Nom affiché',
  namePlaceholder: 'Ex. Nyouz Skins',
  userLabel: 'Compte Steam',
  userPlaceholder: 'Rechercher un pseudo, un email ou un Steam ID…',
  rateLabel: 'Limite / minute',
  scopesLabel: 'Droits',
  scopesHint: 'Les trois sont cochés par défaut. Décochez seulement si vous voulez limiter la clé — une fois créée, ça ne se change plus.',
  generate: 'Générer la clé',
  generating: 'Création…',
  copyTitle: 'Copiez ces identifiants maintenant',
  copyDesc: 'La clé et le secret webhook ne seront plus réaffichés. Envoyez-les au partenaire une seule fois.',
  copied: 'J’ai copié',
  keysTitle: 'Accès en service',
  noKeys: 'Aucun partenaire n’a encore de clé active.',
  loading: 'Chargement…',
  webhookUrl: 'Webhook',
  lastUsed: 'Dernier appel',
  reqMin: 'req/min',
  save: 'Enregistrer',
  revoke: 'Révoquer',
  revokeTitle: 'Révoquer cette clé ?',
  revokeDesc: 'Le partenaire ne pourra plus appeler l’API. La clé est supprimée définitivement.',
  revokeConfirm: 'Révoquer et supprimer',
  cancel: 'Annuler',
  logsTitle: 'Derniers appels',
  noLogs: 'Aucun appel pour le moment.',
  colAccount: 'Compte',
  colAction: 'Ce qu’il a fait',
  colHttp: 'Résultat',
  colIp: 'Adresse IP',
  unknownIp: 'IP inconnue',
  colDuration: 'Durée',
  colDate: 'Quand',
  webhooksTitle: 'Notifications envoyées',
  noWebhooks: 'Aucune notification envoyée.',
  delivered: 'Reçue',
  failed: 'Échec',
  attempts: 'essais',
  createError: 'Impossible de créer la clé',
  rateError: 'Limite invalide (10 à 1000 par minute)',
  updateError: 'Mise à jour impossible',
};

const PAGE_EN: PageCopy = {
  title: 'Partner API',
  subtitle: 'Keys, calls and notifications for professional accounts — all in one place.',
  statPartners: 'Active partners',
  statCalls: 'Recent calls',
  statWebhooks: 'Notifications',
  createTitle: 'Grant access',
  createHint: 'The partner will get a key to copy once.',
  nameLabel: 'Display name',
  namePlaceholder: 'e.g. Nyouz Skins',
  userLabel: 'Steam account',
  userPlaceholder: 'Search by username, email or Steam ID…',
  rateLabel: 'Limit / minute',
  scopesLabel: 'Permissions',
  scopesHint: 'All three are on by default. Untick only if you want to limit the key — this cannot be changed later.',
  generate: 'Generate key',
  generating: 'Creating…',
  copyTitle: 'Copy these credentials now',
  copyDesc: 'The API key and webhook secret will not be shown again. Send them to the partner once.',
  copied: 'I’ve copied them',
  keysTitle: 'Live access',
  noKeys: 'No partner has an active key yet.',
  loading: 'Loading…',
  webhookUrl: 'Webhook',
  lastUsed: 'Last call',
  reqMin: 'req/min',
  save: 'Save',
  revoke: 'Revoke',
  revokeTitle: 'Revoke this key?',
  revokeDesc: 'The partner will no longer be able to call the API. The key is deleted permanently.',
  revokeConfirm: 'Revoke and delete',
  cancel: 'Cancel',
  logsTitle: 'Latest calls',
  noLogs: 'No calls yet.',
  colAccount: 'Account',
  colAction: 'What they did',
  colHttp: 'Result',
  colIp: 'IP address',
  unknownIp: 'Unknown IP',
  colDuration: 'Duration',
  colDate: 'When',
  webhooksTitle: 'Notifications sent',
  noWebhooks: 'No notifications sent yet.',
  delivered: 'Delivered',
  failed: 'Failed',
  attempts: 'tries',
  createError: 'Could not create the key',
  rateError: 'Invalid limit (10 to 1000 per minute)',
  updateError: 'Update failed',
};

const PAGE_CN: PageCopy = {
  title: '合作伙伴 API',
  subtitle: '专业账户的密钥、调用与通知，集中查看。',
  statPartners: '有效合作伙伴',
  statCalls: '最近调用',
  statWebhooks: '通知',
  createTitle: '授予访问',
  createHint: '合作伙伴将获得一次性复制的密钥。',
  nameLabel: '显示名称',
  namePlaceholder: '例如 Nyouz Skins',
  userLabel: 'Steam 账户',
  userPlaceholder: '按用户名、邮箱或 Steam ID 搜索…',
  rateLabel: '每分钟限额',
  scopesLabel: '权限',
  scopesHint: '默认全选。仅在需要限制密钥时取消勾选 — 创建后无法再改。',
  generate: '生成密钥',
  generating: '创建中…',
  copyTitle: '请立即复制这些凭据',
  copyDesc: 'API 密钥和 webhook 密钥不会再显示。请只发送给合作伙伴一次。',
  copied: '我已复制',
  keysTitle: '正在使用',
  noKeys: '还没有有效密钥。',
  loading: '加载中…',
  webhookUrl: 'Webhook',
  lastUsed: '上次调用',
  reqMin: '次/分钟',
  save: '保存',
  revoke: '撤销',
  revokeTitle: '撤销此密钥？',
  revokeDesc: '合作伙伴将无法再调用 API。密钥会被永久删除。',
  revokeConfirm: '撤销并删除',
  cancel: '取消',
  logsTitle: '最近调用',
  noLogs: '暂无调用。',
  colAccount: '账户',
  colAction: '他们做了什么',
  colHttp: '结果',
  colIp: 'IP 地址',
  unknownIp: '未知 IP',
  colDuration: '耗时',
  colDate: '时间',
  webhooksTitle: '已发送通知',
  noWebhooks: '尚未发送通知。',
  delivered: '已送达',
  failed: '失败',
  attempts: '次尝试',
  createError: '无法创建密钥',
  rateError: '限额无效（每分钟 10 到 1000）',
  updateError: '更新失败',
};

export function partnerAdminPageCopy(locale: Locale): PageCopy {
  if (locale === 'en') return PAGE_EN;
  if (locale === 'cn') return PAGE_CN;
  return PAGE_FR;
}
