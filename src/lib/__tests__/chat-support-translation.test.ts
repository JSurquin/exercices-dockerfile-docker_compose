import {
  buildTranslationFooter,
  isChatI18nPlaceholder,
  localeDisplayName,
  localizeChatMessageForViewer,
  prepareModeratorMessageMetadata,
  readMessageLocaleMetadata,
  resolveConversationClientLocale,
} from '@/lib/chat-support-translation';

jest.mock('@/lib/translation', () => ({
  translateText: jest.fn(async (text: string, source: string, target: string) => {
    if (source === target) return { translatedText: text };
    return { translatedText: `[${target}] ${text}` };
  }),
}));

describe('chat-support-translation', () => {
  describe('resolveConversationClientLocale', () => {
    it('utilise la locale stockée dans les métadonnées du premier message user', () => {
      expect(
        resolveConversationClientLocale([
          {
            senderType: 'USER',
            content: 'Hello',
            metadata: { clientLocale: 'en' },
          },
        ]),
      ).toBe('en');
    });

    it('détecte la langue du message user sans métadonnées', () => {
      expect(
        resolveConversationClientLocale([
          { senderType: 'USER', content: 'Bonjour, j’ai un problème' },
        ]),
      ).toBe('fr');
    });
  });

  describe('buildTranslationFooter', () => {
    it('formate le pied de note en français', () => {
      expect(buildTranslationFooter('fr', 'fr')).toBe('Traduit en français');
    });

    it('formate le pied de note en anglais', () => {
      expect(buildTranslationFooter('en', 'en')).toBe('Translated in English');
    });
  });

  describe('localeDisplayName', () => {
    it('retourne le nom de langue adapté au lecteur', () => {
      expect(localeDisplayName('en', 'fr')).toBe('anglais');
      expect(localeDisplayName('fr', 'en')).toBe('French');
    });
  });

  describe('isChatI18nPlaceholder', () => {
    it('détecte les clés i18n internes', () => {
      expect(isChatI18nPlaceholder('__i18n:chatWidget.responses.thankYou__')).toBe(true);
      expect(isChatI18nPlaceholder('Bonjour')).toBe(false);
    });
  });

  describe('prepareModeratorMessageMetadata', () => {
    it('prépare une traduction client quand les langues diffèrent', async () => {
      const meta = await prepareModeratorMessageMetadata({
        content: 'Hello, how can I help?',
        uiLocale: 'en',
        clientLocale: 'fr',
      });

      expect(meta?.staffLocale).toBe('en');
      expect(meta?.clientTranslation).toEqual({
        sourceLocale: 'en',
        targetLocale: 'fr',
        translatedText: '[fr] Hello, how can I help?',
      });
    });

    it('ne traduit pas si staff et client ont la même locale', async () => {
      const meta = await prepareModeratorMessageMetadata({
        content: 'Bonjour',
        uiLocale: 'fr',
        clientLocale: 'fr',
      });

      expect(meta).toEqual({ staffLocale: 'fr' });
      expect(meta?.clientTranslation).toBeUndefined();
    });
  });

  describe('localizeChatMessageForViewer', () => {
    it('traduit les messages user pour le staff', async () => {
      const localized = await localizeChatMessageForViewer(
        {
          id: '1',
          content: 'Bonjour',
          senderType: 'USER',
          metadata: { clientLocale: 'fr' },
        },
        { scope: 'staff', viewerLocale: 'en', clientLocale: 'fr' },
      );

      expect(localized.content).toBe('[en] Bonjour');
      expect(localized.translationFooter).toBe('Translated in English');
    });

    it('utilise la traduction client en cache pour le widget', async () => {
      const localized = await localizeChatMessageForViewer(
        {
          id: '2',
          content: 'Hello',
          senderType: 'MODERATOR',
          metadata: {
            staffLocale: 'en',
            clientTranslation: {
              sourceLocale: 'en',
              targetLocale: 'fr',
              translatedText: 'Bonjour',
            },
          },
        },
        { scope: 'widget', viewerLocale: 'fr', clientLocale: 'fr' },
      );

      expect(localized.content).toBe('Bonjour');
      expect(localized.translationFooter).toBe('Traduit en français');
    });

    it('ne traduit pas les placeholders i18n', async () => {
      const content = '__i18n:moderation.conversation.system.assigned|Alex__';
      const localized = await localizeChatMessageForViewer(
        { id: '3', content, senderType: 'SYSTEM' },
        { scope: 'staff', viewerLocale: 'en', clientLocale: 'fr' },
      );

      expect(localized.content).toBe(content);
      expect(localized.translationFooter).toBeUndefined();
    });
  });

  describe('readMessageLocaleMetadata', () => {
    it('ignore les métadonnées invalides', () => {
      expect(readMessageLocaleMetadata(null)).toEqual({});
      expect(readMessageLocaleMetadata({ clientLocale: 'xx' })).toEqual({});
    });
  });
});
