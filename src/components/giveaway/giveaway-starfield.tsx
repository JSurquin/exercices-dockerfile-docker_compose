'use client';

import { useInView } from '@/hooks/use-in-view';
import { GIVEAWAY_STARFIELD } from '@/lib/giveaway-motion';
import { useReducedMotion } from 'framer-motion';
import { useEffect, type CSSProperties } from 'react';

export function GiveawayStarfield() {
  const reduceMotion = useReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>('0px', 0);

  useEffect(() => {
    const node = ref.current;
    if (!node || reduceMotion || !inView) return;
    const onScroll = () => {
      node.style.setProperty('--star-parallax', `${window.scrollY}px`);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [inView, reduceMotion, ref]);

  return (
    <div
      ref={ref}
      className="giveaway-starfield pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
      data-motion-active={inView && !reduceMotion ? 'true' : 'false'}
    >
      {GIVEAWAY_STARFIELD.map((star, index) => (
        <span
          key={index}
          className="giveaway-star"
          style={
            {
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
              '--star-depth': star.depth,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
