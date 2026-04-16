'use client';

import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';
import { useCurrency } from '@/components/providers/currency-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { SupportedCurrency } from '@/lib/currency-converter';

interface CurrencySelectorProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showFlag?: boolean;
  showName?: boolean;
  className?: string;
}

export function CurrencySelector({ 
  variant = 'outline',
  size = 'default',
  showFlag = true,
  showName = false,
  className = ''
}: CurrencySelectorProps) {
  const { selectedCurrency, setSelectedCurrency, supportedCurrencies } = useCurrency();
  const { messages } = useLocale();
  
  const currentCurrency = supportedCurrencies[selectedCurrency];

  const handleCurrencyChange = (currency: SupportedCurrency) => {
    setSelectedCurrency(currency);
  };

  // Helper pour obtenir le nom traduit de la devise
  const getCurrencyName = (nameKey: 'usd' | 'eur' | 'cny') => {
    return messages.currencies[nameKey];
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={`gap-2 ${className}`}>
          <span className="font-semibold text-base">{currentCurrency.symbol}</span>
          {showFlag && <span>{currentCurrency.flag}</span>}
          <span className="font-mono font-bold">{currentCurrency.code}</span>
          {showName && <span className="hidden sm:inline">{getCurrencyName(currentCurrency.nameKey)}</span>}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {Object.values(supportedCurrencies).map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => handleCurrencyChange(currency.code)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <span className="text-lg">{currency.flag}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold">{currency.code}</span>
                <span className="text-lg">{currency.symbol}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {getCurrencyName(currency.nameKey)}
              </div>
            </div>
            {selectedCurrency === currency.code && (
              <Badge variant="default" className="text-xs">
                {messages.common.current}
              </Badge>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
