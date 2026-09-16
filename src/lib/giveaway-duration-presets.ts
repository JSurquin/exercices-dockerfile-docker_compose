import { GIVEAWAY_DURATION_PRESETS } from '@/lib/admin-constants';

export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function remainingMinutesUntil(endDate: Date | string, now = Date.now()): number {
  const ms = new Date(endDate).getTime() - now;
  return Math.max(1, Math.round(ms / 60_000));
}

export function endDateFromDurationMinutes(durationMinutes: number, now = new Date()): Date {
  const end = new Date(now);
  end.setMinutes(end.getMinutes() + durationMinutes);
  return end;
}

export function isKnownDurationPreset(minutes: number): boolean {
  return GIVEAWAY_DURATION_PRESETS.some((preset) => preset.minutes === minutes);
}
