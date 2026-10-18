/**
 * Stable inventory API error codes (locale-agnostic).
 * Legacy French strings are still recognised client-side for older cached responses.
 */
export const INVENTORY_ERROR_PRIVATE = 'INVENTORY_PRIVATE';
export const LEGACY_INVENTORY_ERROR_PRIVATE_FR = 'Inventaire privé ou inaccessible';

/** Stable code when Skinplace/inventory API is unreachable or returns non-JSON (maintenance, proxy HTML, etc.). */
export const INVENTORY_SERVICE_MAINTENANCE = 'INVENTORY_SERVICE_MAINTENANCE';

export function isInventoryPrivateError(message: string | null | undefined): boolean {
  if (!message) return false;
  return message === INVENTORY_ERROR_PRIVATE || message === LEGACY_INVENTORY_ERROR_PRIVATE_FR;
}

export function isInventoryServiceMaintenanceError(message: string | null | undefined): boolean {
  return message === INVENTORY_SERVICE_MAINTENANCE;
}

/** Raw fetch/parse errors that must not be shown to end users. */
export function isTechnicalInventoryFetchError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('unexpected token') ||
    m.includes('not valid json') ||
    m.includes('<!doctype') ||
    m === 'failed to fetch' ||
    m.includes('networkerror') ||
    m.includes('load failed') ||
    m.includes('network request failed')
  );
}

export function normalizeInventoryClientError(message: string): string {
  if (isInventoryServiceMaintenanceError(message) || isTechnicalInventoryFetchError(message)) {
    return INVENTORY_SERVICE_MAINTENANCE;
  }
  return message;
}
