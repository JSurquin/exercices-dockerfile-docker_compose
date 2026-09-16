'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { FragmentAmount } from '@/components/ui/level-badge';
import type { GiveawayWithEntries } from '@/hooks/use-giveaways';
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
  onParticipate: (giveaway: GiveawayWithEntries, entries: number) => void;
  compact?: boolean;
}) {
  const [entriesToBuy, setEntriesToBuy] = useState(1);
  const fg = messages.giveaways.fragments;
  const myEntries = giveaway.myEntries ?? 0;
  const poolLeft = giveaway.maxTickets - giveaway.soldTickets;
  const maxPerUser =
    giveaway.maxEntriesPerUser != null ? Math.max(0, giveaway.maxEntriesPerUser - myEntries) : poolLeft;
  const maxAffordable = giveaway.ticketPrice > 0 ? Math.floor(userFragments / giveaway.ticketPrice) : 0;
  const maxSelectable = Math.max(0, Math.min(poolLeft, maxPerUser, maxAffordable));
  const totalCost = entriesToBuy * giveaway.ticketPrice;

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {userFragments < giveaway.ticketPrice && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <FragmentAmount amount={userFragments} size="xs" />
              <span>/</span>
              <FragmentAmount amount={giveaway.ticketPrice} size="xs" />
              <span>{messages.giveaways.card.fragmentsLabel}</span>
            </span>
            <span className="font-medium text-theme-stat">
              {messages.giveaways.card.fragmentsRemaining.replace(
                '{count}',
                String(giveaway.ticketPrice - userFragments)
              )}
            </span>
          </div>
          <Progress
            value={Math.min(100, (userFragments / giveaway.ticketPrice) * 100)}
            className="h-1.5 bg-muted [&>div]:bg-theme-stat"
          />
        </div>
      )}
      <Label htmlFor={`entries-${giveaway.id}`} className="text-sm">
        {fg.entriesToBuy}
      </Label>
      <div className="flex space-x-2">
        <Input
          id={`entries-${giveaway.id}`}
          type="number"
          min="1"
          max={Math.max(1, maxSelectable)}
          value={entriesToBuy}
          onChange={(e) => {
            const v = Math.max(1, parseInt(e.target.value, 10) || 1);
            setEntriesToBuy(Math.min(v, Math.max(1, maxSelectable)));
          }}
          className="flex-1"
        />
        <Button
          variant="chrome"
          onClick={() => onParticipate(giveaway, entriesToBuy)}
          disabled={
            maxSelectable < 1 ||
            userFragments < totalCost ||
            entriesToBuy > poolLeft ||
            entriesToBuy > maxPerUser
          }
        >
          {messages.giveaways.card.participate}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {messages.giveaways.youHave} {userFragments} {fg.entriesAvailable},{' '}
        {messages.giveaways.card.costLabel.replace('{cost}', String(totalCost))}
      </p>
    </div>
  );
}
