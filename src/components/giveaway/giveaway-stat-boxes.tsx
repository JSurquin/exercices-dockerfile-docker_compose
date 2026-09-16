import { GiveawayCountUp } from '@/components/giveaway/giveaway-count-up';
import { formatChancePercent } from '@/lib/giveaway-presentation';
import { cn } from '@/lib/utils';

export function GiveawayStatBoxes({
  participants,
  totalEntries,
  myEntries,
  chance,
  locale,
  labels,
  compact = false,
  featured = false,
}: {
  participants: number;
  totalEntries: number;
  myEntries: number;
  chance: number;
  locale: string;
  labels: {
    participants: string;
    totalEntries: string;
    yourEntries: string;
    yourChance: string;
  };
  compact?: boolean;
  featured?: boolean;
}) {
  return (
    <div className={cn('grid gap-2', compact ? 'grid-cols-4 p-0' : 'grid-cols-2 p-3')}>
      <StatBox
        label={labels.participants}
        value={participants}
        featured={featured}
        compact={compact}
      />
      <StatBox
        label={labels.totalEntries}
        value={totalEntries}
        featured={featured}
        compact={compact}
      />
      <StatBox
        label={labels.yourEntries}
        value={myEntries}
        featured={featured}
        compact={compact}
        highlight
      />
      <StatBox
        label={labels.yourChance}
        value={chance}
        featured={featured}
        compact={compact}
        highlight
        format={(current) => formatChancePercent(current, locale)}
        decimals={2}
      />
    </div>
  );
}

function StatBox({
  label,
  value,
  featured,
  compact,
  highlight = false,
  format,
  decimals = 0,
}: {
  label: string;
  value: number;
  featured?: boolean;
  compact?: boolean;
  highlight?: boolean;
  format?: (value: number) => string;
  decimals?: number;
}) {
  return (
    <div
      className={cn(
        'rounded-md border border-white/10 bg-white/5 text-center',
        compact ? 'px-1.5 py-1.5' : 'px-3 py-2',
        highlight && 'giveaway-chance-pill'
      )}
    >
      <p className="text-xs leading-tight text-foreground/80">{label}</p>
      <p
        className={cn(
          'font-display font-semibold tabular-nums text-foreground',
          featured ? 'text-xl' : 'text-base'
        )}
      >
        <GiveawayCountUp value={value} format={format} decimals={decimals} />
      </p>
    </div>
  );
}
