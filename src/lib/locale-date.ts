import type { Locale } from '@/lib/i18n';

export function localeToBcp47(locale: Locale): string {
  switch (locale) {
    case 'fr':
      return 'fr-FR';
    case 'en':
      return 'en-US';
    case 'cn':
      return 'zh-CN';
    default:
      return 'fr-FR';
  }
}
