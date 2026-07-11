import {
  computeInstanceEndAt,
  computeNextSpawnAt,
  computeNextSpawnAtAfterDraw,
  seriesHasCapacityForInstance,
} from '@/lib/giveaway-recurrence';

describe('giveaway-recurrence', () => {
  it('planifie un spawn immédiat pour une série journalière de 24h', () => {
    const startDate = new Date('2026-07-01T00:00:00Z');
    const lastSpawnAt = new Date('2026-07-01T00:00:00Z');
    const endedAt = new Date('2026-07-02T00:00:00Z');

    const next = computeNextSpawnAtAfterDraw('DAILY', lastSpawnAt, startDate, endedAt);

    expect(next.getTime()).toBe(endedAt.getTime());
  });

  it('respecte la fréquence hebdomadaire entre deux instances courtes', () => {
    const startDate = new Date('2026-07-07T00:00:00Z');
    const lastSpawnAt = new Date('2026-07-07T00:00:00Z');
    const endedAt = new Date('2026-07-08T00:00:00Z');

    const next = computeNextSpawnAtAfterDraw('WEEKLY', lastSpawnAt, startDate, endedAt);

    expect(next.getTime()).toBe(computeNextSpawnAt('WEEKLY', lastSpawnAt).getTime());
    expect(next.getTime()).toBeGreaterThan(endedAt.getTime());
  });

  it('autorise une instance si elle se termine avant la date de fin de série', () => {
    const endDate = new Date('2026-07-10T00:00:00Z');
    const startAt = new Date('2026-07-09T12:00:00Z');

    expect(
      seriesHasCapacityForInstance({ endDate, durationMinutes: 60 * 12 }, startAt)
    ).toBe(true);
  });

  it('refuse une instance qui dépasserait la date de fin de série', () => {
    const endDate = new Date('2026-07-10T00:00:00Z');
    const startAt = new Date('2026-07-09T18:00:00Z');

    expect(
      seriesHasCapacityForInstance({ endDate, durationMinutes: 60 * 12 }, startAt)
    ).toBe(false);
  });

  it('calcule la fin d’instance à partir de la durée', () => {
    const startAt = new Date('2026-07-01T00:00:00Z');
    const endAt = computeInstanceEndAt(startAt, 120);
    expect(endAt.getTime()).toBe(new Date('2026-07-01T02:00:00Z').getTime());
  });
});
