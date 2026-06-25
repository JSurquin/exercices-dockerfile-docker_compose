'use client';

import { useEffect, useState } from 'react';
import CountUp from 'react-countup';
import {
  currencyConverter,
  SUPPORTED_CURRENCIES,
  SupportedCurrency,
} from '@/lib/currency-converter';
import { useCurrency } from '@/components/providers/currency-provider';
import { Skeleton } from '@/components/ui/skeleton';

interface ConvertedAmountProps {
  cents: number;
  fromCurrency?: SupportedCurrency;
  className?: string;
  countUp?: boolean;
  countUpDuration?: number;
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
}: ConvertedAmountProps) {
  const { selectedCurrency } = useCurrency();
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
    return <Skeleton className={`inline-block h-8 w-24 ${className}`} />;
  }

  if (countUp) {
    const { prefix, suffix } = getAffixes(selectedCurrency);
    return (
      <span className={className}>
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

  return (
    <span className={className}>
      {currencyConverter.formatPrice(displayCents, selectedCurrency)}
    </span>
  );
}
