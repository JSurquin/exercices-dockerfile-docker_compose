import {
  GHOST_TRADE_COUNT,
  GHOST_TRADE_VOLUME_CENTS,
  PUBLIC_VOLUME_PROCESSED_FLOOR_CENTS,
  applyGhostTradesToPublicCount,
  applyGhostTradesToPublicVolume,
} from '@/lib/ghost-trades';

describe('ghost trades — stats publiques', () => {
  it('ajoute 76 000 € de volume fantôme', () => {
    expect(GHOST_TRADE_VOLUME_CENTS).toBe(7_600_000);
    expect(applyGhostTradesToPublicVolume(2_500_000)).toBe(10_100_000);
  });

  it('garantit un Volume traité d’au moins 101 000 €', () => {
    expect(PUBLIC_VOLUME_PROCESSED_FLOOR_CENTS).toBe(10_100_000);
    expect(applyGhostTradesToPublicVolume(0)).toBe(10_100_000);
    expect(applyGhostTradesToPublicVolume(1_276_700)).toBe(10_100_000);
  });

  it('laisse le volume public croître au-delà du plancher', () => {
    expect(applyGhostTradesToPublicVolume(3_000_000)).toBe(10_600_000);
  });

  it('compte un trade fantôme supplémentaire', () => {
    expect(GHOST_TRADE_COUNT).toBe(1);
    expect(applyGhostTradesToPublicCount(12)).toBe(13);
  });
});
