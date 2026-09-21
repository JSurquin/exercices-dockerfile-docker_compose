import { cache } from 'react';
import {
  applyGhostTradesToPublicCount,
  applyGhostTradesToPublicVolume,
} from '@/lib/ghost-trades';
import { fetchPlatformStatsFromDb } from '@/lib/platform-stats';
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
  const volumeCents = applyGhostTradesToPublicVolume(raw.totalVolumeCents);

  return {
    totalUsers: raw.totalUsers,
    completedTrades: applyGhostTradesToPublicCount(raw.totalTrades),
    volumeMillions: Math.round((volumeCents / 100 / 1_000_000) * 10) / 10,
    totalVolumeCents: volumeCents,
    totalSkinsSold: raw.totalSkinsSold,
  };
}

/** Deduped per request — safe in layout + page server components. */
export const getServerPublicStats = cache(getPublicStats);
