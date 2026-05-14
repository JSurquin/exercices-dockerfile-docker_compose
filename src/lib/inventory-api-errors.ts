/**
 * Stable inventory API error codes (locale-agnostic).
 * Legacy French strings are still recognised client-side for older cached responses.
 */
export const INVENTORY_ERROR_PRIVATE = 'INVENTORY_PRIVATE';
export const LEGACY_INVENTORY_ERROR_PRIVATE_FR = 'Inventaire privé ou inaccessible';

export function isInventoryPrivateError(message: string | null | undefined): boolean {
  if (!message) return false;
  return message === INVENTORY_ERROR_PRIVATE || message === LEGACY_INVENTORY_ERROR_PRIVATE_FR;
}
