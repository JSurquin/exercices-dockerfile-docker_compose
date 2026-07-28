import { NextResponse } from 'next/server';

export type PartnerErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'KYC_REQUIRED'
  | 'ACCOUNT_FROZEN'
  | 'INTERNAL_ERROR'
  | 'CONFIG_ERROR';

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
  CREATED: 'créé',
  ACCEPTED_BY_BOT: 'accepté_par_bot',
  IN_TRADE_HOLD: 'en_trade_hold',
  AVAILABLE: 'disponible',
  PAYOUT_PENDING: 'paiement_en_cours',
  PAID: 'payé',
  FAILED: 'échoué',
  CANCELLED: 'annulé',
};

export function mapTradeStatus(status: string): string {
  return TRADE_STATUS_MAP[status] ?? status.toLowerCase();
}

const PAYOUT_STATUS_MAP: Record<string, string> = {
  PENDING: 'en_attente',
  VERIFICATION_REQUIRED: 'vérification_requise',
  VERIFIED: 'vérifié',
  SCHEDULED: 'planifié',
  PROCESSING: 'exécuté',
  PAID: 'payé',
  FAILED: 'échoué',
  CANCELLED: 'annulé',
  PENDING_APPROVAL: 'en_attente_validation',
  FLEXIFY_PENDING: 'en_attente',
  FLEXIFY_PROCESSING: 'exécuté',
  FLEXIFY_PAID: 'payé',
  FLEXIFY_FAILED: 'échoué',
  WHITEPAY_WAITING_CONFIRMATION: 'en_attente',
  WHITEPAY_PENDING_WITHDRAWAL: 'planifié',
  WHITEPAY_PROCESSING_WITHDRAWAL: 'exécuté',
  WHITEPAY_COMPLETE: 'payé',
  WHITEPAY_DECLINED: 'échoué',
};

export function mapPayoutStatus(status: string): string {
  return PAYOUT_STATUS_MAP[status] ?? status.toLowerCase();
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
    statut: mapTradeStatus(trade.status),
    brut_centimes: trade.grossCents,
    frais: { cashout: trade.cashoutFees, réseau: trade.networkFees },
    net_centimes: trade.netCents,
    ticket_id: trade.ticketId,
    steam_id: trade.steamId,
    trade_link: trade.tradeUrl,
    trade_accepté_le: trade.tradeAcceptedAt?.toISOString() ?? null,
    disponible_le: trade.availableAt?.toISOString() ?? null,
    reference_paiement: trade.ticketId,
    created_at: trade.createdAt.toISOString(),
    items: trade.items?.map((item) => ({
      id: item.id,
      name: item.name,
      market_hash_name: item.marketHashName,
      prix_centimes: item.priceCents,
      icon_url: item.iconUrl,
      exterior: item.exterior,
      stat_trak: item.statTrak,
      rarity: item.rarity,
    })),
  };
}
