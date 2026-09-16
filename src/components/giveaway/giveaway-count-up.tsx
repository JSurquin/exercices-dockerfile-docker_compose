'use client';

import { FragmentBadge } from '@/components/ui/level-badge';
import { useInView } from '@/hooks/use-in-view';
import { GIVEAWAY_COUNT_UP_MS, giveawayStatRevealDelayMs } from '@/lib/giveaway-motion';
import { cn } from '@/lib/utils';
import { useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';

function easeOutQuad(progress: number): number {
  return 1 - (1 - progress) * (1 - progress);
}

export function useGiveawayCountUp(value: number, enabled: boolean, durationMs = GIVEAWAY_COUNT_UP_MS): number {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(0);
  const previous = useRef(0);
  const entered = useRef(false);

  useEffect(() => {
    if (reduceMotion) {
      setShown(value);
      previous.current = value;
      entered.current = true;
      return;
    }
    if (!enabled) {
      if (!entered.current) {
        setShown(0);
        return;
      }
      setShown(value);
      previous.current = value;
      return;
    }

    const from = entered.current ? previous.current : 0;
    entered.current = true;
    previous.current = value;
    if (from === value) {
      setShown(value);
      return;
    }

    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / durationMs);
      setShown(from + (value - from) * easeOutQuad(progress));
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [durationMs, enabled, reduceMotion, value]);

  return shown;
}

export function useGiveawayBurstSyncedValue<T>(value: T, burstId: number): T {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(value);
  const lastBurst = useRef(burstId);

  useEffect(() => {
    const burstChanged = burstId !== lastBurst.current;
    lastBurst.current = burstId;
    const delay = burstChanged ? giveawayStatRevealDelayMs(burstId, Boolean(reduceMotion)) : 0;
    if (delay === 0) {
      setShown(value);
      return;
    }
    const id = window.setTimeout(() => setShown(value), delay);
    return () => window.clearTimeout(id);
  }, [burstId, reduceMotion, value]);

  return shown;
}

export function GiveawayCountUpMessage({
  template,
  token,
  value,
  format,
  decimals = 0,
}: {
  template: string;
  token: string;
  value: number;
  format?: (value: number) => string;
  decimals?: number;
}): ReactNode {
  const [before, after = ''] = template.split(token);
  return (
    <>
      {before}
      <GiveawayCountUp value={value} format={format} decimals={decimals} />
      {after}
    </>
  );
}

export function GiveawayCountUp({
  value,
  format,
  className,
  decimals = 0,
}: {
  value: number;
  format?: (value: number) => string;
  className?: string;
  decimals?: number;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const shown = useGiveawayCountUp(value, inView);
  const rounded = decimals > 0 ? Number(shown.toFixed(decimals)) : Math.round(shown);
  const label = format ? format(value) : (decimals > 0 ? value.toFixed(decimals) : String(Math.round(value)));
  const visible = format ? format(rounded) : decimals > 0 ? rounded.toFixed(decimals) : String(rounded);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      <span className="sr-only">{label}</span>
      <span aria-hidden>{visible}</span>
    </span>
  );
}

export function GiveawayFragmentCount({
  amount,
  size = 'xs',
  className,
}: {
  amount: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1 overflow-visible', className)}>
      <GiveawayCountUp value={amount} />
      <FragmentBadge size={size} />
    </span>
  );
}
