'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, getMessages } from '@/lib/i18n';
import {
  LOCALE_STORAGE_KEY,
  buildLocaleCookieValue,
  isValidLocale,
  localeToHtmlLang,
} from '@/lib/locale-detection';
import { Messages } from '~/utils/types';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: Messages;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

function persistLocalePreference(locale: Locale) {
  if (typeof window === 'undefined') return;

  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.cookie = buildLocaleCookieValue(
    locale,
    window.location.protocol === 'https:'
  );
}

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const messages = getMessages(locale);

  useEffect(() => {
    const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isValidLocale(storedLocale)) {
      if (storedLocale !== initialLocale) {
        setLocaleState(storedLocale);
      }
      persistLocalePreference(storedLocale);
      return;
    }

    persistLocalePreference(initialLocale);
  }, [initialLocale]);

  useEffect(() => {
    document.documentElement.lang = localeToHtmlLang(locale);
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    persistLocalePreference(newLocale);
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
