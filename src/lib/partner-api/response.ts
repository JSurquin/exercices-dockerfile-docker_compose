import { NextResponse } from 'next/server';

export type PartnerErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'KYC_REQUIRED'
  | 'ACCOUNT_FROZEN'
  | 'ACCOUNT_BANNED'
  | 'INTERNAL_ERROR'
  | 'CONFIG_ERROR'
  | 'API_ERROR';

const PARTNER_ERROR_CODES = new Set<PartnerErrorCode>([
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_ERROR',
  'RATE_LIMITED',
  'KYC_REQUIRED',
  'ACCOUNT_FROZEN',
  'ACCOUNT_BANNED',
  'INTERNAL_ERROR',
  'CONFIG_ERROR',
  'API_ERROR',
]);

export function toPartnerErrorCode(code: string): PartnerErrorCode {
  if (PARTNER_ERROR_CODES.has(code as PartnerErrorCode)) {
    return code as PartnerErrorCode;
  }
  if (code === 'ITEMS_NOT_FOUND') return 'VALIDATION_ERROR';
  return 'VALIDATION_ERROR';
}

export function partnerSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function partnerError(
  code: PartnerErrorCode,
  message: string,
  status: number,
  extra?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    { success: false, error: { code, message, ...extra } },
    { status }
  );
}

const TRADE_STATUS_MAP: Record<string, string> = {
  CREATED: 'created',
  ACCEPTED_BY_BOT: 'accepted_by_bot',
  IN_TRADE_HOLD: 'in_trade_hold',
  AVAILABLE: 'available',
  PAYOUT_PENDING: 'payout_pending',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

export function mapTradeStatus(status: string): string {
  return TRADE_STATUS_MAP[status] ?? status.toLowerCase();
}

const PAYOUT_STATUS_MAP: Record<string, string> = {
  PENDING: 'pending',
  VERIFICATION_REQUIRED: 'verification_required',
  VERIFIED: 'verified',
  SCHEDULED: 'scheduled',
  PROCESSING: 'processing',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  PENDING_APPROVAL: 'pending_approval',
  FLEXIFY_PENDING: 'pending',
  FLEXIFY_PROCESSING: 'processing',
  FLEXIFY_PAID: 'paid',
  FLEXIFY_FAILED: 'failed',
  WHITEPAY_WAITING_CONFIRMATION: 'pending',
  WHITEPAY_PENDING_WITHDRAWAL: 'scheduled',
  WHITEPAY_PROCESSING_WITHDRAWAL: 'processing',
  WHITEPAY_COMPLETE: 'paid',
  WHITEPAY_DECLINED: 'failed',
};

export function mapPayoutStatus(status: string): string {
  return PAYOUT_STATUS_MAP[status] ?? status.toLowerCase();
}

const KYC_STATUS_MAP: Record<string, string> = {
  PENDING: 'pending',
  IN_PROGRESS: 'pending',
  KYCAID_PENDING: 'pending',
  VERIFIED: 'verified',
  KYCAID_VERIFIED: 'verified',
  REJECTED: 'rejected',
  KYCAID_REJECTED: 'rejected',
};

export function mapKycStatus(status: string): string {
  return KYC_STATUS_MAP[status] ?? status.toLowerCase();
}

const PAYMENT_METHOD_TYPE_MAP: Record<string, string> = {
  SEPA: 'sepa',
  FLEXIFY_SEPA: 'sepa',
  CARD: 'card',
  FLEXIFY_CARD: 'card',
  CRYPTO: 'crypto',
  WHITEPAY_CRYPTO: 'crypto',
};

export function mapPaymentMethodType(type: string): string {
  return PAYMENT_METHOD_TYPE_MAP[type] ?? type.toLowerCase();
}

export function toPartnerFacingProviderError(code: string): string {
  switch (code) {
    case 'CONFIG_ERROR':
      return 'Trade provider is not configured';
    case 'ITEMS_NOT_FOUND':
      return 'One or more items were not found in the linked Steam inventory';
    case 'API_ERROR':
      return 'Unable to verify item prices with the trade provider';
    default:
      return 'Unable to process the request';
  }
}

export function formatFees(cashout: number, network: number) {
  return { cashout, network };
}

export function formatPayoutForPartner(
  payout: {
    id: string;
    status: string;
    amountCents: number;
    tradeId: string | null;
    paymentMethod: { type: string; isVerified: boolean };
  },
  extra?: { already_exists?: boolean }
) {
  return {
    id: payout.id,
    status: mapPayoutStatus(payout.status),
    amount_cents: payout.amountCents,
    trade_id: payout.tradeId,
    payment_method: {
      type: mapPaymentMethodType(payout.paymentMethod.type),
      verified: payout.paymentMethod.isVerified,
    },
    payment_reference: payout.id,
    ...extra,
  };
}

export function formatTradeForPartner(trade: {
  id: string;
  userId: string;
  status: string;
  grossCents: number;
  cashoutFees: number;
  networkFees: number;
  netCents: number;
  ticketId: string;
  tradeAcceptedAt: Date | null;
  availableAt: Date | null;
  createdAt: Date;
  steamId: string;
  tradeUrl: string | null;
  items?: Array<{
    id: string;
    name: string;
    marketHashName: string;
    priceCents: number;
    iconUrl: string | null;
    exterior: string | null;
    statTrak: boolean;
    rarity: string | null;
  }>;
}) {
  return {
    id: trade.id,
    user_id: trade.userId,
    status: mapTradeStatus(trade.status),
    gross_cents: trade.grossCents,
    fees: formatFees(trade.cashoutFees, trade.networkFees),
    net_cents: trade.netCents,
    ticket_id: trade.ticketId,
    steam_id: trade.steamId,
    trade_link: trade.tradeUrl,
    trade_accepted_at: trade.tradeAcceptedAt?.toISOString() ?? null,
    available_at: trade.availableAt?.toISOString() ?? null,
    payment_reference: trade.ticketId,
    created_at: trade.createdAt.toISOString(),
    items: (trade.items ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      market_hash_name: item.marketHashName,
      price_cents: item.priceCents,
      icon_url: item.iconUrl,
      exterior: item.exterior,
      stat_trak: item.statTrak,
      rarity: item.rarity,
    })),
  };
}

export function formatCreatedTradeForPartner(trade: {
  id: string;
  ticketId: string;
  status: string;
  grossCents: number;
  netCents: number;
  cashoutFees: number;
  networkFees: number;
  vipBonusCents?: number;
  expiresAt: Date | null;
  availableAt: Date | null;
}) {
  return {
    id: trade.id,
    trade_id: trade.id,
    ticket_id: trade.ticketId,
    status: mapTradeStatus(trade.status),
    gross_cents: trade.grossCents,
    net_cents: trade.netCents,
    fees: formatFees(trade.cashoutFees, trade.networkFees),
    vip_bonus_cents: trade.vipBonusCents ?? 0,
    expires_at: trade.expiresAt?.toISOString() ?? null,
    available_at: trade.availableAt?.toISOString() ?? null,
    payment_reference: trade.ticketId,
  };
}

type RawInventoryItem = {
  id?: string;
  asset_id?: string;
  assetid?: string;
  market_hash_name?: string;
  price?: number;
  icon_url?: string | null;
  exterior?: string | null;
  stat_trak?: boolean | number;
  is_stattrak?: boolean | number;
  rarity?: string | null;
};

function toPriceCents(price: number | undefined, fromInstantInventory: boolean): number {
  if (typeof price !== 'number' || !Number.isFinite(price)) return 0;
  if (fromInstantInventory) return Math.round(price * 100);
  return Math.round(price);
}

export function partnerInventoryFetchFailed(inventory: unknown): boolean {
  if (!inventory || typeof inventory !== 'object') return true;
  const envelope = inventory as { success?: boolean };
  return envelope.success === false;
}

export function formatInventoryForPartner(steamId: string, inventory: unknown) {
  const envelope = (inventory ?? {}) as {
    data?: { items?: RawInventoryItem[]; total_items?: number; total_value?: number };
    inventory?: RawInventoryItem[];
  };
  const fromInstant = Array.isArray(envelope.inventory) && !envelope.data?.items;
  const rawItems = envelope.data?.items ?? envelope.inventory ?? [];
  const items = rawItems.map((item) => ({
    asset_id: String(item.asset_id ?? item.assetid ?? item.id ?? ''),
    market_hash_name: item.market_hash_name ?? '',
    price_cents: toPriceCents(item.price, fromInstant),
    icon_url: item.icon_url ?? null,
    exterior: item.exterior ?? null,
    stat_trak: Boolean(item.stat_trak ?? item.is_stattrak),
    rarity: item.rarity ?? null,
  }));

  const totalValue =
    envelope.data?.total_value ??
    items.reduce((sum, item) => sum + item.price_cents, 0);

  return {
    steam_id: steamId,
    items,
    total_items: envelope.data?.total_items ?? items.length,
    total_value_cents: totalValue,
  };
}
