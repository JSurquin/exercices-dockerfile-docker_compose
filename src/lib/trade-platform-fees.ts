import { prisma } from "~/prisma/prisma";

const DEFAULT_CASHOUT_RATE = 0.005;

/**
 * Taux de frais plateforme (cashout) sur la valeur brute du trade.
 * Les frais type « réseau » / prestataire ne sont pas déduits du trade :
 * ils sont facturés au moment du retrait (Flexify / Whitepay).
 */
export async function getCashoutFeeRate(): Promise<number> {
  try {
    const row = await prisma.siteSettings.findUnique({
      where: { key: "cashout_fee_rate" },
      select: { valueJson: true },
    });
    if (row?.valueJson != null && typeof row.valueJson === "number") {
      return row.valueJson;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_CASHOUT_RATE;
}

export function computeTradeLedgerFromGross(
  grossCents: number,
  cashoutFeeRate: number
): { cashoutFees: number; networkFees: number; netCents: number } {
  const cashoutFees = Math.round(grossCents * cashoutFeeRate);
  const netCents = grossCents - cashoutFees;
  return { cashoutFees, networkFees: 0, netCents };
}
