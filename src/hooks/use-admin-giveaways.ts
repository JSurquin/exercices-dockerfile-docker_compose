'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { Giveaway } from '@/lib/types';

export interface AdminGiveawayWinnerUser {
  id: string;
  steamUsername: string | null;
  steamAvatar: string | null;
  tradeLink: string | null;
}

export interface AdminGiveawayWinner {
  id: string;
  rank: number;
  userId: string;
  giveawayId: string;
  createdAt: string;
  user: AdminGiveawayWinnerUser | null;
}

export interface AdminGiveawayEntry {
  id: string;
  userId: string;
  ticketsUsed: number;
  user: {
    id: string;
    steamUsername: string | null;
    steamAvatar: string | null;
  } | null;
}

export interface AdminGiveaway extends Giveaway {
  entries: AdminGiveawayEntry[];
  winners: AdminGiveawayWinner[];
  _count?: { entries: number };
}

export function useAdminGiveaways() {
  const queryClient = useQueryClient();

  const {
    data: giveaways = [],
    isLoading: loading,
    refetch,
  } = useQuery<AdminGiveaway[]>({
    queryKey: queryKeys.adminGiveaways,
    queryFn: async () => {
      const res = await fetch('/api/admin/giveaways', { credentials: 'include' });
      if (!res.ok) throw new Error('Erreur lors de la récupération des giveaways admin');
      return res.json();
    },
  });

  const drawMutation = useMutation({
    mutationFn: async (giveawayId: string) => {
      const res = await fetch(`/api/giveaways/${giveawayId}/draw`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur lors du tirage');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminGiveaways });
    },
  });

  return {
    giveaways,
    loading,
    refetch,
    drawGiveaway: (id: string) => drawMutation.mutateAsync(id),
  };
}
