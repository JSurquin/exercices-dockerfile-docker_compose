import type { TradeStatus } from '@prisma/client';

/** Statuts éligibles à l'attribution de commission (après validation ~7j). */
export const AFFILIATE_COMMISSION_ELIGIBLE_STATUSES: TradeStatus[] = [
  'AVAILABLE',
  'PAYOUT_PENDING',
  'PAID',
];

export function isTradeEligibleForAffiliateCommission(status: TradeStatus): boolean {
  return AFFILIATE_COMMISSION_ELIGIBLE_STATUSES.includes(status);
}

export function computeAffiliateCommissionCents(
  grossCents: number,
  commissionRate: number
): number {
  if (grossCents <= 0 || commissionRate <= 0) return 0;
  return Math.floor(grossCents * commissionRate);
}

export function normalizeAffiliateCode(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Délai Steam après crédit instantané avant attribution commission affilié. */
export const AFFILIATE_HOLD_DAYS_AFTER_INSTANT_CREDIT = 8;

/**
 * Vérifie que la période de validation Steam (~7j) est terminée avant commission.
 * Crédit instantané : compte à partir de instantCreditedAt (pas du statut AVAILABLE anticipé).
 */
export function isAffiliateCommissionHoldComplete(trade: {
  instantCreditedAt: Date | null;
  availableAt: Date | null;
}): boolean {
  const now = Date.now();

  if (trade.instantCreditedAt) {
    const holdEnds = new Date(trade.instantCreditedAt);
    holdEnds.setDate(holdEnds.getDate() + AFFILIATE_HOLD_DAYS_AFTER_INSTANT_CREDIT);
    return holdEnds.getTime() <= now;
  }

  if (trade.availableAt) {
    return trade.availableAt.getTime() <= now;
  }

  return false;
}
