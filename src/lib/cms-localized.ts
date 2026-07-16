import type { NextRequest } from 'next/server';

export type CmsLocale = 'fr' | 'en' | 'cn';

export function resolveCmsLocale(request: NextRequest, langParam?: string | null): CmsLocale {
  if (langParam === 'fr' || langParam === 'en' || langParam === 'cn') {
    return langParam;
  }

  const acceptLanguage = request.headers.get('Accept-Language') || '';
  if (acceptLanguage.includes('zh') || acceptLanguage.includes('cn')) {
    return 'cn';
  }
  if (acceptLanguage.includes('fr')) {
    return 'fr';
  }
  return 'en';
}

export function pickLocalizedField(
  lang: CmsLocale,
  fr: string,
  en: string,
  cn?: string | null,
): string {
  if (lang === 'cn' && cn) return cn;
  if (lang === 'fr') return fr;
  return en;
}

export function pickLocalizedOptionalField(
  lang: CmsLocale,
  fr?: string | null,
  en?: string | null,
  cn?: string | null,
): string | undefined {
  const value = pickLocalizedField(lang, fr || '', en || '', cn);
  return value || undefined;
}
