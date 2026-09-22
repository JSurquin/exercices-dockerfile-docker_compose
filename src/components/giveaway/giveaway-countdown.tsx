'use client';

import { cn } from '@/lib/utils';
import {
  formatCompactCountdown,
  getTimeRemaining,
  isUrgentGiveawayCountdown,
  type CompactDurationLabels,
  type TimeRemaining,
} from '@/lib/giveaway-presentation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const LiveNowContext = createContext<number | undefined>(undefined);

function useLiveNowClock(intervalMs: number, enabled: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, enabled]);
  return now;
}

export function LiveNowProvider({
  children,
  intervalMs = 1000,
}: {
  children: ReactNode;
  intervalMs?: number;
}) {
  const now = useLiveNowClock(intervalMs, true);
  return <LiveNowContext.Provider value={now}>{children}</LiveNowContext.Provider>;
}

export function useLiveNow(intervalMs = 1000, enabled = true): number {
  const shared = useContext(LiveNowContext);
  const self = useLiveNowClock(intervalMs, enabled && shared === undefined);
  return shared ?? self;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function GiveawayFlipText({ value, className }: { value: string; className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <span className={cn('giveaway-flip', className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          className="giveaway-flip__value"
          initial={reduceMotion ? false : { y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduceMotion ? undefined : { y: -12, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function GiveawayCountdown({
  endDate,
  labels,
  className,
  now,
  compact = false,
}: {
  endDate: Date | string;
  labels: { days: string; hours: string; minutes: string; seconds: string };
  className?: string;
  now?: number;
  compact?: boolean;
}) {
  const liveNow = useLiveNow(1000, now === undefined);
  const remaining = getTimeRemaining(endDate, now ?? liveNow);
  const urgent = isUrgentGiveawayCountdown(remaining);
  const units: { value: number; label: string; seconds?: boolean }[] = [
    { value: remaining.days, label: labels.days },
    { value: remaining.hours, label: labels.hours },
    { value: remaining.minutes, label: labels.minutes },
    { value: remaining.seconds, label: labels.seconds, seconds: true },
  ];
  const accessibleLabel = units.map((unit) => `${pad(unit.value)} ${unit.label}`).join(' ');

  return (
    <div
      className={cn(
        'flex items-end gap-2 sm:gap-3',
        compact && 'gap-1.5 sm:gap-2',
        urgent && 'giveaway-countdown--urgent',
        className
      )}
      data-countdown
      data-urgent={urgent ? 'true' : 'false'}
      role="timer"
      aria-label={accessibleLabel}
    >
      {units.map((unit, index) => (
        <div key={unit.label} className={cn('flex items-end gap-2 sm:gap-3', compact && 'gap-1.5 sm:gap-2')} aria-hidden>
          {index > 0 && (
            <span
              className={cn(
                'font-display pb-4 text-2xl text-foreground/70 sm:text-3xl',
                compact && 'pb-3 text-xl sm:text-2xl'
              )}
            >
              :
            </span>
          )}
          <div
            className={cn(
              'flex min-w-[2.75rem] flex-col items-center sm:min-w-[3.25rem]',
              compact && 'min-w-[2.25rem] sm:min-w-[2.75rem]'
            )}
          >
            <GiveawayFlipText
              value={pad(unit.value)}
              className={cn(
                'font-display text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl',
                compact && 'text-2xl sm:text-3xl',
                remaining.expired && 'text-foreground/70',
                unit.seconds && !remaining.expired && !urgent && 'giveaway-countdown__seconds',
                urgent && !remaining.expired && 'giveaway-countdown__urgent-value'
              )}
            />
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
  return <GiveawayFlipText value={formatCompactCountdown(remaining, labels, expiredLabel)} />;
}
