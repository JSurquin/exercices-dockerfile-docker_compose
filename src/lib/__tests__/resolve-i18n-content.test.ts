import { resolveI18nContent } from '@/lib/resolve-i18n-content';

const messages = {
  chatWidget: {
    responses: {
      thankYouMessage: 'Merci pour votre patience !',
    },
  },
};

describe('resolveI18nContent', () => {
  it('résout une clé __i18n:...__ avec variables', () => {
    expect(
      resolveI18nContent('__i18n:chatWidget.responses.thankYouMessage__', messages),
    ).toBe('Merci pour votre patience !');
    expect(
      resolveI18nContent('__i18n:chatWidget.responses.thankYouMessage|Jimmy__', messages),
    ).toBe('Merci pour votre patience !');
  });

  it('remplace {username} dans les templates bot', () => {
    const botMessages = {
      chatWidget: {
        botTemplates: {
          trade: { pending: 'Bonjour {username} !' },
        },
      },
    };
    expect(
      resolveI18nContent('__i18n:chatWidget.botTemplates.trade.pending|Alex__', botMessages),
    ).toBe('Bonjour Alex !');
  });

  it('résout les messages système de modération', () => {
    const modMessages = {
      moderation: {
        conversation: {
          system: {
            assigned: 'Assignée à {username}',
            unassigned: 'Conversation désassignée',
            closed:
              'Cette conversation a été fermée par notre équipe. Vous pouvez ouvrir une nouvelle discussion si besoin.',
          },
        },
      },
    };
    expect(
      resolveI18nContent('__i18n:moderation.conversation.system.assigned|Alex__', modMessages),
    ).toBe('Assignée à Alex');
    expect(
      resolveI18nContent('__i18n:moderation.conversation.system.unassigned__', modMessages),
    ).toBe('Conversation désassignée');
    expect(
      resolveI18nContent('__i18n:moderation.conversation.system.closed__', modMessages),
    ).toBe(
      'Cette conversation a été fermée par notre équipe. Vous pouvez ouvrir une nouvelle discussion si besoin.',
    );
  });

  it('retourne le contenu brut si ce n’est pas une clé i18n', () => {
    expect(resolveI18nContent('Message bot en texte libre', messages)).toBe(
      'Message bot en texte libre',
    );
  });

  it('retourne la clé brute si le chemin est introuvable', () => {
    const key = '__i18n:chatWidget.missing.key__';
    expect(resolveI18nContent(key, messages)).toBe(key);
  });
});
