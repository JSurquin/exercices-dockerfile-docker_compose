'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

export interface TradeItem {
  id: string;
  name: string;
  marketHashName: string;
  prixCentimes: number;
  iconUrl: string;
  exterior?: string;
  statTrak: boolean;
  rarity: string;
}

export interface Trade {
  id: string;
  userId: string;
  status: string;
  brutCentimes: number;
  frais: {
    cashout: number;
    réseau: number;
  };
  netCentimes: number;
  ticketId: string;
  tradeAcceptéLe?: Date;
  disponibleLe?: Date;
  créédLe: Date;
  items: TradeItem[];
}

export interface UserTradesData {
  trades: Trade[];
  totalTrades: number;
  totalVolume: number;
}

export function useUserTrades() {
  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery<UserTradesData>({
    queryKey: queryKeys.userTrades,
    queryFn: async () => {
      const response = await fetch('/api/user/trades');
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des trades');
      }
      return response.json();
    },
  });

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Une erreur est survenue'
    : null;

  return {
    data: data ?? null,
    loading,
    error,
    refetch,
  };
}
