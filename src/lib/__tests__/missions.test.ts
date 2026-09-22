jest.mock('../../../prisma/prisma', () => ({
  prisma: {},
}));

import {
  MISSION_DEFINITIONS,
  WELCOME_BONUS_FRAGMENTS,
  WELCOME_BONUS_MISSION_KEY,
  periodKeyFor,
} from '@/lib/missions';

describe('welcome bonus mission', () => {
  it('defines a one-time 1000-fragment welcome claim', () => {
    const welcome = MISSION_DEFINITIONS.find((m) => m.key === WELCOME_BONUS_MISSION_KEY);
    expect(welcome).toBeDefined();
    expect(welcome?.rewardFragments).toBe(WELCOME_BONUS_FRAGMENTS);
    expect(welcome?.rewardFragments).toBe(1000);
    expect(welcome?.period).toBe('once');
    expect(welcome?.category).toBe('BONUS');
    expect(welcome?.fragmentType).toBe('GENERATED_MISSION_BONUS');
  });

  it('uses a stable once period key', () => {
    const welcome = MISSION_DEFINITIONS.find((m) => m.key === WELCOME_BONUS_MISSION_KEY);
    expect(welcome).toBeDefined();
    expect(periodKeyFor(welcome!)).toBe('once');
  });
});
