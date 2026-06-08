import { prisma } from "~/prisma/prisma";

const DEFAULT_CASHOUT_RATE = 0.005;

/**
 * Taux de frais plateforme historique (conservé pour compatibilité settings).
 * Les frais ne sont plus déduits à la vente : ils s'appliquent au retrait (/payout).
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
  _cashoutFeeRate?: number
): { cashoutFees: number; networkFees: number; netCents: number } {
  return { cashoutFees: 0, networkFees: 0, netCents: grossCents };
}
