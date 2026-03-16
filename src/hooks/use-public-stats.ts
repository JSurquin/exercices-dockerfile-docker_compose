import { useQuery } from '@tanstack/react-query';

export interface PublicStats {
  totalUsers: number;
  completedTrades: number;
  volumeMillions: number;
}

const FALLBACK: PublicStats = {
  totalUsers: 0,
  completedTrades: 0,
  volumeMillions: 0,
};

async function fetchPublicStats(): Promise<PublicStats> {
  const res = await fetch('/api/stats');
  if (!res.ok) return FALLBACK;
  return res.json();
}

export function usePublicStats() {
  return useQuery<PublicStats>({
    queryKey: ['public-stats'],
    queryFn: fetchPublicStats,
    staleTime: 5 * 60 * 1000,
    placeholderData: FALLBACK,
  });
}
