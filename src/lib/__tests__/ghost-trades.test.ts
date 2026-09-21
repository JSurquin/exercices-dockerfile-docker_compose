import {
  GHOST_TRADE_COUNT,
  PUBLIC_VOLUME_PROCESSED_FLOOR_CENTS,
  applyGhostTradesToPublicCount,
  applyGhostTradesToPublicVolume,
} from '@/lib/ghost-trades';

describe('ghost trades — stats publiques', () => {
  it('garantit un Volume traité d’au moins 101 000 €', () => {
    expect(PUBLIC_VOLUME_PROCESSED_FLOOR_CENTS).toBe(10_100_000);
    expect(applyGhostTradesToPublicVolume(0)).toBe(10_100_000);
    expect(applyGhostTradesToPublicVolume(2_500_000)).toBe(10_100_000);
    expect(applyGhostTradesToPublicVolume(7_600_000)).toBe(10_100_000);
  });

  it('laisse le volume public croître au-delà du plancher', () => {
    expect(applyGhostTradesToPublicVolume(10_200_000)).toBe(10_200_000);
  });

  it('compte un trade fantôme supplémentaire', () => {
    expect(GHOST_TRADE_COUNT).toBe(1);
    expect(applyGhostTradesToPublicCount(12)).toBe(13);
  });
});
