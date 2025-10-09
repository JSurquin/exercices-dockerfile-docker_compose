import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Giveaway, GiveawayEntry } from '@/lib/types';

export interface GiveawayEntryWithUser extends GiveawayEntry {
  user?: {
    id: string;
    steamUsername: string | null;
    steamAvatar: string | null;
  };
}

export interface GiveawayWithEntries extends Giveaway {
  entries?: GiveawayEntryWithUser[];
}

export interface DrawResult {
  giveaway: Giveaway;
  winner?: {
    id: string;
    steamUsername: string | null;
    steamAvatar: string | null;
  };
  totalParticipants: number;
  totalTickets: number;
  randomSeed: string;
}

export function useGiveaways() {
  const [giveaways, setGiveaways] = useState<GiveawayWithEntries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGiveaways = async (status?: 'ACTIVE' | 'ENDED' | 'CANCELLED') => {
    try {
      setLoading(true);
      const url = status ? `/api/giveaways?status=${status}` : '/api/giveaways';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des giveaways');
      }
      
      const data = await response.json();
      setGiveaways(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      console.error('Error fetching giveaways:', err);
    } finally {
      setLoading(false);
    }
  };

  const participateInGiveaway = async (giveawayId: string, userId: string, ticketsUsed: number) => {
    try {
      const response = await fetch(`/api/giveaways/${giveawayId}/participate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, ticketsUsed }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la participation');
      }

      const result = await response.json();
      
      // Actualiser la liste des giveaways
      await fetchGiveaways();
      
      toast.success(`Participation réussie ! ${ticketsUsed} ticket(s) utilisé(s)`);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      toast.error(message);
      throw err;
    }
  };

  const drawGiveaway = async (giveawayId: string): Promise<DrawResult> => {
    try {
      const response = await fetch(`/api/giveaways/${giveawayId}/draw`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du tirage');
      }

      const result = await response.json();
      
      // Actualiser la liste des giveaways
      await fetchGiveaways();
      
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      toast.error(message);
      throw err;
    }
  };

  const createGiveaway = async (giveawayData: {
    title: string;
    description: string;
    prize: string;
    ticketPrice: number;
    maxTickets: number;
    endDate: string;
  }) => {
    try {
      const response = await fetch('/api/giveaways', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(giveawayData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      const result = await response.json();
      
      // Actualiser la liste des giveaways
      await fetchGiveaways();
      
      toast.success('Giveaway créé avec succès !');
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      toast.error(message);
      throw err;
    }
  };

  useEffect(() => {
    fetchGiveaways();
    
    // Rafraîchir automatiquement toutes les 30 secondes
    const interval = setInterval(() => {
      fetchGiveaways();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    giveaways,
    loading,
    error,
    fetchGiveaways,
    participateInGiveaway,
    drawGiveaway,
    createGiveaway,
    refetch: fetchGiveaways,
  };
}