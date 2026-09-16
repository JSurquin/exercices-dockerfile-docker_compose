import { cn } from '@/lib/utils';

export function GiveawayStatBoxes({
  participants,
  totalEntries,
  myEntries,
  chance,
  labels,
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
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      <StatBox label={labels.participants} value={String(participants)} />
      <StatBox label={labels.totalEntries} value={String(totalEntries)} />
      <StatBox label={labels.yourEntries} value={String(myEntries)} />
      <StatBox label={labels.yourChance} value={chance} />
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn('rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-center')}>
      <p className="text-[10px] leading-tight text-foreground/65">{label}</p>
      <p className="font-display text-sm font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
