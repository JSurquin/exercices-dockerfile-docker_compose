import { useState, useEffect } from 'react';

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
  const [data, setData] = useState<UserTradesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/user/trades');
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des trades');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchTrades
  };
}
