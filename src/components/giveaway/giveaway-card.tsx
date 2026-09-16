'use client';

import { GiveawayShowcaseCard } from '@/components/giveaway/giveaway-showcase-card';
import type { GiveawayWithEntries } from '@/hooks/use-giveaways';
import type { Messages } from '~/utils/types';

export function GiveawayCard({
  giveaway,
  messages,
  now,
  selected = false,
  userFragments = 0,
  onSelect,
  onParticipate,
}: {
  giveaway: GiveawayWithEntries;
  messages: Messages;
  locale: string;
  now?: number;
  selected?: boolean;
  userFragments?: number;
  onSelect?: () => void;
  onParticipate?: (giveaway: GiveawayWithEntries, entries: number) => void | Promise<void>;
}) {
  return (
    <GiveawayShowcaseCard
      giveaway={giveaway}
      messages={messages}
      userFragments={userFragments}
      onParticipate={onParticipate}
      now={now}
      featured
      selected={selected}
      onActivate={onSelect}
    />
  );
}
