import { CHAT_BOT_SUBCATEGORY_KEYS, getBotMessageContent } from '@/lib/chat-bot-templates';
import {
  chatBotTemplatesFr,
  chatBotTemplatesEn,
  type ChatBotTemplateTree,
} from '@/lib/chat-bot-i18n-templates';
import { chatBotTemplatesCn } from '@/lib/chat-bot-i18n-templates-cn';
import { resolveI18nContent } from '@/lib/resolve-i18n-content';

const LOCALES: Array<{
  id: string;
  tree: ChatBotTemplateTree;
  username: string;
  greeting: RegExp;
}> = [
  { id: 'fr', tree: chatBotTemplatesFr, username: 'Jimmy', greeting: /Bonjour Jimmy|Jimmy/ },
  { id: 'en', tree: chatBotTemplatesEn, username: 'Alex', greeting: /Hello Alex|Alex/ },
  { id: 'cn', tree: chatBotTemplatesCn, username: '玩家', greeting: /玩家/ },
];

function mockMessages(tree: ChatBotTemplateTree) {
  return { chatWidget: { botTemplates: tree } };
}

function resolveKey(key: string, username: string, tree: ChatBotTemplateTree): string {
  return resolveI18nContent(getBotMessageContent(key as (typeof CHAT_BOT_SUBCATEGORY_KEYS)[number], username), mockMessages(tree));
}

describe('Templates BOT — résolution i18n par locale', () => {
  for (const locale of LOCALES) {
    describe(`locale ${locale.id}`, () => {
      it.each([...CHAT_BOT_SUBCATEGORY_KEYS])(
        'résout « %s » avec un contenu substantiel',
        (key) => {
          const resolved = resolveKey(key, locale.username, locale.tree);
          expect(resolved.trim().length).toBeGreaterThan(30);
        },
      );

      it.each([...CHAT_BOT_SUBCATEGORY_KEYS])(
        'ne laisse pas {username} dans « %s »',
        (key) => {
          const resolved = resolveKey(key, locale.username, locale.tree);
          expect(resolved).not.toContain('{username}');
        },
      );

      it.each([...CHAT_BOT_SUBCATEGORY_KEYS].filter((k) => !k.startsWith('support.bug') && !k.startsWith('support.other')))(
        'personnalise « %s » avec le pseudo',
        (key) => {
          const resolved = resolveKey(key, locale.username, locale.tree);
          expect(resolved).toContain(locale.username);
        },
      );
    });
  }
});

describe('Templates BOT — contenu métier par catégorie', () => {
  it.each([
    ['trade.pending', /15|15 minutes|15 分钟/i],
    ['trade.blocked', /Steam Guard|steam guard|Steam 守卫/i],
    ['trade.item_missing', /API scam|api scam|API 骗局/i],
    ['trade.lock', /restriction|restriction|限制/i],
    ['trade.bot_issue', /bot|Bot|机器人/i],
  ])('%s contient un mot-clé attendu', (key, pattern) => {
    for (const locale of LOCALES) {
      const resolved = resolveKey(key, locale.username, locale.tree);
      expect(resolved).toMatch(pattern);
    }
  });

  it.each([
    ['payment.card', /Visa|visa|Mastercard|mastercard/i],
    ['payment.sepa_fr', /SEPA|sepa/i],
    ['payment.sepa_eu', /SEPA|sepa|Europe|欧洲/i],
    ['payment.crypto', /crypto|Crypto|区块链|blockchain/i],
  ])('%s mentionne le moyen de paiement', (key, pattern) => {
    for (const locale of LOCALES) {
      const resolved = resolveKey(key, locale.username, locale.tree);
      expect(resolved).toMatch(pattern);
    }
  });

  it.each([
    ['delay.card', /7|7-day|7 天/i],
    ['delay.sepa_fr', /6 PM|18h|6点|SEPA|sepa|转账/i],
    ['delay.sepa_eu', /business|ouvr|工作/i],
    ['delay.crypto', /blockchain|区块链|confirmation/i],
  ])('%s décrit un délai', (key, pattern) => {
    for (const locale of LOCALES) {
      const resolved = resolveKey(key, locale.username, locale.tree);
      expect(resolved).toMatch(pattern);
    }
  });

  it('support.partnership mentionne marketing@moonskin.com dans les 3 langues', () => {
    for (const locale of LOCALES) {
      const resolved = resolveKey('support.partnership', locale.username, locale.tree);
      expect(resolved).toContain('marketing@moonskin.com');
    }
  });

  it.each(['support.kyc', 'support.bug', 'support.other'])(
    '%s est non vide dans les 3 langues',
    (key) => {
      for (const locale of LOCALES) {
        const resolved = resolveKey(key, locale.username, locale.tree);
        expect(resolved.trim().length).toBeGreaterThan(15);
      }
    },
  );
});

describe('Templates BOT — parité structure', () => {
  const categories = ['trade', 'payment', 'delay', 'support'] as const;

  it.each(categories)('catégorie « %s » a les mêmes clés FR/EN/CN', (category) => {
    const frKeys = Object.keys(chatBotTemplatesFr[category]).sort();
    const enKeys = Object.keys(chatBotTemplatesEn[category]).sort();
    const cnKeys = Object.keys(chatBotTemplatesCn[category]).sort();
    expect(enKeys).toEqual(frKeys);
    expect(cnKeys).toEqual(frKeys);
  });

  it.each([...CHAT_BOT_SUBCATEGORY_KEYS])(
    'clé widget « %s » existe dans les 3 arbres',
    (key) => {
      const [category, sub] = key.split('.') as [keyof ChatBotTemplateTree, string];
      expect(chatBotTemplatesFr[category][sub as keyof ChatBotTemplateTree['trade']]).toBeTruthy();
      expect(chatBotTemplatesEn[category][sub as keyof ChatBotTemplateTree['trade']]).toBeTruthy();
      expect(chatBotTemplatesCn[category][sub as keyof ChatBotTemplateTree['trade']]).toBeTruthy();
    },
  );
});
