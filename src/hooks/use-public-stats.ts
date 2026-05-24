import { useQuery } from '@tanstack/react-query';

export interface PublicStats {
  totalUsers: number;
  completedTrades: number;
  volumeMillions: number;
  totalVolumeCents: number;
  totalSkinsSold: number;
}

export type CompactNumberDisplay = {
  value: number;
  prefix: string;
  suffix: string;
  decimals: number;
};

const EMPTY_STATS: PublicStats = {
  totalUsers: 0,
  completedTrades: 0,
  volumeMillions: 0,
  totalVolumeCents: 0,
  totalSkinsSold: 0,
};

function roundCompact(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Formate un montant en centimes (€) : k / M / Md selon l'ampleur. */
export function formatPlatformVolume(cents: number): CompactNumberDisplay {
  const euros = cents / 100;

  if (euros >= 1_000_000_000) {
    return {
      value: roundCompact(euros / 1_000_000_000, 1),
      prefix: '€',
      suffix: ' Md',
      decimals: 1,
    };
  }
  if (euros >= 1_000_000) {
    return {
      value: roundCompact(euros / 1_000_000, 1),
      prefix: '€',
      suffix: ' M',
      decimals: 1,
    };
  }
  if (euros >= 10_000) {
    const decimals = euros >= 100_000 ? 0 : 1;
    return {
      value: roundCompact(euros / 1_000, decimals),
      prefix: '€',
      suffix: ' k',
      decimals,
    };
  }
  if (euros >= 1_000) {
    return { value: Math.round(euros), prefix: '€', suffix: '', decimals: 0 };
  }
  return { value: euros, prefix: '€', suffix: '', decimals: 2 };
}

/** Formate un grand entier (trades, skins, utilisateurs) : k / M / Md. */
export function formatCompactCount(count: number): CompactNumberDisplay {
  if (count >= 1_000_000_000) {
    return {
      value: roundCompact(count / 1_000_000_000, 1),
      prefix: '',
      suffix: ' Md+',
      decimals: 1,
    };
  }
  if (count >= 1_000_000) {
    return {
      value: roundCompact(count / 1_000_000, 1),
      prefix: '',
      suffix: ' M+',
      decimals: 1,
    };
  }
  if (count >= 10_000) {
    const decimals = count >= 100_000 ? 0 : 1;
    return {
      value: roundCompact(count / 1_000, decimals),
      prefix: '',
      suffix: ' k+',
      decimals,
    };
  }
  return {
    value: count,
    prefix: '',
    suffix: count > 0 ? '+' : '',
    decimals: 0,
  };
}

async function fetchPublicStats(): Promise<PublicStats> {
  const res = await fetch('/api/stats');
  if (!res.ok) return EMPTY_STATS;
  return res.json();
}

export function usePublicStats() {
  return useQuery<PublicStats>({
    queryKey: ['public-stats'],
    queryFn: fetchPublicStats,
    staleTime: 5 * 60 * 1000,
  });
}
