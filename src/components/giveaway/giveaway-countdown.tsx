'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  formatCompactCountdown,
  getTimeRemaining,
  type CompactDurationLabels,
  type TimeRemaining,
} from '@/lib/giveaway-presentation';

export function useLiveNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
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
  const liveNow = useLiveNow();
  const remaining = getTimeRemaining(endDate, now ?? liveNow);
  const units: { value: number; label: string }[] = [
    { value: remaining.days, label: labels.days },
    { value: remaining.hours, label: labels.hours },
    { value: remaining.minutes, label: labels.minutes },
    { value: remaining.seconds, label: labels.seconds },
  ];

  return (
    <div
      className={cn('flex items-end gap-2 sm:gap-3', className)}
      data-countdown
      aria-live="polite"
    >
      {units.map((unit, index) => (
        <div key={unit.label} className="flex items-end gap-2 sm:gap-3">
          {index > 0 && (
            <span className="font-display pb-5 text-2xl text-muted-foreground/70 sm:text-3xl">
              :
            </span>
          )}
          <div className="flex min-w-[3.25rem] flex-col items-center sm:min-w-[3.75rem]">
            <span
              className={cn(
                'font-display text-3xl font-semibold tabular-nums tracking-tight sm:text-5xl',
                remaining.expired && 'text-muted-foreground'
              )}
            >
              {pad(unit.value)}
            </span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
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
