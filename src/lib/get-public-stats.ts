import { cache } from 'react';
import { fetchPlatformStatsFromDb } from '@/lib/platform-stats';
import { obfuscatePublicCount } from '@/lib/privacy-obfuscation';
import type { PublicStats } from '@/hooks/use-public-stats';

export const EMPTY_PUBLIC_STATS: PublicStats = {
  totalUsers: 0,
  completedTrades: 0,
  volumeMillions: 0,
  totalVolumeCents: 0,
  totalSkinsSold: 0,
};

export async function getPublicStats(): Promise<PublicStats> {
  const raw = await fetchPlatformStatsFromDb();
  const volumeCents = raw.totalVolumeCents;

  return {
    totalUsers: obfuscatePublicCount(raw.totalUsers),
    completedTrades: obfuscatePublicCount(raw.totalTrades),
    volumeMillions: Math.round((volumeCents / 100 / 1_000_000) * 10) / 10,
    totalVolumeCents: obfuscatePublicCount(volumeCents),
    totalSkinsSold: obfuscatePublicCount(raw.totalSkinsSold),
  };
}

/** Deduped per request — safe in layout + page server components. */
export const getServerPublicStats = cache(getPublicStats);
