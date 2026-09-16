'use client';

import { Button } from '@/components/ui/button';
import { GiveawayAnimatedProgress } from '@/components/giveaway/giveaway-animated-progress';
import { GiveawayEntryBurst } from '@/components/giveaway/giveaway-entry-burst';
import { FragmentAmount } from '@/components/ui/level-badge';
import type { GiveawayCardAction, GiveawayVisualTier } from '@/lib/giveaway-presentation';
import { fragmentsEntryProgressPercent, getGiveawayTierCtaColors } from '@/lib/giveaway-presentation';
import { cn } from '@/lib/utils';
import { ArrowPathIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import type { CSSProperties } from 'react';
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
  userFragments = 0,
  onParticipate,
  onEarnFragments,
  className,
  compact = false,
  interactive = true,
  layout = 'default',
  tier,
  burstId = 0,
  burstCount = 1,
}: {
  action: GiveawayCardAction;
  submitting?: boolean;
  messages: Messages;
  ticketPrice: number;
  userFragments?: number;
  onParticipate?: () => void;
  onEarnFragments?: () => void;
  className?: string;
  compact?: boolean;
  interactive?: boolean;
  layout?: 'default' | 'card';
  tier?: GiveawayVisualTier;
  burstId?: number;
  burstCount?: number;
}) {
  const card = messages.giveaways.card;
  const widthClass = compact ? 'w-auto' : 'w-full';
  const ctaColors = tier ? getGiveawayTierCtaColors(tier) : null;
  const tierStyle = ctaColors
    ? ({
        '--giveaway-cta-bg': ctaColors.bg,
        '--giveaway-cta-fg': ctaColors.fg,
      } as CSSProperties)
    : undefined;
  const have = Math.max(0, userFragments);
  const need = Math.max(0, ticketPrice);
  const progress = fragmentsEntryProgressPercent(have, need);
  const balanceLabel = card.missingFragmentsBalance
    .replace('{have}', String(have))
    .replace('{need}', String(need));
  const showCardProgress = layout === 'card' && action.type !== 'reserved' && action.type !== 'maxReached';

  const progressBlock = showCardProgress ? (
    <div className="mb-2 w-full">
      <p className="mb-1.5 text-center text-xs tabular-nums text-foreground/70">{balanceLabel}</p>
      <GiveawayAnimatedProgress value={progress} className="h-1.5 bg-white/10" />
    </div>
  ) : null;

  if (submitting) {
    return (
      <div className={cn('w-full', className)}>
        {progressBlock}
        <Button type="button" variant="chrome" className={cn(widthClass)} disabled aria-busy>
          <ArrowPathIcon className="h-4 w-4 animate-spin" />
        </Button>
      </div>
    );
  }

  if (action.type === 'reserved' || action.type === 'maxReached') {
    const label =
      action.type === 'reserved' ? (
        <>
          <LockClosedIcon className="h-4 w-4" aria-hidden />
          {card.accessReserved}
        </>
      ) : (
        card.maxEntriesReached
      );
    if (!interactive) {
      return (
        <span
          className={cn(
            'inline-flex h-9 w-full items-center justify-center gap-1 rounded-md border border-white/10 bg-white/5 px-4 text-sm text-foreground/70',
            className
          )}
        >
          {label}
        </span>
      );
    }
    return (
      <Button
        type="button"
        variant="secondary"
        className={cn(widthClass, action.type === 'reserved' && 'opacity-100', className)}
        disabled
      >
        {label}
      </Button>
    );
  }

  if (action.type === 'unaffordable') {
    return (
      <div className={cn('w-full cursor-default select-none', className)}>
        {layout === 'card' ? (
          progressBlock
        ) : (
          <>
            <p className="mb-1.5 text-center text-xs tabular-nums text-foreground/70">{balanceLabel}</p>
            <GiveawayAnimatedProgress value={progress} className="h-1.5 bg-white/10 [&>div]:bg-foreground/35" />
          </>
        )}
        <p className="mt-2 flex items-center justify-center gap-1 text-sm text-foreground/80">
          <MissingLabel template={card.missingFragmentsCta} missing={action.missing} />
        </p>
        {onEarnFragments ? (
          <button
            type="button"
            className="giveaway-earn-link mt-1.5 mx-auto block"
            onClick={(event) => {
              event.stopPropagation();
              onEarnFragments();
            }}
          >
            {card.missionsLink}
          </button>
        ) : null}
      </div>
    );
  }

  const participateLabel = <CostLabel template={card.participateCost} cost={ticketPrice} />;
  const burstLabel =
    burstCount > 1 ? card.entryBurstOther ?? '+{count} entries' : card.entryBurstOne ?? '+{count} entry';

  if (!interactive) {
    return (
      <div className={cn('w-full', className)}>
        {progressBlock}
        <span
          className={cn(
            'btn-chrome inline-flex h-9 w-full items-center justify-center gap-1 rounded-[10px] px-4 text-sm font-medium opacity-90',
            tier && 'giveaway-cta--tier'
          )}
          style={tierStyle}
          aria-hidden
        >
          {participateLabel}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('relative w-full', className)}>
      {progressBlock}
      <span className="relative inline-flex w-full">
        <Button
          type="button"
          variant="chrome"
          className={cn('w-full', tier && 'giveaway-cta--tier')}
          style={tierStyle}
          onClick={(event) => {
            event.stopPropagation();
            onParticipate?.();
          }}
          aria-label={card.participateCost.replace('{cost}', String(ticketPrice))}
        >
          {participateLabel}
        </Button>
        <GiveawayEntryBurst burstId={burstId} count={burstCount} label={burstLabel} />
      </span>
    </div>
  );
}
