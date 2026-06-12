'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/providers/locale-provider';

interface FallingHeart {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  pink: boolean;
}

const HEART_COUNT_MIN = 20;
const HEART_COUNT_MAX = 30;
const COOLDOWN_MS = 1500;

function spawnHearts(batchId: number): FallingHeart[] {
  const count =
    HEART_COUNT_MIN + Math.floor(Math.random() * (HEART_COUNT_MAX - HEART_COUNT_MIN + 1));

  return Array.from({ length: count }, (_, index) => ({
    id: batchId + index,
    left: Math.random() * 100,
    size: 12 + Math.random() * 14,
    duration: 2000 + Math.random() * 1000,
    delay: Math.random() * 400,
    pink: Math.random() > 0.45,
  }));
}

export function HeartRainEasterEgg() {
  const { messages } = useLocale();
  const [hearts, setHearts] = useState<FallingHeart[]>([]);
  const [pulsing, setPulsing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cooldownRef = useRef(false);
  const batchIdRef = useRef(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setMounted(true);
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  const scheduleTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timeoutsRef.current.push(id);
  }, []);

  const triggerRain = useCallback(() => {
    if (cooldownRef.current) return;

    cooldownRef.current = true;
    setPulsing(true);
    scheduleTimeout(() => setPulsing(false), 400);

    batchIdRef.current += HEART_COUNT_MAX + 1;
    const batchId = batchIdRef.current;
    const newHearts = spawnHearts(batchId);
    const batchIds = new Set(newHearts.map((heart) => heart.id));

    setHearts((prev) => [...prev, ...newHearts]);

    const maxDuration = Math.max(...newHearts.map((heart) => heart.duration + heart.delay));
    scheduleTimeout(() => {
      setHearts((prev) => prev.filter((heart) => !batchIds.has(heart.id)));
    }, maxDuration + 150);

    scheduleTimeout(() => {
      cooldownRef.current = false;
    }, COOLDOWN_MS);
  }, [scheduleTimeout]);

  return (
    <>
      <button
        type="button"
        onClick={triggerRain}
        className={cn(
          'rounded-full p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent/50',
          pulsing && 'heart-easter-egg-pulse',
        )}
        aria-label={messages.partners.thanksAria}
      >
        <Heart className="h-8 w-8 text-theme-accent" strokeWidth={1.5} />
      </button>

      {mounted &&
        hearts.length > 0 &&
        createPortal(
          <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden" aria-hidden>
            {hearts.map((heart) => (
              <Heart
                key={heart.id}
                className={cn(
                  'heart-rain-item absolute top-0 fill-current',
                  heart.pink ? 'text-pink-400' : 'text-theme-accent',
                )}
                style={{
                  left: `${heart.left}%`,
                  width: heart.size,
                  height: heart.size,
                  animationDuration: `${heart.duration}ms`,
                  animationDelay: `${heart.delay}ms`,
                }}
                strokeWidth={0}
              />
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
