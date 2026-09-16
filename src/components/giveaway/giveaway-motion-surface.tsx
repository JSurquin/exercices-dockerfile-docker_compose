'use client';

import { useFinePointer } from '@/hooks/use-fine-pointer';
import { useInView } from '@/hooks/use-in-view';
import { GIVEAWAY_FADE_Y, GIVEAWAY_PAGE_STAGGER_S, GIVEAWAY_TILT_MAX_DEG } from '@/lib/giveaway-motion';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion } from 'framer-motion';
import {
  useCallback,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
} from 'react';

function setTilt(target: HTMLElement, rotateX: number, rotateY: number) {
  target.style.setProperty('--tilt-x', `${rotateX.toFixed(2)}deg`);
  target.style.setProperty('--tilt-y', `${rotateY.toFixed(2)}deg`);
}

export function GiveawayMotionSurface({
  children,
  className,
  featured = false,
  tilt = true,
  style,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  featured?: boolean;
  tilt?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const { ref, inView } = useInView<HTMLDivElement>();
  const canTilt = Boolean(tilt && finePointer && !reduceMotion);

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!canTilt) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
      const offsetY = (event.clientY - rect.top) / rect.height - 0.5;
      setTilt(event.currentTarget, -offsetY * GIVEAWAY_TILT_MAX_DEG, offsetX * GIVEAWAY_TILT_MAX_DEG);
    },
    [canTilt]
  );

  const onPointerLeave = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!canTilt) return;
      setTilt(event.currentTarget, 0, 0);
    },
    [canTilt]
  );

  return (
    <div
      {...rest}
      ref={ref}
      className={cn(
        'giveaway-motion-surface',
        featured && 'giveaway-motion-surface--featured',
        className
      )}
      data-motion-active={inView && !reduceMotion ? 'true' : 'false'}
      data-tilt={canTilt ? 'true' : 'false'}
      style={style}
      onPointerMove={canTilt ? onPointerMove : rest.onPointerMove}
      onPointerLeave={canTilt ? onPointerLeave : rest.onPointerLeave}
    >
      {children}
      {canTilt ? <span className="giveaway-card-sheen" aria-hidden /> : null}
    </div>
  );
}

export function GiveawayPageReveal({
  children,
  index,
  className,
  as: Tag = 'div',
  fadeOnly = false,
}: {
  children: ReactNode;
  index: number;
  className?: string;
  as?: 'div' | 'header' | 'aside' | 'section';
  fadeOnly?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const MotionTag = motion[Tag];

  return (
    <MotionTag
      className={className}
      initial={reduceMotion ? false : fadeOnly ? { opacity: 0 } : { opacity: 0, y: GIVEAWAY_FADE_Y }}
      animate={fadeOnly ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: reduceMotion ? 0 : index * GIVEAWAY_PAGE_STAGGER_S, ease: 'easeOut' }}
    >
      {children}
    </MotionTag>
  );
}

export function giveawayTierSurfaceStyle(
  accent: string,
  tokens: { bg: string; fg: string; border: string }
): CSSProperties {
  return {
    '--giveaway-accent': accent,
    '--tier': accent,
    '--tier-soft': `color-mix(in srgb, ${accent} 15%, transparent)`,
    '--tier-glow': `color-mix(in srgb, ${accent} 40%, transparent)`,
    '--giveaway-tier-bg': tokens.bg,
    '--giveaway-tier-fg': tokens.fg,
    '--giveaway-tier-border': tokens.border,
  } as CSSProperties;
}
