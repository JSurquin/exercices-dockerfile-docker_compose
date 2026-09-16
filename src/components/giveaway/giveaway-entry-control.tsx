'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { GiveawayCtaButton } from '@/components/giveaway/giveaway-cta-button';
import type { GiveawayWithEntries } from '@/hooks/use-giveaways';
import { getGiveawayCardAction, getGiveawayEntryLimits } from '@/lib/giveaway-presentation';
import { cn } from '@/lib/utils';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { Messages } from '~/utils/types';

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
  const action = getGiveawayCardAction(giveaway, userFragments);
  const limits = getGiveawayEntryLimits(giveaway, userFragments);
  const maxSelectable = limits.maxSelectable;
  const limitReached = action.type === 'maxReached';
  const totalCost = entriesToBuy * giveaway.ticketPrice;

  useEffect(() => {
    setEntriesToBuy((current) => {
      if (limitReached || maxSelectable < 1) return 1;
      return Math.min(Math.max(1, current), maxSelectable);
    });
  }, [limitReached, maxSelectable]);

  const setQuantity = (value: number) => {
    if (maxSelectable < 1) return;
    setEntriesToBuy(Math.min(Math.max(1, value), maxSelectable));
  };

  const handleParticipate = async () => {
    if (submitting || action.type !== 'participate') return;
    setSubmitting(true);
    try {
      await onParticipate(giveaway, entriesToBuy);
    } finally {
      setSubmitting(false);
    }
  };

  const quantityDisabled = submitting || limitReached || maxSelectable < 1;
  const showQuantity = action.type === 'participate' || action.type === 'unaffordable';

  return (
    <div className={cn('space-y-2', compact ? '' : 'space-y-3')}>
      {showQuantity && (
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

      <GiveawayCtaButton
        action={
          action.type === 'participate' && entriesToBuy > 1
            ? { type: 'participate' }
            : action
        }
        submitting={submitting}
        messages={messages}
        ticketPrice={action.type === 'participate' ? totalCost : giveaway.ticketPrice}
        onParticipate={() => void handleParticipate()}
      />

      {showQuantity && action.type === 'participate' && (
        <p className="text-xs text-foreground/70">
          {card.costLabel.replace('{cost}', String(totalCost))}
        </p>
      )}
    </div>
  );
}
