'use client';

import { createContext, useContext } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { PublicStats } from '@/hooks/use-public-stats';

const PublicStatsContext = createContext<UseQueryResult<PublicStats> | null>(null);

async function fetchPublicStats(): Promise<PublicStats> {
  const res = await fetch('/api/stats');
  if (!res.ok) {
    throw new Error(`Failed to fetch public stats (${res.status})`);
  }
  return res.json();
}

export function PublicStatsProvider({
  initialStats,
  children,
}: {
  initialStats: PublicStats;
  children: React.ReactNode;
}) {
  const query = useQuery({
    queryKey: ['public-stats'],
    queryFn: fetchPublicStats,
    initialData: initialStats,
    staleTime: 5 * 60 * 1000,
  });

  return <PublicStatsContext.Provider value={query}>{children}</PublicStatsContext.Provider>;
}

export function usePublicStats(): UseQueryResult<PublicStats> {
  const context = useContext(PublicStatsContext);
  if (!context) {
    throw new Error('usePublicStats must be used within PublicStatsProvider');
  }
  return context;
}
