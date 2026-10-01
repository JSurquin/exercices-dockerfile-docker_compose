/** Max digits before the decimal separator (withdraw amount field). */
export const PAYOUT_AMOUNT_MAX_INTEGER_DIGITS = 7;

/** Max digits after the decimal separator (centimes). */
export const PAYOUT_AMOUNT_MAX_FRACTION_DIGITS = 2;

/**
 * Caps a withdraw amount string to 7 digits before the decimal and 2 after.
 * Accepts `,` or `.` as separator and strips non-numeric characters.
 * Preserves a trailing separator so the user can type decimals.
 */
export function sanitizePayoutAmountInput(raw: string): string {
  let integer = '';
  let fraction = '';
  let seenDot = false;

  for (const ch of raw) {
    if (ch === '.' || ch === ',') {
      if (!seenDot) seenDot = true;
      continue;
    }
    if (ch < '0' || ch > '9') continue;
    if (!seenDot) {
      if (integer.length < PAYOUT_AMOUNT_MAX_INTEGER_DIGITS) integer += ch;
    } else if (fraction.length < PAYOUT_AMOUNT_MAX_FRACTION_DIGITS) {
      fraction += ch;
    }
  }

  if (seenDot) return `${integer}.${fraction}`;
  return integer;
}
