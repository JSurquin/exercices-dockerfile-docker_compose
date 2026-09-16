import {
  endDateFromDurationMinutes,
  isKnownDurationPreset,
  remainingMinutesUntil,
  toDatetimeLocalValue,
} from '@/lib/giveaway-duration-presets';

describe('giveaway duration presets', () => {
  it('recognizes built-in presets and custom values', () => {
    expect(isKnownDurationPreset(60)).toBe(true);
    expect(isKnownDurationPreset(24 * 60)).toBe(true);
    expect(isKnownDurationPreset(7 * 24 * 60)).toBe(true);
    expect(isKnownDurationPreset(30 * 24 * 60)).toBe(true);
    expect(isKnownDurationPreset(90)).toBe(false);
  });

  it('computes remaining minutes with a one-minute floor', () => {
    const now = Date.parse('2026-09-16T12:00:00.000Z');
    expect(remainingMinutesUntil('2026-09-16T13:00:00.000Z', now)).toBe(60);
    expect(remainingMinutesUntil('2026-09-16T11:00:00.000Z', now)).toBe(1);
  });

  it('adds duration minutes to the current time', () => {
    const now = new Date('2026-09-16T12:00:00.000Z');
    expect(endDateFromDurationMinutes(60, now).toISOString()).toBe('2026-09-16T13:00:00.000Z');
  });

  it('formats a local datetime-local value without seconds', () => {
    const date = new Date(2026, 8, 16, 9, 5);
    expect(toDatetimeLocalValue(date)).toBe('2026-09-16T09:05');
  });
});
