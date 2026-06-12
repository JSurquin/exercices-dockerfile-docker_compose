import { CHAT_BOT_SUBCATEGORY_KEYS } from '@/lib/chat-bot-templates';

/** Clés des 3 catégories principales du widget support. */
export const CHAT_WIDGET_CATEGORY_KEYS = ['trade', 'payment', 'support'] as const;

export type ChatWidgetCategoryKey = (typeof CHAT_WIDGET_CATEGORY_KEYS)[number];

/** Sous-catégories par catégorie — doit rester aligné avec chat-widget.tsx et les templates BOT. */
export const CHAT_WIDGET_SUBCATEGORIES: Record<ChatWidgetCategoryKey, readonly string[]> = {
  trade: [
    'trade.pending',
    'trade.blocked',
    'trade.item_missing',
    'trade.lock',
    'trade.bot_issue',
  ],
  payment: [
    'payment.card',
    'payment.sepa_fr',
    'payment.sepa_eu',
    'payment.crypto',
    'delay.card',
    'delay.sepa_fr',
    'delay.sepa_eu',
    'delay.crypto',
  ],
  support: ['support.bug', 'support.partnership', 'support.kyc', 'support.other'],
};

export type ChatWidgetStep = 'categories' | 'subcategories' | 'conversation';

export function getAllWidgetSubcategoryKeys(): string[] {
  return CHAT_WIDGET_CATEGORY_KEYS.flatMap((cat) => [...CHAT_WIDGET_SUBCATEGORIES[cat]]);
}

/** Vérifie que chaque sous-catégorie widget possède un template BOT. */
export function assertWidgetBotTemplateParity(): { ok: boolean; missing: string[] } {
  const widgetKeys = new Set(getAllWidgetSubcategoryKeys());
  const botKeys = new Set(CHAT_BOT_SUBCATEGORY_KEYS as readonly string[]);
  const missing = [...widgetKeys].filter((k) => !botKeys.has(k));
  return { ok: missing.length === 0, missing };
}

export function shouldShowBackButton(params: {
  step: ChatWidgetStep;
  hasConversationMessages: boolean;
}): boolean {
  if (params.step === 'subcategories') return true;
  return params.step === 'conversation' && !params.hasConversationMessages;
}
