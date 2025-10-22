'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedCurrency, SUPPORTED_CURRENCIES } from '@/lib/currency-converter';

interface CurrencyContextType {
  selectedCurrency: SupportedCurrency;
  setSelectedCurrency: (currency: SupportedCurrency) => void;
  supportedCurrencies: typeof SUPPORTED_CURRENCIES;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
  defaultCurrency?: SupportedCurrency;
}

export function CurrencyProvider({ children, defaultCurrency = 'EUR' }: CurrencyProviderProps) {
  const [selectedCurrency, setSelectedCurrencyState] = useState<SupportedCurrency>(defaultCurrency);

  // Charger la devise sauvegardée depuis localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCurrency = localStorage.getItem('preferred-currency') as SupportedCurrency;
      if (savedCurrency && SUPPORTED_CURRENCIES[savedCurrency]) {
        setSelectedCurrencyState(savedCurrency);
      }
    }
  }, []);

  // Sauvegarder la devise sélectionnée dans localStorage
  const setSelectedCurrency = (currency: SupportedCurrency) => {
    setSelectedCurrencyState(currency);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-currency', currency);
    }
  };

  const value: CurrencyContextType = {
    selectedCurrency,
    setSelectedCurrency,
    supportedCurrencies: SUPPORTED_CURRENCIES,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
