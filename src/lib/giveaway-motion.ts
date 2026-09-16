export const GIVEAWAY_CAROUSEL_SPRING = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 28,
};

export const GIVEAWAY_PAGE_STAGGER_S = 0.08;
export const GIVEAWAY_FADE_Y = 16;
export const GIVEAWAY_STAR_COUNT = 30;
export const GIVEAWAY_PROGRESS_MS = 800;
export const GIVEAWAY_COUNT_UP_MS = 700;
export const GIVEAWAY_TILT_MAX_DEG = 6;

export interface GiveawayStarSpec {
  x: number;
  y: number;
  size: number;
  delay: number;
  depth: number;
  duration: number;
}

export function createGiveawayStarfield(count = GIVEAWAY_STAR_COUNT): GiveawayStarSpec[] {
  const capped = Math.min(GIVEAWAY_STAR_COUNT, Math.max(0, Math.floor(count)));
  return Array.from({ length: capped }, (_, index) => {
    const seed = (index + 1) * 127.1;
    return {
      x: (Math.sin(seed) * 0.5 + 0.5) * 100,
      y: (Math.cos(seed * 1.37) * 0.5 + 0.5) * 100,
      size: 1 + (index % 3),
      delay: (index % 10) * 0.32,
      depth: 0.06 + (index % 5) * 0.04,
      duration: 2.2 + (index % 6) * 0.35,
    };
  });
}

export const GIVEAWAY_STARFIELD = createGiveawayStarfield();

export interface GiveawayPrestigeParticle {
  x: number;
  y: number;
  delay: number;
  duration: number;
}

export function createGiveawayPrestigeParticles(): GiveawayPrestigeParticle[] {
  return [
    { x: 18, y: 22, delay: 0, duration: 6.4 },
    { x: 78, y: 18, delay: 0.8, duration: 7.1 },
    { x: 88, y: 48, delay: 1.4, duration: 6.8 },
    { x: 72, y: 82, delay: 0.4, duration: 7.6 },
    { x: 24, y: 78, delay: 1.1, duration: 6.2 },
    { x: 10, y: 52, delay: 1.8, duration: 7.4 },
  ];
}
