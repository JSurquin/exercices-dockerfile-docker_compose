'use client';

import { useEffect, useState } from 'react';
import CountUp from 'react-countup';
import {
  currencyConverter,
  SUPPORTED_CURRENCIES,
  SupportedCurrency,
} from '@/lib/currency-converter';
import { useCurrency } from '@/components/providers/currency-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { splitCurrencyDisplay } from '@/lib/giveaway-presentation';
import { cn } from '@/lib/utils';

interface ConvertedAmountProps {
  cents: number;
  fromCurrency?: SupportedCurrency;
  className?: string;
  countUp?: boolean;
  countUpDuration?: number;
  split?: boolean;
}

function getAffixes(currency: SupportedCurrency) {
  const symbol = SUPPORTED_CURRENCIES[currency].symbol;
  if (currency === 'EUR') {
    return { prefix: '', suffix: symbol };
  }
  return { prefix: symbol, suffix: '' };
}

export function ConvertedAmount({
  cents,
  fromCurrency = 'EUR',
  className = '',
  countUp = false,
  countUpDuration = 1.5,
  split = false,
}: ConvertedAmountProps) {
  const { selectedCurrency } = useCurrency();
  const { locale } = useLocale();
  const [displayCents, setDisplayCents] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const convert = async () => {
      setLoading(true);
      try {
        const converted =
          fromCurrency === selectedCurrency
            ? cents
            : await currencyConverter.convertCents(cents, fromCurrency, selectedCurrency);
        if (mounted) {
          setDisplayCents(converted);
        }
      } catch {
        if (mounted) {
          setDisplayCents(cents);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    convert();

    return () => {
      mounted = false;
    };
  }, [cents, fromCurrency, selectedCurrency]);

  if (loading || displayCents === null) {
    return <Skeleton className={`inline-block h-8 min-w-[6rem] w-24 align-middle ${className}`} />;
  }

  if (countUp) {
    const { prefix, suffix } = getAffixes(selectedCurrency);
    return (
      <span className={cn('inline-block min-w-[6rem] tabular-nums', className)}>
        <CountUp
          end={displayCents / 100}
          duration={countUpDuration}
          decimals={2}
          prefix={prefix}
          suffix={suffix}
          separator=" "
        />
      </span>
    );
  }

  if (split) {
    const parts = splitCurrencyDisplay(displayCents, locale, selectedCurrency);
    return (
      <span className={cn('inline-flex min-w-[6rem] items-baseline whitespace-nowrap tabular-nums', className)}>
        {parts.symbolFirst ? (
          <span className="mr-0.5 text-[0.55em] font-medium text-foreground/70">{parts.symbol}</span>
        ) : null}
        <span>{parts.integer}</span>
        <span className="text-[0.45em] font-medium leading-none text-foreground/55">{parts.fraction}</span>
        {parts.symbolFirst ? null : (
          <span className="ml-1 text-[0.55em] font-medium text-foreground/80">{parts.symbol}</span>
        )}
      </span>
    );
  }

  return (
    <span className={cn('inline-block min-w-[6rem] tabular-nums', className)}>
      {currencyConverter.formatPrice(displayCents, selectedCurrency)}
    </span>
  );
}
