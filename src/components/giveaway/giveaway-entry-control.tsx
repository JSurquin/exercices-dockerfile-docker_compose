'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FragmentAmount } from '@/components/ui/level-badge';
import type { GiveawayWithEntries } from '@/hooks/use-giveaways';
import { getGiveawayEntryLimits } from '@/lib/giveaway-presentation';
import { cn } from '@/lib/utils';
import { ArrowPathIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { Messages } from '~/utils/types';

function scrollToEarnFragments() {
  document.getElementById('earn-fragments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function GiveawayEntryControl({
  giveaway,
  messages,
  userFragments,
  onParticipate,
  compact = false,
}: {
  giveaway: GiveawayWithEntries;
  messages: Messages;
  userFragments: number;
  onParticipate: (giveaway: GiveawayWithEntries, entries: number) => void | Promise<void>;
  compact?: boolean;
}) {
  const [entriesToBuy, setEntriesToBuy] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const card = messages.giveaways.card;
  const limits = getGiveawayEntryLimits(giveaway, userFragments);
  const maxSelectable = limits.maxSelectable;
  const maxReached = limits.maxReached;
  const totalCost = entriesToBuy * giveaway.ticketPrice;
  const missing = Math.max(0, totalCost - userFragments);
  const unaffordable = !maxReached && missing > 0;

  useEffect(() => {
    setEntriesToBuy((current) => {
      if (maxReached) return 1;
      const upper = Math.max(1, maxSelectable || 1);
      return Math.min(Math.max(1, current), upper);
    });
  }, [maxReached, maxSelectable]);

  const setQuantity = (value: number) => {
    const upper = Math.max(1, maxSelectable || 1);
    setEntriesToBuy(Math.min(Math.max(1, value), upper));
  };

  const handleParticipate = async () => {
    if (submitting || maxReached || unaffordable) return;
    setSubmitting(true);
    try {
      await onParticipate(giveaway, entriesToBuy);
    } finally {
      setSubmitting(false);
    }
  };

  const quantityDisabled = submitting || maxReached || maxSelectable < 1;

  return (
    <div className={cn('space-y-2', compact ? '' : 'space-y-3')}>
      {!maxReached && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center overflow-hidden rounded-md border border-white/10 bg-white/5">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center text-foreground/70 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
              onClick={() => setQuantity(entriesToBuy - 1)}
              disabled={quantityDisabled || entriesToBuy <= 1}
              aria-label={card.decreaseEntries}
            >
              <MinusIcon className="h-4 w-4" aria-hidden />
            </button>
            <span className="min-w-[2.25rem] text-center font-display text-sm tabular-nums">
              {entriesToBuy}
            </span>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center text-foreground/70 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
              onClick={() => setQuantity(entriesToBuy + 1)}
              disabled={quantityDisabled || entriesToBuy >= Math.max(1, maxSelectable)}
              aria-label={card.increaseEntries}
            >
              <PlusIcon className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setQuantity(maxSelectable)}
            disabled={quantityDisabled || maxSelectable < 1}
          >
            {card.maxButton}
          </Button>
        </div>
      )}

      {maxReached ? (
        <Button type="button" variant="secondary" className="w-full" disabled>
          {card.maxEntriesReached}
        </Button>
      ) : unaffordable ? (
        <Button
          type="button"
          variant="secondary"
          className="w-full opacity-100"
          onClick={scrollToEarnFragments}
        >
          {card.missingFragmentsCta.replace('{count}', String(missing))}
        </Button>
      ) : (
        <Button
          type="button"
          variant="chrome"
          className="w-full"
          onClick={() => void handleParticipate()}
          disabled={submitting}
          aria-busy={submitting}
          aria-label={card.participateCost.replace('{cost}', String(totalCost))}
        >
          {submitting ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {card.participateCost.split('{cost}')[0]}
              <FragmentAmount amount={totalCost} size="xs" className="font-semibold" />
            </>
          )}
        </Button>
      )}

      {!maxReached && (
        <p className="text-xs text-foreground/70">
          {card.costLabel.replace('{cost}', String(totalCost))}
        </p>
      )}
    </div>
  );
}
