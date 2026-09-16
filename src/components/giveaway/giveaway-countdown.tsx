'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  formatCompactCountdown,
  getTimeRemaining,
  type CompactDurationLabels,
  type TimeRemaining,
} from '@/lib/giveaway-presentation';

export function useLiveNow(intervalMs = 1000, enabled = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, enabled]);
  return now;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function GiveawayCountdown({
  endDate,
  labels,
  className,
  now,
}: {
  endDate: Date | string;
  labels: { days: string; hours: string; minutes: string; seconds: string };
  className?: string;
  now?: number;
}) {
  const liveNow = useLiveNow(1000, now === undefined);
  const remaining = getTimeRemaining(endDate, now ?? liveNow);
  const units: { value: number; label: string }[] = [
    { value: remaining.days, label: labels.days },
    { value: remaining.hours, label: labels.hours },
    { value: remaining.minutes, label: labels.minutes },
    { value: remaining.seconds, label: labels.seconds },
  ];
  const accessibleLabel = units.map((unit) => `${pad(unit.value)} ${unit.label}`).join(' ');

  return (
    <div
      className={cn('flex items-end gap-2 sm:gap-3', className)}
      data-countdown
      role="timer"
      aria-label={accessibleLabel}
    >
      {units.map((unit, index) => (
        <div key={unit.label} className="flex items-end gap-2 sm:gap-3" aria-hidden>
          {index > 0 && (
            <span className="font-display pb-4 text-2xl text-foreground/55 sm:text-3xl">
              :
            </span>
          )}
          <div className="flex min-w-[2.75rem] flex-col items-center sm:min-w-[3.25rem]">
            <span
              className={cn(
                'font-display text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl',
                remaining.expired && 'text-foreground/70'
              )}
            >
              {pad(unit.value)}
            </span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-foreground/70">
              {unit.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function GiveawayCompactTime({
  remaining,
  expiredLabel,
  labels,
}: {
  remaining: TimeRemaining;
  expiredLabel: string;
  labels: CompactDurationLabels;
}) {
  return <>{formatCompactCountdown(remaining, labels, expiredLabel)}</>;
}
