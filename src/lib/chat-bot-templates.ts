/** Templates BOT du widget support — une clé par sous-catégorie du chat widget. */

export const CHAT_BOT_SUBCATEGORY_KEYS = [
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
] as const;

export type ChatBotSubcategoryKey = (typeof CHAT_BOT_SUBCATEGORY_KEYS)[number];

export function isValidBotSubcategoryKey(key: string): key is ChatBotSubcategoryKey {
  return (CHAT_BOT_SUBCATEGORY_KEYS as readonly string[]).includes(key);
}

/** Retourne une clé i18n stockée en DB, résolue côté client selon la locale. */
export function getBotMessageContent(subcategoryKey: ChatBotSubcategoryKey, username: string): string {
  const [category, sub] = subcategoryKey.split('.');
  return `__i18n:chatWidget.botTemplates.${category}.${sub}|${username}__`;
}
