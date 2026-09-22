'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FragmentAmount } from '@/components/ui/level-badge';
import { GIVEAWAY_COUNT_UP_MS } from '@/lib/giveaway-motion';

export type MissionClaimFlyPoint = { x: number; y: number };

export function MissionClaimFly({
  amount,
  from,
  to,
  onDone,
}: {
  amount: number;
  from: MissionClaimFlyPoint;
  to: MissionClaimFlyPoint;
  onDone: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const duration = GIVEAWAY_COUNT_UP_MS / 1000;

  useEffect(() => {
    if (!reduceMotion) return;
    onDone();
  }, [reduceMotion, onDone]);

  if (reduceMotion) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="mission-claim-fly"
        initial={{ opacity: 1, x: from.x, y: from.y, scale: 1 }}
        animate={{
          opacity: [1, 1, 0],
          x: [from.x, to.x],
          y: [from.y, to.y],
          scale: [1, 0.85, 0.7],
        }}
        transition={{ duration, ease: 'easeOut', times: [0, 0.75, 1] }}
        onAnimationComplete={onDone}
        aria-hidden
      >
        <FragmentAmount amount={amount} prefix="+" size="xs" className="mission-quest__reward" />
      </motion.div>
    </AnimatePresence>
  );
}
