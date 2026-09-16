'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Giveaway, GiveawayEntry } from '@/lib/types';
import { queryKeys } from '@/lib/query-keys';
import { useLocale } from '@/components/providers/locale-provider';

export interface GiveawayEntryWithUser extends GiveawayEntry {
  user?: {
    id: string;
    steamUsername: string | null;
    steamAvatar: string | null;
  };
}

export interface GiveawayWithEntries extends Giveaway {
  entries?: GiveawayEntryWithUser[];
  /** API publique : gagnants avec profil, sans userId (anti-énumération) */
  winners?: {
    rank: number;
    user?: { steamUsername: string | null; steamAvatar: string | null } | null;
  }[];
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
  const { messages } = useLocale();
  const t = messages.hooks.giveaways;

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
        throw new Error(t.fetchError);
      }
      return response.json();
    },
    refetchOnWindowFocus: true,
    refetchInterval: 15_000,
  });

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : t.unknownError
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
        throw new Error(errorData.error || t.participationError);
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
        t.participationSuccess
          .replace('{entries}', String(data.entriesAdded))
          .replace('{fragments}', String(data.fragmentsSpent))
      );
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t.unknownError);
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
        throw new Error(errorData.error || t.drawError);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.giveaways() });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t.unknownError);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (giveawayData: {
      title: string;
      description: string;
      prize: string;
      prizeImageUrl?: string | null;
      steamMarketHashName?: string | null;
      ticketPrice: number;
      maxTickets: number;
      endDate: string;
      rewardValueCents?: number;
      durationType?: string;
      winnerCount?: number;
      maxEntriesPerUser?: number | null;
      isPrivate?: boolean;
      requiredAffiliateCode?: string | null;
    }) => {
      const response = await fetch('/api/giveaways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(giveawayData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t.creationError);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.giveaways() });
      toast.success(t.creationSuccess);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t.unknownError);
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
    prizeImageUrl?: string | null;
    steamMarketHashName?: string | null;
    ticketPrice: number;
    maxTickets: number;
    endDate: string;
    rewardValueCents?: number;
    durationType?: string;
    winnerCount?: number;
    maxEntriesPerUser?: number | null;
    isPrivate?: boolean;
    requiredAffiliateCode?: string | null;
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
