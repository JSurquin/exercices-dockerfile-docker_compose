import {
  createGiveawayStarfield,
  GIVEAWAY_CAROUSEL_SPRING,
  GIVEAWAY_ENTRY_BURST_MS,
  GIVEAWAY_STAR_COUNT,
  GIVEAWAY_STARFIELD,
  giveawayStatRevealDelayMs,
} from '@/lib/giveaway-motion';

describe('giveaway motion helpers', () => {
  it('caps the starfield at 30 stars', () => {
    expect(GIVEAWAY_STARFIELD).toHaveLength(GIVEAWAY_STAR_COUNT);
    expect(GIVEAWAY_STAR_COUNT).toBe(30);
    expect(createGiveawayStarfield(80)).toHaveLength(30);
    expect(createGiveawayStarfield(0)).toHaveLength(0);
  });

  it('keeps star positions deterministic and on-canvas', () => {
    const first = createGiveawayStarfield();
    const second = createGiveawayStarfield();
    expect(first).toEqual(second);
    for (const star of first) {
      expect(star.x).toBeGreaterThanOrEqual(0);
      expect(star.x).toBeLessThanOrEqual(100);
      expect(star.y).toBeGreaterThanOrEqual(0);
      expect(star.y).toBeLessThanOrEqual(100);
    }
  });

  it('uses the requested carousel spring', () => {
    expect(GIVEAWAY_CAROUSEL_SPRING).toEqual({ type: 'spring', stiffness: 260, damping: 28 });
  });

  it('delays chance/entry count-up until after the entry burst', () => {
    expect(giveawayStatRevealDelayMs(0)).toBe(0);
    expect(giveawayStatRevealDelayMs(1, true)).toBe(0);
    expect(giveawayStatRevealDelayMs(1)).toBe(GIVEAWAY_ENTRY_BURST_MS);
  });
});
