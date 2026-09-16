'use client';

import { Progress } from '@/components/ui/progress';
import { useInView } from '@/hooks/use-in-view';
import { cn } from '@/lib/utils';
import { useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export function GiveawayAnimatedProgress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>();
  const [shown, setShown] = useState(reduceMotion ? value : 0);
  const appeared = useRef(false);

  useEffect(() => {
    if (reduceMotion) {
      setShown(value);
      appeared.current = true;
      return;
    }
    if (!inView) return;
    if (!appeared.current) {
      appeared.current = true;
      setShown(0);
      const frame = window.requestAnimationFrame(() => setShown(value));
      return () => window.cancelAnimationFrame(frame);
    }
    setShown(value);
  }, [inView, reduceMotion, value]);

  return (
    <div
      ref={ref}
      className="giveaway-progress"
      data-motion-active={inView && !reduceMotion ? 'true' : 'false'}
    >
      <Progress value={shown} className={cn('giveaway-progress__bar', className)} />
    </div>
  );
}
