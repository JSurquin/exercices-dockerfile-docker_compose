import {
  chatAiLanguageRule,
  detectMessageLocale,
  isValidChatAiLocale,
  resolveChatAiLocale,
} from '@/lib/chat-ai-locale';

describe('isValidChatAiLocale', () => {
  it.each(['fr', 'en', 'cn'] as const)('accepte %s', (locale) => {
    expect(isValidChatAiLocale(locale)).toBe(true);
  });

  it.each(['de', '', null, undefined])('refuse %s', (locale) => {
    expect(isValidChatAiLocale(locale)).toBe(false);
  });
});

describe('detectMessageLocale', () => {
  it.each([
    ['hey how moonskin work', 'en'],
    ['How does MoonSkin work?', 'en'],
    ['What is the payout delay?', 'en'],
    ['comment ça marche MoonSkin ?', 'fr'],
    ['Bonjour, quel délai pour le SEPA ?', 'fr'],
    ['MoonSkin 怎么运作？', 'cn'],
  ] as const)('détecte « %s » → %s', (message, expected) => {
    expect(detectMessageLocale(message)).toBe(expected);
  });
});

describe('resolveChatAiLocale', () => {
  it('priorise la locale UI', () => {
    expect(
      resolveChatAiLocale({
        uiLocale: 'en',
        userMessage: 'comment ça marche ?',
      }),
    ).toBe('en');
  });

  it('retombe sur la détection du message', () => {
    expect(
      resolveChatAiLocale({
        userMessage: 'hey how moonskin work',
      }),
    ).toBe('en');
  });

  it('utilise le français par défaut', () => {
    expect(resolveChatAiLocale({})).toBe('fr');
  });
});

describe('chatAiLanguageRule', () => {
  it('demande une réponse en anglais pour la locale en', () => {
    expect(chatAiLanguageRule('en')).toContain('English');
  });

  it('demande une réponse en français pour la locale fr', () => {
    expect(chatAiLanguageRule('fr')).toContain('français');
  });
});
