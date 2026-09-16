'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GiveawayShowcaseCard } from '@/components/giveaway/giveaway-showcase-card';
import type { GiveawayWithEntries } from '@/hooks/use-giveaways';
import {
  carouselCoverflowTransform,
  carouselSignedOffset,
  getCarouselBreakpoint,
  parsePrizeDisplay,
  type CarouselBreakpoint,
} from '@/lib/giveaway-presentation';
import { cn } from '@/lib/utils';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { Messages } from '~/utils/types';

const SWIPE_THRESHOLD = 48;

function useCarouselBreakpoint(): CarouselBreakpoint {
  const [breakpoint, setBreakpoint] = useState<CarouselBreakpoint>('desktop');

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const tabletQuery = window.matchMedia('(min-width: 768px)');
    const update = () => {
      setBreakpoint(getCarouselBreakpoint(window.innerWidth));
    };
    update();
    desktopQuery.addEventListener('change', update);
    tabletQuery.addEventListener('change', update);
    return () => {
      desktopQuery.removeEventListener('change', update);
      tabletQuery.removeEventListener('change', update);
    };
  }, []);

  return breakpoint;
}

export function GiveawayRecurringCarousel({
  giveaways,
  messages,
  userFragments,
  onParticipate,
  now,
  activeIndex,
  onActiveIndexChange,
}: {
  giveaways: GiveawayWithEntries[];
  messages: Messages;
  userFragments: number;
  onParticipate: (giveaway: GiveawayWithEntries, entries: number) => void | Promise<void>;
  now?: number;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
}) {
  const layout = messages.giveaways.layout;
  const reduceMotion = useReducedMotion();
  const breakpoint = useCarouselBreakpoint();
  const count = giveaways.length;
  const safeIndex = count === 0 ? 0 : ((activeIndex % count) + count) % count;
  const activeGiveaway = giveaways[safeIndex];
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const skipClick = useRef(false);

  const goTo = (index: number) => {
    if (count <= 1) return;
    onActiveIndexChange(((index % count) + count) % count);
  };

  const parsedActive = activeGiveaway
    ? parsePrizeDisplay(activeGiveaway.prize, activeGiveaway.steamMarketHashName)
    : null;
  const liveLabel = parsedActive
    ? parsedActive.hasStructuredName
      ? `${parsedActive.weapon} ${parsedActive.finish}`
      : parsedActive.fallbackName
    : '';

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (count <= 1) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(safeIndex - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(safeIndex + 1);
    }
  };

  return (
    <section
      id="recurring-giveaways"
      data-tour="giveaways-tabs"
      className="mb-8 scroll-mt-24"
      aria-label={layout.recurringSectionTitle}
      aria-roledescription={layout.carouselRole}
      role="region"
      onKeyDown={handleKeyDown}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">{layout.recurringSectionTitle}</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-foreground/80"
          onClick={() => {
            document.getElementById('past-winners')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          {layout.history}
        </Button>
      </div>

      {count === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-card/60 px-4 py-8 text-center text-sm text-foreground/70">
          {layout.emptyFiltered}
        </p>
      ) : (
        <div className="giveaway-recurring-carousel" data-carousel-bp={breakpoint}>
          <p className="sr-only" aria-live="polite">
            {liveLabel}
          </p>
          <div className="giveaway-recurring-carousel__row">
            {count > 1 ? (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="giveaway-recurring-carousel__nav giveaway-recurring-carousel__nav--prev"
                onClick={() => goTo(safeIndex - 1)}
                aria-label={layout.carouselPrevious}
              >
                <ChevronLeftIcon className="h-5 w-5" aria-hidden />
              </Button>
            ) : null}

            <div
              className="giveaway-recurring-carousel__stage"
              onPointerDown={(event) => {
                if (count <= 1 || event.pointerType === 'mouse') return;
                pointerStart.current = { x: event.clientX, y: event.clientY };
                skipClick.current = false;
              }}
              onPointerUp={(event) => {
                if (!pointerStart.current || count <= 1) return;
                const dx = event.clientX - pointerStart.current.x;
                const dy = event.clientY - pointerStart.current.y;
                pointerStart.current = null;
                if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
                skipClick.current = true;
                goTo(dx < 0 ? safeIndex + 1 : safeIndex - 1);
              }}
              onPointerCancel={() => {
                pointerStart.current = null;
              }}
            >
              {giveaways
                .map((giveaway, index) => {
                  const offset = carouselSignedOffset(index, safeIndex, count);
                  const coverflow = carouselCoverflowTransform(offset, breakpoint);
                  return { giveaway, index, offset, coverflow };
                })
                .filter((slide) => slide.coverflow.visible)
                .sort((a, b) => a.offset - b.offset)
                .map(({ giveaway, index, offset, coverflow }) => {
                  const featured = offset === 0;
                  return (
                    <motion.div
                      key={giveaway.id}
                      layout={!reduceMotion}
                      className={cn(
                        'giveaway-recurring-carousel__slide',
                        featured && 'giveaway-recurring-carousel__slide--active',
                        Math.abs(offset) === 1 && 'giveaway-recurring-carousel__slide--near'
                      )}
                      initial={false}
                      animate={{
                        scale: coverflow.scale,
                        opacity: coverflow.opacity,
                      }}
                      transition={reduceMotion ? { duration: 0 } : { duration: 0.25, ease: 'easeInOut' }}
                      style={{ width: coverflow.width }}
                      aria-current={featured ? 'true' : undefined}
                    >
                      <GiveawayShowcaseCard
                        giveaway={giveaway}
                        messages={messages}
                        userFragments={userFragments}
                        onParticipate={onParticipate}
                        now={now}
                        featured={featured}
                        onActivate={() => {
                          if (skipClick.current) {
                            skipClick.current = false;
                            return;
                          }
                          goTo(index);
                        }}
                      />
                    </motion.div>
                  );
                })}
            </div>

            {count > 1 ? (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="giveaway-recurring-carousel__nav giveaway-recurring-carousel__nav--next"
                onClick={() => goTo(safeIndex + 1)}
                aria-label={layout.carouselNext}
              >
                <ChevronRightIcon className="h-5 w-5" aria-hidden />
              </Button>
            ) : null}
          </div>

          {count > 1 ? (
            <div className="giveaway-recurring-carousel__dots" role="tablist" aria-label={layout.recurringSectionTitle}>
              {giveaways.map((giveaway, index) => {
                const parsed = parsePrizeDisplay(giveaway.prize, giveaway.steamMarketHashName);
                const name = parsed.hasStructuredName ? parsed.finish : parsed.fallbackName;
                const selected = index === safeIndex;
                return (
                  <button
                    key={giveaway.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-label={layout.carouselGoTo.replace('{name}', name)}
                    className={cn(
                      'giveaway-recurring-carousel__dot focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selected && 'giveaway-recurring-carousel__dot--active'
                    )}
                    onClick={() => goTo(index)}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
