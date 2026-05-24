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
