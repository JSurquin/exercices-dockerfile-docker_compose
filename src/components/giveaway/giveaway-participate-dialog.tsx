'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GiveawayEntryControl } from '@/components/giveaway/giveaway-entry-control';
import { GiveawayPrizeDetails } from '@/components/giveaway/giveaway-prize-visual';
import type { GiveawayWithEntries } from '@/hooks/use-giveaways';
import type { Messages } from '~/utils/types';

export function GiveawayParticipateDialog({
  open,
  onOpenChange,
  giveaway,
  messages,
  userFragments,
  onParticipate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  giveaway: GiveawayWithEntries;
  messages: Messages;
  userFragments: number;
  onParticipate: (giveaway: GiveawayWithEntries, entries: number) => void | Promise<void>;
}) {
  const card = messages.giveaways.card;
  const description = giveaway.description?.trim() ?? '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{card.participateModalTitle}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <GiveawayPrizeDetails giveaway={giveaway} layout="inline" />
        <GiveawayEntryControl
          giveaway={giveaway}
          messages={messages}
          userFragments={userFragments}
          onParticipate={async (target, entries) => {
            await onParticipate(target, entries);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
