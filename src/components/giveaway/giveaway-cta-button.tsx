'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FragmentAmount } from '@/components/ui/level-badge';
import type { GiveawayCardAction } from '@/lib/giveaway-presentation';
import { cn } from '@/lib/utils';
import { ArrowPathIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import type { Messages } from '~/utils/types';

function CostLabel({ template, cost }: { template: string; cost: number }) {
  const [before, after] = template.split('{cost}');
  return (
    <>
      {before}
      <FragmentAmount amount={cost} size="xs" className="font-semibold" />
      {after}
    </>
  );
}

function MissingLabel({ template, missing }: { template: string; missing: number }) {
  const [before, after] = template.split('{count}');
  return (
    <>
      {before}
      <FragmentAmount amount={missing} size="xs" className="font-semibold" />
      {after}
    </>
  );
}

export function GiveawayCtaButton({
  action,
  submitting = false,
  messages,
  ticketPrice,
  onParticipate,
  className,
  compact = false,
}: {
  action: GiveawayCardAction;
  submitting?: boolean;
  messages: Messages;
  ticketPrice: number;
  onParticipate?: () => void;
  className?: string;
  compact?: boolean;
}) {
  const card = messages.giveaways.card;
  const widthClass = compact ? 'w-auto' : 'w-full';

  if (submitting) {
    return (
      <Button type="button" variant="chrome" className={cn(widthClass, className)} disabled aria-busy>
        <ArrowPathIcon className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (action.type === 'reserved') {
    return (
      <Button type="button" variant="secondary" className={cn(widthClass, 'opacity-100', className)} disabled>
        <LockClosedIcon className="h-4 w-4" aria-hidden />
        {card.accessReserved}
      </Button>
    );
  }

  if (action.type === 'maxReached') {
    return (
      <Button type="button" variant="secondary" className={cn(widthClass, className)} disabled>
        {card.maxEntriesReached}
      </Button>
    );
  }

  if (action.type === 'unaffordable') {
    return (
      <Button
        type="button"
        variant="secondary"
        className={cn(widthClass, 'opacity-100', className)}
        asChild
      >
        <Link href="/missions" onClick={(event) => event.stopPropagation()}>
          <MissingLabel template={card.missingFragmentsCta} missing={action.missing} />
        </Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="chrome"
      className={cn(widthClass, className)}
      onClick={(event) => {
        event.stopPropagation();
        onParticipate?.();
      }}
      aria-label={card.participateCost.replace('{cost}', String(ticketPrice))}
    >
      <CostLabel template={card.participateCost} cost={ticketPrice} />
    </Button>
  );
}
