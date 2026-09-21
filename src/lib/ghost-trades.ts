/** Trade fantôme public — n’affecte ni l’admin, ni les soldes, ni les payouts. */

/** Volume du trade fantôme : 76 000 €. */
export const GHOST_TRADE_VOLUME_CENTS = 7_600_000;

/** Plancher d’affichage « Volume traité » : 101 000 €. */
export const PUBLIC_VOLUME_PROCESSED_FLOOR_CENTS = 10_100_000;

/** Un trade fantôme compté dans les stats publiques. */
export const GHOST_TRADE_COUNT = 1;

export function applyGhostTradesToPublicVolume(realVolumeCents: number): number {
  const boosted = Math.max(0, realVolumeCents) + GHOST_TRADE_VOLUME_CENTS;
  return Math.max(boosted, PUBLIC_VOLUME_PROCESSED_FLOOR_CENTS);
}

export function applyGhostTradesToPublicCount(realTradeCount: number): number {
  return Math.max(0, realTradeCount) + GHOST_TRADE_COUNT;
}
