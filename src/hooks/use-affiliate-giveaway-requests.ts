'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

interface UseAffiliateGiveawayRequestsResult {
  pendingCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAffiliateGiveawayRequests(): UseAffiliateGiveawayRequestsResult {
  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.adminAffiliateGiveawayRequests('pending'),
    queryFn: async () => {
      const response = await fetch(
        '/api/admin/affiliate-giveaway-requests?limit=1&status=PENDING'
      );
      const json = await response.json();
      if (!json.success) {
        throw new Error('Failed to load giveaway requests');
      }
      return json.data.pendingCount as number;
    },
    refetchInterval: 30_000,
  });

  return {
    pendingCount: data ?? 0,
    loading,
    error: queryError instanceof Error ? queryError.message : null,
    refresh: refetch,
  };
}
