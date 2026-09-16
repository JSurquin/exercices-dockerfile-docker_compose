import { formatGiveawayEur, splitCurrencyDisplay } from '@/lib/giveaway-presentation';
import { cn } from '@/lib/utils';

export function GiveawayEurAmount({
  cents,
  locale,
  className,
  split = false,
}: {
  cents: number;
  locale: string;
  className?: string;
  split?: boolean;
}) {
  if (!split) {
    return <span className={cn('tabular-nums', className)}>{formatGiveawayEur(cents, locale)}</span>;
  }

  const parts = splitCurrencyDisplay(cents, locale, 'EUR');
  return (
    <span className={cn('inline-flex items-baseline whitespace-nowrap tabular-nums', className)}>
      <span>{parts.integer}</span>
      <span className="text-[0.5em] font-medium leading-none text-white/55">{parts.fraction}</span>
      <span className="ml-1 text-[0.55em] font-medium text-white/80">{parts.symbol}</span>
    </span>
  );
}
