'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, defaultLocale, locales, getMessages } from '@/lib/i18n';
import { Messages } from '~/utils/types';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: Messages;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'user-locale-preference';

function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;

  const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (storedLocale && locales.includes(storedLocale as Locale)) {
    return storedLocale as Locale;
  }

  const browserLang = navigator.language.toLowerCase();

  if (browserLang.startsWith('fr')) return 'fr';
  if (browserLang.startsWith('en')) return 'en';
  if (browserLang.startsWith('zh') || browserLang.startsWith('cn')) return 'cn';

  const primaryLang = browserLang.split('-')[0];
  if (primaryLang === 'fr') return 'fr';
  if (primaryLang === 'en') return 'en';
  if (primaryLang === 'zh') return 'cn';

  return defaultLocale;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() =>
    typeof window !== 'undefined' ? detectBrowserLocale() : defaultLocale
  );
  const messages = getMessages(locale);

  useEffect(() => {
    setLocaleState(detectBrowserLocale());
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    }
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, messages }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
