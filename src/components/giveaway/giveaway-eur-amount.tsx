import { formatGiveawayEur } from '@/lib/giveaway-presentation';
import { cn } from '@/lib/utils';

export function GiveawayEurAmount({
  cents,
  locale,
  className,
}: {
  cents: number;
  locale: string;
  className?: string;
}) {
  return <span className={cn('tabular-nums', className)}>{formatGiveawayEur(cents, locale)}</span>;
}
