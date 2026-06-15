import { cache } from 'react';
import { prisma } from '~/prisma/prisma';
import type { PlatformSettings } from '@/hooks/use-platform-settings';

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  cashoutFeeRate: 0.005,
  networkFeeCentimes: 200,
  affiliateCommissionRate: 0.02,
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
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

  return {
    cashoutFeeRate: map['cashout_fee_rate'] ?? DEFAULT_PLATFORM_SETTINGS.cashoutFeeRate,
    networkFeeCentimes: map['network_fee_centimes'] ?? DEFAULT_PLATFORM_SETTINGS.networkFeeCentimes,
    affiliateCommissionRate:
      map['affiliate_commission_rate'] ?? DEFAULT_PLATFORM_SETTINGS.affiliateCommissionRate,
  };
}

export const getServerPlatformSettings = cache(getPlatformSettings);
