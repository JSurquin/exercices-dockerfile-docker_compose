/**
 * Parse une réponse fetch en JSON avec message d'erreur lisible si le corps n'est pas du JSON
 * (ex. page HTML de timeout proxy, réponse vide).
 */
export async function parseApiJson<T = Record<string, unknown>>(
  response: Response,
  invalidMessage = 'Réponse serveur invalide. Réessayez dans un instant.'
): Promise<T> {
  const text = await response.text();
  if (!text.trim()) {
    throw new Error(invalidMessage);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(invalidMessage);
  }
}
