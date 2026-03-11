'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

interface UseAffiliateApplicationsResult {
  pendingCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook pour récupérer le nombre de demandes d'affiliation en attente.
 * Auto-refresh toutes les 30 secondes via TanStack Query refetchInterval.
 */
export function useAffiliateApplications(): UseAffiliateApplicationsResult {
  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.adminAffiliateApplications('pending'),
    queryFn: async () => {
      const response = await fetch(
        '/api/admin/affiliate-applications?limit=1&status=pending'
      );
      const json = await response.json();
      if (!json.success) {
        throw new Error('Erreur lors du chargement');
      }
      return json.data.pendingCount as number;
    },
    refetchInterval: 30_000,
  });

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Erreur de connexion'
    : null;

  return {
    pendingCount: data ?? 0,
    loading,
    error,
    refresh: refetch,
  };
}
