'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Giveaway, GiveawayEntry } from '@/lib/types';
import { queryKeys } from '@/lib/query-keys';

export interface GiveawayEntryWithUser extends GiveawayEntry {
  user?: {
    id: string;
    steamUsername: string | null;
    steamAvatar: string | null;
  };
}

export interface GiveawayWithEntries extends Giveaway {
  entries?: GiveawayEntryWithUser[];
  winners?: { userId: string; rank: number }[];
}

export interface DrawResult {
  giveaway: Giveaway;
  winner?: {
    id: string;
    steamUsername: string | null;
    steamAvatar: string | null;
  };
  winners?: {
    userId: string;
    rank: number;
    user?: {
      id: string;
      steamUsername: string | null;
      steamAvatar: string | null;
    };
  }[];
  totalParticipants: number;
  totalTickets: number;
  totalEntries?: number;
  randomSeed: string;
}

export function useGiveaways(status?: 'ACTIVE' | 'ENDED' | 'CANCELLED') {
  const queryClient = useQueryClient();

  const {
    data: giveaways = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery<GiveawayWithEntries[]>({
    queryKey: queryKeys.giveaways(status),
    queryFn: async () => {
      const url = status ? `/api/giveaways?status=${status}` : '/api/giveaways';
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des giveaways');
      }
      return response.json();
    },
  });

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Une erreur est survenue'
    : null;

  const participateMutation = useMutation({
    mutationFn: async ({
      giveawayId,
      entriesToBuy,
    }: {
      giveawayId: string;
      entriesToBuy: number;
    }) => {
      const response = await fetch(`/api/giveaways/${giveawayId}/participate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ entriesToBuy }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la participation');
      }
      return response.json() as Promise<{
        newFragmentBalance: number;
        entriesAdded: number;
        fragmentsSpent: number;
      }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.giveaways() });
      toast.success(
        `Participation enregistrée : ${data.entriesAdded} entrée(s) (${data.fragmentsSpent} fragments)`
      );
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Une erreur est survenue');
    },
  });

  const drawMutation = useMutation({
    mutationFn: async (giveawayId: string): Promise<DrawResult> => {
      const response = await fetch(`/api/giveaways/${giveawayId}/draw`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du tirage');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.giveaways() });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Une erreur est survenue');
    },
  });

  const createMutation = useMutation({
    mutationFn: async (giveawayData: {
      title: string;
      description: string;
      prize: string;
      ticketPrice: number;
      maxTickets: number;
      endDate: string;
      rewardValueCents?: number;
      durationType?: string;
      winnerCount?: number;
      maxEntriesPerUser?: number | null;
    }) => {
      const response = await fetch('/api/giveaways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(giveawayData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.giveaways() });
      toast.success('Giveaway créé avec succès !');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Une erreur est survenue');
    },
  });

  const participateInGiveaway = async (giveawayId: string, entriesToBuy: number) =>
    participateMutation.mutateAsync({ giveawayId, entriesToBuy });

  const drawGiveaway = async (giveawayId: string): Promise<DrawResult> =>
    drawMutation.mutateAsync(giveawayId);

  const createGiveaway = async (giveawayData: {
    title: string;
    description: string;
    prize: string;
    ticketPrice: number;
    maxTickets: number;
    endDate: string;
    rewardValueCents?: number;
    durationType?: string;
    winnerCount?: number;
    maxEntriesPerUser?: number | null;
  }) => createMutation.mutateAsync(giveawayData);

  const fetchGiveaways = async (_status?: 'ACTIVE' | 'ENDED' | 'CANCELLED') => {
    await refetch();
  };

  return {
    giveaways,
    loading,
    error,
    fetchGiveaways,
    participateInGiveaway,
    drawGiveaway,
    createGiveaway,
    refetch,
  };
}
