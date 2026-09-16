import { cn } from '@/lib/utils';

export function GiveawayStatBoxes({
  participants,
  totalEntries,
  myEntries,
  chance,
  labels,
  compact = false,
  featured = false,
}: {
  participants: number;
  totalEntries: number;
  myEntries: number;
  chance: string;
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
      <StatBox label={labels.participants} value={String(participants)} featured={featured} compact={compact} />
      <StatBox label={labels.totalEntries} value={String(totalEntries)} featured={featured} compact={compact} />
      <StatBox label={labels.yourEntries} value={String(myEntries)} featured={featured} compact={compact} />
      <StatBox label={labels.yourChance} value={chance} featured={featured} compact={compact} />
    </div>
  );
}

function StatBox({
  label,
  value,
  featured,
  compact,
}: {
  label: string;
  value: string;
  featured?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-md border border-white/10 bg-white/5 text-center',
        compact ? 'px-1.5 py-1.5' : 'px-3 py-2'
      )}
    >
      <p className="text-xs leading-tight text-foreground/80">{label}</p>
      <p
        className={cn(
          'font-display font-semibold tabular-nums text-foreground',
          featured ? 'text-xl' : 'text-base'
        )}
      >
        {value}
      </p>
    </div>
  );
}
