import {
  buildSystemPrompt,
  mapSenderToRole,
  stripI18nPlaceholder,
} from '@/lib/chat-ai-service';
import { OFF_TOPIC_REFUSAL_MESSAGE } from '@/lib/chat-ai-guards';

describe('stripI18nPlaceholder', () => {
  it.each([
    ['__i18n:chatWidget.responses.thankYouMessage__', '[Message automatique MoonSkin]'],
    ['__i18n:chatWidget.botTemplates.trade.pending|Jimmy__', '[Message automatique MoonSkin]'],
    ['Message utilisateur normal', 'Message utilisateur normal'],
    ['', ''],
    ['__i18n:incomplete', '__i18n:incomplete'],
    ['Texte avant __i18n:chatWidget.x__', 'Texte avant __i18n:chatWidget.x__'],
  ])('transforme « %s »', (input, expected) => {
    expect(stripI18nPlaceholder(input)).toBe(expected);
  });
});

describe('mapSenderToRole', () => {
  it.each([
    ['USER', 'user'],
    ['BOT', 'assistant'],
    ['AI', 'assistant'],
    ['MODERATOR', 'assistant'],
    ['SYSTEM', null],
  ] as const)('senderType=%s → %s', (senderType, expected) => {
    expect(mapSenderToRole(senderType)).toBe(expected);
  });
});

describe('buildSystemPrompt', () => {
  it.each(['Alice', 'PlayerX', 'Utilisateur'])(
    'personnalise le prompt pour %s',
    (username) => {
      expect(buildSystemPrompt(username)).toContain(username);
    },
  );

  it('inclut les règles MoonSkin de base', () => {
    const prompt = buildSystemPrompt('Test');
    expect(prompt).toContain('Counter-Strike 2');
    expect(prompt).toContain('KYC');
    expect(prompt).toContain(OFF_TOPIC_REFUSAL_MESSAGE);
  });

  it.each([
    'FAQ: délai SEPA 18h',
    'Chunk 1\n\nChunk 2',
    '',
  ])('intègre le contexte RAG « %s »', (ragContext) => {
    const prompt = buildSystemPrompt('User', ragContext || undefined);
    if (ragContext) {
      expect(prompt).toContain('SOURCE DE VÉRITÉ');
      expect(prompt).toContain(ragContext);
    } else {
      expect(prompt).not.toContain('SOURCE DE VÉRITÉ');
    }
  });
});
