import { locales, type Locale } from '@/lib/locales';

export const LOCALE_COOKIE = 'NEXT_LOCALE';
export const LOCALE_STORAGE_KEY = 'user-locale-preference';

const localeSet = new Set<string>(locales);

export function isValidLocale(value: string | null | undefined): value is Locale {
  return typeof value === 'string' && localeSet.has(value);
}

/** Parse Accept-Language; English fallback for international visitors. */
export function parseAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return 'en';

  const languages = header
    .split(',')
    .map((part) => {
      const [lang, qPart] = part.trim().split(';');
      const q = qPart?.startsWith('q=') ? Number.parseFloat(qPart.slice(2)) : 1;
      return { lang: lang.toLowerCase(), q: Number.isFinite(q) ? q : 0 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of languages) {
    if (lang.startsWith('fr')) return 'fr';
    if (lang.startsWith('en')) return 'en';
    if (lang.startsWith('zh') || lang.startsWith('cn')) return 'cn';

    const primary = lang.split('-')[0];
    if (primary === 'fr') return 'fr';
    if (primary === 'en') return 'en';
    if (primary === 'zh') return 'cn';
  }

  return 'en';
}

export function resolveLocale(options: {
  cookieLocale?: string | null;
  urlLang?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  if (isValidLocale(options.cookieLocale)) {
    return options.cookieLocale;
  }
  if (isValidLocale(options.urlLang)) {
    return options.urlLang;
  }
  return parseAcceptLanguage(options.acceptLanguage);
}

export function shouldPersistLocaleCookie(
  existingCookie: string | undefined,
  urlLang: string | null
): boolean {
  if (urlLang && isValidLocale(urlLang)) return true;
  return !existingCookie;
}

export function localeToHtmlLang(locale: Locale): string {
  if (locale === 'cn') return 'zh';
  return locale;
}

export function localeToHrefLang(locale: Locale): string {
  if (locale === 'cn') return 'zh';
  return locale;
}

export const localeSiteMetadata: Record<
  Locale,
  { title: string; description: string; openGraphLocale: string }
> = {
  fr: {
    title: 'MoonSkin - Vendez vos skins CS2 facilement',
    description:
      'La plateforme la plus rapide et sécurisée pour convertir vos skins Counter-Strike 2 en argent réel. Paiements SEPA et crypto disponibles.',
    openGraphLocale: 'fr_FR',
  },
  en: {
    title: 'MoonSkin - Sell your CS2 skins easily',
    description:
      'The fastest and most secure platform to convert your Counter-Strike 2 skins into real money. SEPA and crypto payments available.',
    openGraphLocale: 'en_US',
  },
  cn: {
    title: 'MoonSkin - 轻松出售 CS2 皮肤',
    description:
      '最快、最安全的平台，将您的 Counter-Strike 2 皮肤兑换成真钱。支持 SEPA 和加密货币支付。',
    openGraphLocale: 'zh_CN',
  },
};

export function buildLocaleCookieValue(locale: Locale, secure: boolean): string {
  const maxAge = 365 * 24 * 60 * 60;
  return `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${maxAge}; SameSite=Lax${
    secure ? '; Secure' : ''
  }`;
}
