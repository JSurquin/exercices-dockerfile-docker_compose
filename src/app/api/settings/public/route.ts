import { NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';

export const revalidate = 300; // 5 minutes

const DEFAULTS = {
  cashout_fee_rate: 0.005,   // 0.5%
  network_fee_centimes: 200, // 2.00€
  affiliate_commission_rate: 0.02, // 2%
};

export async function GET() {
  try {
    const rows = await prisma.siteSettings.findMany({
      where: {
        key: {
          in: ['cashout_fee_rate', 'network_fee_centimes', 'affiliate_commission_rate'],
        },
      },
      select: { key: true, valueJson: true },
    });

    const map: Record<string, number> = {};
    for (const row of rows) {
      if (row.valueJson !== null && row.valueJson !== undefined) {
        map[row.key] = row.valueJson as number;
      }
    }

    return NextResponse.json({
      cashoutFeeRate: map['cashout_fee_rate'] ?? DEFAULTS.cashout_fee_rate,
      networkFeeCentimes: map['network_fee_centimes'] ?? DEFAULTS.network_fee_centimes,
      affiliateCommissionRate: map['affiliate_commission_rate'] ?? DEFAULTS.affiliate_commission_rate,
    });
  } catch {
    return NextResponse.json({
      cashoutFeeRate: DEFAULTS.cashout_fee_rate,
      networkFeeCentimes: DEFAULTS.network_fee_centimes,
      affiliateCommissionRate: DEFAULTS.affiliate_commission_rate,
    });
  }
}
