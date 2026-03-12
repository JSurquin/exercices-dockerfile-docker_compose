/**
 * Résout une clé i18n embarquée dans le contenu d'un message BOT/SYSTEM.
 *
 * Les messages automatiques sont stockés en DB avec le format :
 *   __i18n:chatWidget.responses.thankYouMessage__
 *
 * Au rendu, cette fonction remplace la clé par sa valeur dans l'objet
 * `messages` de la locale courante. Si la clé est introuvable ou si le
 * contenu n'est pas une clé i18n, le contenu brut est retourné tel quel
 * (rétrocompatibilité avec les anciens messages stockés en texte libre).
 */
export function resolveI18nContent(
  content: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: Record<string, any>
): string {
  const match = content.match(/^__i18n:(.+)__$/);
  if (!match) return content;

  const keyPath = match[1].split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = messages;
  for (const k of keyPath) {
    if (node == null || typeof node !== 'object') return content;
    node = node[k];
  }
  return typeof node === 'string' ? node : content;
}
