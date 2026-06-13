/**
 * Résout une clé i18n embarquée dans le contenu d'un message BOT/SYSTEM.
 *
 * Les messages automatiques sont stockés en DB avec le format :
 *   __i18n:chatWidget.responses.thankYouMessage__
 *   __i18n:chatWidget.botTemplates.trade.pending|Jimmy__
 *
 * Au rendu, cette fonction remplace la clé par sa valeur dans l'objet
 * `messages` de la locale courante. Si la clé est introuvable ou si le
 * contenu n'est pas une clé i18n, le contenu brut est retourné tel quel
 * (rétrocompatibilité avec les anciens messages stockés en texte libre).
 */
export function resolveI18nContent(content: string, messages: unknown): string {
  const match = content.match(/^__i18n:(.+?)(?:\|(.+))?__$/);
  if (!match) return content;

  const keyPath = match[1].split('.');
  const username = match[2];

  let node: unknown = messages;
  for (const k of keyPath) {
    if (node == null || typeof node !== 'object') return content;
    node = (node as Record<string, unknown>)[k];
  }

  if (typeof node !== 'string') return content;

  return username ? node.replace(/\{username\}/g, username) : node;
}
