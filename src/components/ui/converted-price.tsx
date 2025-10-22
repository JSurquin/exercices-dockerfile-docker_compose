'use client';

import { useState, useEffect } from 'react';
import { currencyConverter, SupportedCurrency } from '@/lib/currency-converter';
import { useCurrency } from '@/components/providers/currency-provider';
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
          setError(err instanceof Error ? err.message : 'Erreur de conversion');
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
  }, [usdCents, fromCurrency, selectedCurrency]);

  if (loading || isLoading) {
    return <Skeleton className={`h-5 w-16 ${className}`} />;
  }

  if (error) {
    return (
      <span className={`text-red-500 ${className}`} title={`Erreur: ${error}`}>
        {currencyConverter.formatPrice(usdCents, fromCurrency)}
      </span>
    );
  }

  return (
    <span className={className}>
      {convertedPrice}
      {showOriginal && fromCurrency !== selectedCurrency && (
        <span className="text-xs text-muted-foreground ml-1">
          ({currencyConverter.formatPrice(usdCents, fromCurrency)})
        </span>
      )}
    </span>
  );
}
