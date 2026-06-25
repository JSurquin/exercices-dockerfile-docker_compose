'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useLocale } from '@/components/providers/locale-provider';

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
  vipBonusCentimes?: number;
  ticketId: string;
  tradeAcceptéLe?: Date;
  disponibleLe?: Date;
  créédLe: Date;
  balanceCreditedAt?: string | null;
  items: TradeItem[];
}

export interface UserTradesData {
  trades: Trade[];
  totalTrades: number;
  totalVolume: number;
}

export function useUserTrades() {
  const { messages } = useLocale();
  const t = messages.hooks.userTrades;

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
        throw new Error(t.fetchError);
      }
      return response.json();
    },
  });

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : t.unknownError
    : null;

  return {
    data: data ?? null,
    loading,
    error,
    refetch,
  };
}
