'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GiveawayShowcaseCard } from '@/components/giveaway/giveaway-showcase-card';
import type { GiveawayWithEntries } from '@/hooks/use-giveaways';
import { carouselSignedOffset } from '@/lib/giveaway-presentation';
import { cn } from '@/lib/utils';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { Messages } from '~/utils/types';

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
  const count = giveaways.length;
  const safeIndex = count === 0 ? 0 : ((activeIndex % count) + count) % count;

  const scrollToHistory = () => {
    document.getElementById('past-winners')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section
      id="recurring-giveaways"
      data-tour="giveaways-tabs"
      className="mb-8 scroll-mt-24"
      aria-label={layout.recurringSectionTitle}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">{layout.recurringSectionTitle}</h2>
        <Button type="button" variant="ghost" size="sm" className="text-foreground/80" onClick={scrollToHistory}>
          {layout.history}
        </Button>
      </div>

      {count === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-card/60 px-4 py-8 text-center text-sm text-foreground/70">
          {layout.emptyFiltered}
        </p>
      ) : (
        <div
          className="giveaway-recurring-carousel relative"
          tabIndex={count > 1 ? 0 : undefined}
          onKeyDown={(event) => {
            if (count <= 1) return;
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              onActiveIndexChange((safeIndex - 1 + count) % count);
            }
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              onActiveIndexChange((safeIndex + 1) % count);
            }
          }}
        >
          {count > 1 ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="giveaway-recurring-carousel__nav giveaway-recurring-carousel__nav--prev"
                onClick={() => onActiveIndexChange((safeIndex - 1 + count) % count)}
                aria-label={layout.carouselPrevious}
              >
                <ChevronLeftIcon className="h-5 w-5" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="giveaway-recurring-carousel__nav giveaway-recurring-carousel__nav--next"
                onClick={() => onActiveIndexChange((safeIndex + 1) % count)}
                aria-label={layout.carouselNext}
              >
                <ChevronRightIcon className="h-5 w-5" aria-hidden />
              </Button>
            </>
          ) : null}

          <div className="giveaway-recurring-carousel__stage">
            {giveaways.map((giveaway, index) => {
              const offset = carouselSignedOffset(index, safeIndex, count);
              const featured = offset === 0;
              const hidden = Math.abs(offset) > 1;
              return (
                <motion.div
                  key={giveaway.id}
                  className={cn(
                    'giveaway-recurring-carousel__slide',
                    featured && 'giveaway-recurring-carousel__slide--active',
                    hidden && 'pointer-events-none'
                  )}
                  initial={false}
                  animate={{
                    x: `${offset * 92}%`,
                    scale: featured ? 1 : hidden ? 0.62 : 0.78,
                    opacity: hidden ? 0 : featured ? 1 : 0.72,
                    zIndex: featured ? 4 : hidden ? 0 : 3 - Math.abs(offset),
                  }}
                  transition={
                    reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 28 }
                  }
                  aria-current={featured ? 'true' : undefined}
                >
                  <GiveawayShowcaseCard
                    giveaway={giveaway}
                    messages={messages}
                    userFragments={userFragments}
                    onParticipate={onParticipate}
                    now={now}
                    featured={featured}
                    onActivate={() => onActiveIndexChange(index)}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
