import {
  assertWidgetBotTemplateParity,
  CHAT_WIDGET_CATEGORY_KEYS,
  CHAT_WIDGET_SUBCATEGORIES,
  getAllWidgetSubcategoryKeys,
  shouldShowBackButton,
} from '@/lib/chat-widget-config';

describe('CHAT_WIDGET_CATEGORY_KEYS', () => {
  it('définit trade, payment, support', () => {
    expect(CHAT_WIDGET_CATEGORY_KEYS).toEqual(['trade', 'payment', 'support']);
  });
});

describe('CHAT_WIDGET_SUBCATEGORIES', () => {
  it('totalise 17 sous-catégories', () => {
    expect(getAllWidgetSubcategoryKeys()).toHaveLength(17);
  });

  it('trade a 5 sous-catégories', () => {
    expect(CHAT_WIDGET_SUBCATEGORIES.trade).toHaveLength(5);
  });

  it('payment inclut délais et moyens de paiement', () => {
    expect(CHAT_WIDGET_SUBCATEGORIES.payment).toContain('payment.crypto');
    expect(CHAT_WIDGET_SUBCATEGORIES.payment).toContain('delay.sepa_fr');
  });
});

describe('assertWidgetBotTemplateParity', () => {
  it('toutes les clés widget ont un template BOT', () => {
    const result = assertWidgetBotTemplateParity();
    expect(result.ok).toBe(true);
    expect(result.missing).toEqual([]);
  });
});

describe('shouldShowBackButton', () => {
  it('visible sur sous-catégories', () => {
    expect(
      shouldShowBackButton({ step: 'subcategories', hasConversationMessages: false }),
    ).toBe(true);
  });

  it('visible en conversation vide', () => {
    expect(
      shouldShowBackButton({ step: 'conversation', hasConversationMessages: false }),
    ).toBe(true);
  });

  it('masqué en conversation avec messages', () => {
    expect(
      shouldShowBackButton({ step: 'conversation', hasConversationMessages: true }),
    ).toBe(false);
  });

  it('masqué sur l’écran catégories', () => {
    expect(
      shouldShowBackButton({ step: 'categories', hasConversationMessages: false }),
    ).toBe(false);
  });
});
