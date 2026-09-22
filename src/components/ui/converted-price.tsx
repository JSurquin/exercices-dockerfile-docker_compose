'use client';

import { useState, useEffect } from 'react';
import { currencyConverter, SupportedCurrency } from '@/lib/currency-converter';
import { useCurrency } from '@/components/providers/currency-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { Skeleton } from '@/components/ui/skeleton';

interface ConvertedPriceProps {
  usdCents: number;
  className?: string;
  showOriginal?: boolean;
  loading?: boolean;
  fromCurrency?: SupportedCurrency;
}

export function ConvertedPrice({ 
  usdCents, 
  className = '', 
  showOriginal = false,
  loading = false,
  fromCurrency = 'USD'
}: ConvertedPriceProps) {
  const { selectedCurrency } = useCurrency();
  const { messages } = useLocale();
  const [convertedPrice, setConvertedPrice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const convertPrice = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Si la devise source est la même que la devise cible, pas de conversion nécessaire
        if (fromCurrency === selectedCurrency) {
          const formattedPrice = currencyConverter.formatPrice(usdCents, fromCurrency);
          if (isMounted) {
            setConvertedPrice(formattedPrice);
          }
          return;
        }
        
        // Convertir vers la devise sélectionnée
        const convertedCents = await currencyConverter.convertCents(usdCents, fromCurrency, selectedCurrency);
        const formattedPrice = currencyConverter.formatPrice(convertedCents, selectedCurrency);
        
        if (isMounted) {
          setConvertedPrice(formattedPrice);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : messages.common.conversionError);
          // Fallback: afficher le prix dans la devise source
          setConvertedPrice(currencyConverter.formatPrice(usdCents, fromCurrency));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    convertPrice();

    return () => {
      isMounted = false;
    };
  }, [usdCents, fromCurrency, selectedCurrency, messages.common.conversionError]);

  if (loading || isLoading) {
    return (
      <Skeleton
        className={`inline-block h-5 min-w-[5.5rem] w-[5.5rem] align-middle ${className}`}
      />
    );
  }

  if (error) {
    return (
      <span className={`inline-block min-w-[5.5rem] tabular-nums text-red-500 ${className}`} title={`${messages.common.error}: ${error}`}>
        {currencyConverter.formatPrice(usdCents, fromCurrency)}
      </span>
    );
  }

  return (
    <span className={`inline-block min-w-[5.5rem] tabular-nums ${className}`}>
      {convertedPrice}
      {showOriginal && fromCurrency !== selectedCurrency && (
        <span className="text-xs text-muted-foreground ml-1">
          ({currencyConverter.formatPrice(usdCents, fromCurrency)})
        </span>
      )}
    </span>
  );
}
