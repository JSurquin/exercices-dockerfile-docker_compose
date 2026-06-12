import {
  CHAT_BOT_SUBCATEGORY_KEYS,
  getBotMessageContent,
  isValidBotSubcategoryKey,
} from '@/lib/chat-bot-templates';

/** Clés affichées dans le widget chat (doivent correspondre aux templates BOT). */
const WIDGET_SUBCATEGORY_KEYS = [
  'trade.pending',
  'trade.blocked',
  'trade.item_missing',
  'trade.lock',
  'trade.bot_issue',
  'payment.card',
  'payment.sepa_fr',
  'payment.sepa_eu',
  'payment.crypto',
  'delay.card',
  'delay.sepa_fr',
  'delay.sepa_eu',
  'delay.crypto',
  'support.bug',
  'support.partnership',
  'support.kyc',
  'support.other',
];

describe('CHAT_BOT_SUBCATEGORY_KEYS', () => {
  it('couvre exactement les 17 sous-catégories du widget', () => {
    expect([...CHAT_BOT_SUBCATEGORY_KEYS].sort()).toEqual(
      [...WIDGET_SUBCATEGORY_KEYS].sort(),
    );
  });
});

describe('isValidBotSubcategoryKey', () => {
  it('rejette une clé inconnue', () => {
    expect(isValidBotSubcategoryKey('invalid.key')).toBe(false);
  });

  it('accepte toutes les clés du widget', () => {
    for (const key of WIDGET_SUBCATEGORY_KEYS) {
      expect(isValidBotSubcategoryKey(key)).toBe(true);
    }
  });
});

describe('getBotMessageContent', () => {
  it('personnalise le message avec le pseudo', () => {
    const content = getBotMessageContent('trade.pending', 'Jimmy');
    expect(content).toContain('Bonjour Jimmy');
    expect(content).toContain('Moonskin');
  });

  it('génère un contenu non vide pour chaque sous-catégorie', () => {
    for (const key of CHAT_BOT_SUBCATEGORY_KEYS) {
      const content = getBotMessageContent(key, 'TestUser');
      expect(content.trim().length).toBeGreaterThan(20);
    }
  });

  it('mentionne marketing@moonskin.com pour les partenariats', () => {
    const content = getBotMessageContent('support.partnership', 'Creator');
    expect(content).toContain('marketing@moonskin.com');
  });
});
