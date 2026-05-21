import { useQuery } from '@tanstack/react-query';

export interface PublicStats {
  totalUsers: number;
  completedTrades: number;
  volumeMillions: number;
  totalVolumeCents: number;
  totalSkinsSold: number;
}

const MARKETING_FALLBACK: PublicStats = {
  totalUsers: 144,
  completedTrades: 5,
  volumeMillions: 0.6,
  totalVolumeCents: 60_000_000,
  totalSkinsSold: 1200,
};

const EMPTY_STATS: PublicStats = {
  totalUsers: 0,
  completedTrades: 0,
  volumeMillions: 0,
  totalVolumeCents: 0,
  totalSkinsSold: 0,
};

async function fetchPublicStats(marketing: boolean): Promise<PublicStats> {
  const res = await fetch('/api/stats');
  if (!res.ok) return marketing ? MARKETING_FALLBACK : EMPTY_STATS;
  return res.json();
}

export function formatPlatformVolume(cents: number) {
  const euros = cents / 100;
  if (euros >= 1_000_000) {
    return {
      value: Math.round((euros / 1_000_000) * 10) / 10,
      prefix: '€',
      suffix: 'M',
      decimals: 1,
    };
  }
  if (euros >= 1_000) {
    return { value: Math.round(euros), prefix: '€', suffix: '', decimals: 0 };
  }
  return { value: euros, prefix: '€', suffix: '', decimals: 2 };
}

type UsePublicStatsOptions = {
  /** Affiche des valeurs marketing par défaut (homepage, footer). Désactivé sur le dashboard. */
  marketing?: boolean;
};

export function usePublicStats(options?: UsePublicStatsOptions) {
  const marketing = options?.marketing ?? true;

  return useQuery<PublicStats>({
    queryKey: ['public-stats', marketing ? 'marketing' : 'real'],
    queryFn: () => fetchPublicStats(marketing),
    staleTime: 5 * 60 * 1000,
    placeholderData: marketing ? MARKETING_FALLBACK : undefined,
  });
}
