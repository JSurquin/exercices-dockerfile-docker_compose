import { isHomePopupWithinSchedule } from '@/lib/get-public-home-popups';

describe('isHomePopupWithinSchedule', () => {
  const now = new Date('2026-07-10T12:00:00.000Z');

  it('returns true when no schedule bounds are set', () => {
    expect(isHomePopupWithinSchedule({ startsAt: null, endsAt: null }, now)).toBe(true);
  });

  it('returns false before start date', () => {
    expect(
      isHomePopupWithinSchedule(
        { startsAt: new Date('2026-07-11T00:00:00.000Z'), endsAt: null },
        now
      )
    ).toBe(false);
  });

  it('returns false after end date', () => {
    expect(
      isHomePopupWithinSchedule(
        { startsAt: null, endsAt: new Date('2026-07-09T23:59:59.000Z') },
        now
      )
    ).toBe(false);
  });

  it('returns true inside the schedule window', () => {
    expect(
      isHomePopupWithinSchedule(
        {
          startsAt: new Date('2026-07-10T00:00:00.000Z'),
          endsAt: new Date('2026-07-10T23:59:59.000Z'),
        },
        now
      )
    ).toBe(true);
  });
});
