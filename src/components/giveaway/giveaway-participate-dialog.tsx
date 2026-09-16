'use client';

import { Badge } from '@/components/ui/badge';
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
import { formatCommunityName } from '@/lib/giveaway-presentation';
import { LockClosedIcon } from '@heroicons/react/24/outline';
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
  const communityLabel =
    giveaway.isPrivate && giveaway.requiredAffiliateCode
      ? card.communityName.replace('{name}', formatCommunityName(giveaway.requiredAffiliateCode))
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <span>{card.participateModalTitle}</span>
            {giveaway.isPrivate && (
              <Badge className="flex max-w-[12rem] items-center gap-1 truncate border border-purple-500/40 bg-purple-500/20 text-xs font-normal text-foreground">
                <LockClosedIcon className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{communityLabel ?? card.privateLabel}</span>
              </Badge>
            )}
          </DialogTitle>
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
