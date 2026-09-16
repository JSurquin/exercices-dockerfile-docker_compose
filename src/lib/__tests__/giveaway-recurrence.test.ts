import {
  computeInstanceEndAt,
  computeNextSpawnAt,
  computeNextSpawnAtAfterDraw,
  isSeriesDueForSpawn,
  resolveInstanceStartAt,
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

  it('conserve un startAt encore dans sa fenêtre', () => {
    const requested = new Date('2026-07-01T00:00:00Z');
    const now = new Date('2026-07-01T10:00:00Z');
    expect(resolveInstanceStartAt(requested, 24 * 60, now).getTime()).toBe(requested.getTime());
  });

  it('replaque le startAt à maintenant si la fenêtre demandée est déjà finie', () => {
    const requested = new Date('2026-07-01T00:00:00Z');
    const now = new Date('2026-07-03T00:00:00Z');
    expect(resolveInstanceStartAt(requested, 24 * 60, now).getTime()).toBe(now.getTime());
  });

  it('considère due une série active sans nextSpawnAt ni instance live', () => {
    const now = new Date('2026-07-02T00:00:00Z');
    expect(
      isSeriesDueForSpawn(
        {
          status: 'ACTIVE',
          startDate: new Date('2026-07-01T00:00:00Z'),
          endDate: null,
          nextSpawnAt: null,
        },
        false,
        now
      )
    ).toBe(true);
  });

  it('n’est pas due tant qu’une instance live existe ou que le prochain spawn est dans le futur', () => {
    const now = new Date('2026-07-02T00:00:00Z');
    const series = {
      status: 'ACTIVE' as const,
      startDate: new Date('2026-07-01T00:00:00Z'),
      endDate: null,
      nextSpawnAt: null as Date | null,
    };
    expect(isSeriesDueForSpawn(series, true, now)).toBe(false);
    expect(
      isSeriesDueForSpawn(
        { ...series, nextSpawnAt: new Date('2026-07-08T00:00:00Z') },
        false,
        now
      )
    ).toBe(false);
  });
});
