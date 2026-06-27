import {
  isValidLocale,
  parseAcceptLanguage,
  resolveLocale,
  shouldPersistLocaleCookie,
} from '@/lib/locale-detection';

describe('locale-detection', () => {
  describe('parseAcceptLanguage', () => {
    it('returns fr for French browsers', () => {
      expect(parseAcceptLanguage('fr-FR,fr;q=0.9,en;q=0.8')).toBe('fr');
    });

    it('returns en for English browsers', () => {
      expect(parseAcceptLanguage('en-US,en;q=0.9')).toBe('en');
    });

    it('returns cn for Chinese browsers', () => {
      expect(parseAcceptLanguage('zh-CN,zh;q=0.9,en;q=0.8')).toBe('cn');
    });

    it('falls back to en for unsupported languages', () => {
      expect(parseAcceptLanguage('de-DE,de;q=0.9')).toBe('en');
      expect(parseAcceptLanguage(null)).toBe('en');
    });

    it('respects quality values', () => {
      expect(parseAcceptLanguage('de-DE,de;q=0.1,en-US,en;q=0.9')).toBe('en');
    });
  });

  describe('resolveLocale', () => {
    it('prefers cookie over Accept-Language', () => {
      expect(
        resolveLocale({
          cookieLocale: 'fr',
          acceptLanguage: 'en-US,en;q=0.9',
        })
      ).toBe('fr');
    });

    it('prefers url lang over Accept-Language when no cookie', () => {
      expect(
        resolveLocale({
          urlLang: 'en',
          acceptLanguage: 'fr-FR,fr;q=0.9',
        })
      ).toBe('en');
    });

    it('uses Accept-Language when no cookie or url lang', () => {
      expect(
        resolveLocale({
          acceptLanguage: 'fr-FR,fr;q=0.9',
        })
      ).toBe('fr');
    });
  });

  describe('shouldPersistLocaleCookie', () => {
    it('persists on first visit', () => {
      expect(shouldPersistLocaleCookie(undefined, null)).toBe(true);
    });

    it('persists when url lang is explicit', () => {
      expect(shouldPersistLocaleCookie('fr', 'en')).toBe(true);
    });

    it('does not overwrite an existing preference without url lang', () => {
      expect(shouldPersistLocaleCookie('en', null)).toBe(false);
    });
  });

  describe('isValidLocale', () => {
    it('validates supported locales', () => {
      expect(isValidLocale('en')).toBe(true);
      expect(isValidLocale('xx')).toBe(false);
    });
  });
});
