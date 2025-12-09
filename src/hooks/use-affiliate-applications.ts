import { useState, useEffect, useCallback } from 'react';

interface UseAffiliateApplicationsResult {
  pendingCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook pour récupérer le nombre de demandes d'affiliation en attente
 * Auto-refresh toutes les 30 secondes
 */
export function useAffiliateApplications(): UseAffiliateApplicationsResult {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingCount = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/affiliate-applications?limit=1&status=pending');
      const data = await response.json();

      if (data.success) {
        setPendingCount(data.data.pendingCount || 0);
        setError(null);
      } else {
        setError('Erreur lors du chargement');
      }
    } catch (err) {
      console.error('Erreur chargement demandes d\'affiliation:', err);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger au montage
  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  // Auto-refresh toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPendingCount();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [fetchPendingCount]);

  return {
    pendingCount,
    loading,
    error,
    refresh: fetchPendingCount
  };
}

