import type { Messages } from '../../utils/types';

export const TRADE_DISPLAY_STATUSES = [
  'créé',
  'accepté_par_bot',
  'en_trade_hold',
  'disponible',
  'paiement_en_cours',
  'payé',
  'échoué',
  'annulé',
] as const;

export type TradeDisplayStatus = (typeof TRADE_DISPLAY_STATUSES)[number];

const PRISMA_TO_DISPLAY: Record<string, TradeDisplayStatus> = {
  CREATED: 'créé',
  ACCEPTED_BY_BOT: 'accepté_par_bot',
  IN_TRADE_HOLD: 'en_trade_hold',
  AVAILABLE: 'disponible',
  PAYOUT_PENDING: 'paiement_en_cours',
  PAID: 'payé',
  FAILED: 'échoué',
  CANCELLED: 'annulé',
};

export function normalizeTradeDisplayStatus(status: string): string {
  return PRISMA_TO_DISPLAY[status] ?? status;
}

export function getTradeStatusLabel(status: string, messages: Messages): string {
  const key = normalizeTradeDisplayStatus(status);
  const labels = messages.trade.status;
  return labels[key as keyof typeof labels] ?? key;
}

export function getAdminTradeStatusLabel(
  status: string,
  t: Messages['components']['admin']['trades'],
): string {
  const key = normalizeTradeDisplayStatus(status);
  const labels: Record<string, string | undefined> = {
    créé: t.created,
    accepté_par_bot: t.accepted,
    en_trade_hold: t.tradeHold,
    disponible: t.available,
    paiement_en_cours: t.payment,
    payé: t.paid,
    échoué: t.failed,
    annulé: t.cancelled,
  };
  return labels[key] ?? key;
}
