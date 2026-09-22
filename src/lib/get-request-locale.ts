import { cookies, headers } from 'next/headers';
import type { Locale } from '@/lib/locales';
import {
  LOCALE_COOKIE,
  isValidLocale,
  parseAcceptLanguage,
} from '@/lib/locale-detection';

/**
 * Locale for the current request: middleware header, cookie, then Accept-Language.
 * Never falls back to French so a first visit without cookie keeps the HTML
 * in the browser language and avoids a post-hydration language swap (CLS).
 */
export async function getRequestLocale(): Promise<Locale> {
  const headerStore = await headers();
  const headerLocale = headerStore.get('x-moonskin-locale');
  if (isValidLocale(headerLocale)) {
    return headerLocale;
  }

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isValidLocale(cookieLocale)) {
    return cookieLocale;
  }

  return parseAcceptLanguage(headerStore.get('accept-language'));
}
