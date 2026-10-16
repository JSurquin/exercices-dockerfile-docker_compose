'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { SupportedCurrency, SUPPORTED_CURRENCIES } from '@/lib/currency-converter';
import { CurrencyChangeNotice } from '@/components/ui/currency-change-notice';

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
  const [noticeOpen, setNoticeOpen] = useState(false);
  const selectedCurrencyRef = useRef(selectedCurrency);

  // Charger la devise sauvegardée depuis localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCurrency = localStorage.getItem('preferred-currency') as SupportedCurrency;
      if (savedCurrency && SUPPORTED_CURRENCIES[savedCurrency]) {
        selectedCurrencyRef.current = savedCurrency;
        setSelectedCurrencyState(savedCurrency);
      }
    }
  }, []);

  // Sauvegarder la devise sélectionnée dans localStorage
  const setSelectedCurrency = (currency: SupportedCurrency) => {
    const previous = selectedCurrencyRef.current;
    if (previous !== currency && currency !== 'EUR') {
      setNoticeOpen(true);
    } else if (currency === 'EUR') {
      setNoticeOpen(false);
    }
    selectedCurrencyRef.current = currency;
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
      <CurrencyChangeNotice open={noticeOpen} onOpenChange={setNoticeOpen} />
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
