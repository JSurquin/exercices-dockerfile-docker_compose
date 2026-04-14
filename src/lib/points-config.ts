export interface FragmentDropTier {
  probability: number;
  minFragments: number;
  maxFragments: number;
}

export interface FragmentDropConfig {
  dropChance: number;
  tiers: FragmentDropTier[];
}

export interface PointsConfig {
  pointsPerEuro: number;
  ticketsPerEuro: number;
  dailyLoginPoints: number;
  dailyLoginTickets: number;
  streakMultiplier: number;
  streakMaxDays: number;
  levelUpBonusPoints: number;
  fragmentsPerEuro: number;
  fragmentDrop: FragmentDropConfig;
  giveawayCosts: {
    DAILY: number;
    WEEKLY: number;
    MONTHLY: number;
    YEARLY: number;
    CUSTOM: number;
  };
}

export const DEFAULT_FRAGMENT_DROP: FragmentDropConfig = {
  dropChance: 0.25,
  tiers: [
    { probability: 0.05, minFragments: 100, maxFragments: 200 },
    { probability: 0.15, minFragments: 50, maxFragments: 100 },
    { probability: 0.50, minFragments: 20, maxFragments: 50 },
  ],
};

export const DEFAULT_GIVEAWAY_COSTS = {
  DAILY: 50,
  WEEKLY: 150,
  MONTHLY: 400,
  YEARLY: 2000,
  CUSTOM: 50,
};

export const DEFAULT_POINTS_CONFIG: PointsConfig = {
  pointsPerEuro: 100,
  ticketsPerEuro: 0.1,
  dailyLoginPoints: 50,
  dailyLoginTickets: 0,
  streakMultiplier: 1.1,
  streakMaxDays: 7,
  levelUpBonusPoints: 500,
  fragmentsPerEuro: 0.2,
  fragmentDrop: DEFAULT_FRAGMENT_DROP,
  giveawayCosts: DEFAULT_GIVEAWAY_COSTS,
};
