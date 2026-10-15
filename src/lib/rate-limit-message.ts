import type { Locale } from '@/lib/locales';

/** User-facing copy for HTTP 429 toasts. French was previously hardcoded. */
export const RATE_LIMIT_USER_MESSAGE: Record<Locale, string> = {
  fr: 'Trop de requêtes. Réessayez plus tard.',
  en: 'Too many requests. Please try again later.',
  cn: '请求过多，请稍后再试。',
};

const knownMessages = new Set<string>(Object.values(RATE_LIMIT_USER_MESSAGE));

export function rateLimitUserMessage(locale: Locale): string {
  return RATE_LIMIT_USER_MESSAGE[locale];
}

/** Rewrites this known sentence so a toast matches the page language. */
export function localizeRateLimitMessage(message: string, locale: Locale): string {
  if (knownMessages.has(message)) {
    return RATE_LIMIT_USER_MESSAGE[locale];
  }
  return message;
}
