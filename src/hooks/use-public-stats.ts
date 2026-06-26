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

function roundCompact(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Arrondit au millier le plus proche (pas de troncature vers le bas). */
function roundToNearestThousand(value: number): number {
  return Math.round(value / 1_000) * 1_000;
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
    const roundedEuros = roundToNearestThousand(euros);
    if (roundedEuros >= 1_000_000) {
      return {
        value: roundCompact(roundedEuros / 1_000_000, 1),
        prefix: '€',
        suffix: ' M',
        decimals: 1,
      };
    }
    return {
      value: roundedEuros / 1_000,
      prefix: '€',
      suffix: ' k',
      decimals: 0,
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
    const rounded = roundToNearestThousand(count);
    if (rounded >= 1_000_000_000) {
      return {
        value: roundCompact(rounded / 1_000_000_000, 1),
        prefix: '',
        suffix: ' Md+',
        decimals: 1,
      };
    }
    if (rounded >= 1_000_000) {
      return {
        value: roundCompact(rounded / 1_000_000, 1),
        prefix: '',
        suffix: ' M+',
        decimals: 1,
      };
    }
    return {
      value: rounded / 1_000,
      prefix: '',
      suffix: ' k+',
      decimals: 0,
    };
  }
  return {
    value: count,
    prefix: '',
    suffix: count > 0 ? '+' : '',
    decimals: 0,
  };
}

export { usePublicStats } from '@/components/providers/public-stats-provider';
