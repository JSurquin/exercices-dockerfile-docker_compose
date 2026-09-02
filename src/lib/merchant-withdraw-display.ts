export const MERCHANT_WITHDRAW_PREFIX = 'MOON-MERCHANT-WD-';

export function isMerchantWithdrawReference(ref: string | null | undefined): boolean {
  return !!ref?.startsWith(MERCHANT_WITHDRAW_PREFIX);
}

export function isMerchantWithdrawPayout(opts: {
  method?: string;
  gateFiOrderId?: string | null;
}): boolean {
  return opts.method === 'MERCHANT_WITHDRAW' || isMerchantWithdrawReference(opts.gateFiOrderId);
}

/** Client-facing status for merchant withdraw (display only — DB/API unchanged). */
export function merchantWithdrawClientDisplayStatus(status: string): string {
  if (status.toUpperCase() === 'PENDING_APPROVAL') return 'PROCESSING';
  return status;
}

export function clientDisplayPayoutStatus(
  status: string,
  opts?: { method?: string; gateFiOrderId?: string | null },
): string {
  if (isMerchantWithdrawPayout(opts ?? {})) {
    return merchantWithdrawClientDisplayStatus(status);
  }
  return status;
}
