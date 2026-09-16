'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';

const BURST_ANGLES = [-70, -40, -12, 16, 42, 68, -88, 88, 0, 28, -28, 54];

export function GiveawayEntryBurst({
  burstId,
  count,
  label,
}: {
  burstId: number;
  count: number;
  label: string;
}) {
  const reduceMotion = useReducedMotion();
  const particles = useMemo(
    () =>
      BURST_ANGLES.map((angle, index) => {
        const radians = (angle * Math.PI) / 180;
        const distance = 42 + (index % 4) * 10;
        return {
          x: Math.cos(radians) * distance,
          y: Math.sin(radians) * distance - 8,
        };
      }),
    []
  );

  if (reduceMotion || burstId <= 0) return null;

  return (
    <div className="giveaway-entry-burst pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
      <AnimatePresence>
        <motion.span
          key={`label-${burstId}`}
          className="giveaway-entry-burst__label"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: [0, 1, 1, 0], y: [8, -4, -16, -28] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, times: [0, 0.18, 0.7, 1], ease: 'easeOut' }}
        >
          {label.replace('{count}', String(count))}
        </motion.span>
        {particles.map((particle, index) => (
          <motion.span
            key={`${burstId}-${index}`}
            className="giveaway-entry-burst__star"
            initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
            animate={{ opacity: [0, 1, 0], x: particle.x, y: particle.y, scale: [0.4, 1, 0.3] }}
            transition={{ duration: 0.7, delay: index * 0.012, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
