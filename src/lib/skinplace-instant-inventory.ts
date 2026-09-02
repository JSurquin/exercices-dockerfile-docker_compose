import { generateSkinplaceSignature } from '@/utils/skinplace-signature';
import { heapMb, partnerTrace } from '@/lib/partner-api/trace';

export type SkinplaceInstantInventoryItem = {
  market_name?: string;
  market_hash_name: string;
  assetid: string;
  appid?: number;
  project?: string;
  skip_reason?: string;
  untouchable: boolean;
  is_stattrak: number;
  is_souvenir: number;
  rarity: string;
  exterior: string;
  price: number;
  icon_url: string;
};

export type FetchSkinplaceInstantInventoryResult =
  | { ok: true; inventory: SkinplaceInstantInventoryItem[] }
  | {
      ok: false;
      code: 'CONFIG_ERROR' | 'API_ERROR';
      error: string;
      provider?: { status?: string; error_message?: string };
    };

function sanitizeProviderToken(value: string): string | undefined {
  const token = value.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 64);
  return token || undefined;
}

export function skinplaceErrorFields(payload: unknown): { status?: string; error_message?: string } {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
  const root = payload as Record<string, unknown>;
  const status = typeof root.status === 'string' ? sanitizeProviderToken(root.status) : undefined;
  const raw =
    typeof root.error_message === 'string'
      ? root.error_message
      : typeof root.error === 'string'
        ? root.error
        : undefined;
  const error_message = raw ? sanitizeProviderToken(raw.slice(0, 120)) : undefined;
  return { status, error_message };
}

function jsonRootKeys(payload: unknown): string[] | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  return Object.keys(payload as object).slice(0, 24);
}

export function partnerExtraFromSkinplaceProvider(provider?: {
  status?: string;
  error_message?: string;
}): Record<string, string> | undefined {
  if (!provider) return undefined;
  const extra: Record<string, string> = {};
  if (provider.status) extra.provider_status = provider.status;
  if (provider.error_message) extra.provider_error = provider.error_message;
  return Object.keys(extra).length ? extra : undefined;
}

export function isRetryableSkinplaceInventoryError(errorMessage?: string): boolean {
  const msg = (errorMessage ?? '').toLowerCase().replace(/-/g, '_');
  return msg === 'parse_inventory' || msg === 'steam_down';
}

export function mapSkinplaceInventoryFailure(
  fetched: Extract<FetchSkinplaceInstantInventoryResult, { ok: false }>
): {
  code: 'API_ERROR' | 'VALIDATION_ERROR' | 'CONFIG_ERROR';
  message: string;
  httpStatus: number;
  extra?: Record<string, string>;
} {
  if (fetched.code === 'CONFIG_ERROR') {
    return { code: 'CONFIG_ERROR', message: fetched.error, httpStatus: 500 };
  }

  const extra = partnerExtraFromSkinplaceProvider(fetched.provider);
  const msg = (fetched.provider?.error_message ?? '').toLowerCase().replace(/-/g, '_');
  if (msg === 'private_inventory') {
    return {
      code: 'VALIDATION_ERROR',
      message: 'Steam inventory is private or inaccessible',
      httpStatus: 400,
      extra,
    };
  }

  return {
    code: 'API_ERROR',
    message: fetched.error,
    httpStatus: 503,
    extra,
  };
}

/** Skinplace sometimes wraps items in `inventory`, `data.inventory` or `data.items`. */
export function extractSkinplaceInventoryItems(payload: unknown): SkinplaceInstantInventoryItem[] | null {
  if (Array.isArray(payload)) {
    return payload as SkinplaceInstantInventoryItem[];
  }
  if (!payload || typeof payload !== 'object') return null;

  const root = payload as Record<string, unknown>;
  if (root.success === false) return null;
  if (typeof root.status === 'string' && root.status.toLowerCase() === 'error') return null;

  const nested =
    root.data && typeof root.data === 'object' && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : null;

  const candidates = [root.inventory, nested?.inventory, nested?.items, root.items];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as SkinplaceInstantInventoryItem[];
    }
  }
  return null;
}

/** Items Skinplace can actually buy — same filter as sale / estimate. */
export function isSkinplaceItemSellable(item: SkinplaceInstantInventoryItem): boolean {
  return Boolean(item.assetid) && !item.untouchable && !item.skip_reason;
}

/**
 * CS2 instant inventory via the HMAC GET used by the sell page.
 * Do not use the Bearer `steam_id` Skinplace client for this — it returns an empty envelope.
 */
export async function fetchSkinplaceInstantInventory(
  steamId: string
): Promise<FetchSkinplaceInstantInventoryResult> {
  const privateKey = process.env.SKINPLACE_API_KEY_PRIVATE;
  const publicKey = process.env.SKINPLACE_API_KEY_PUBLIC;

  if (!privateKey || !publicKey) {
    partnerTrace('skinplace.inventory.config-missing');
    return { ok: false, code: 'CONFIG_ERROR', error: 'Trade provider is not configured' };
  }

  if (!/^\d{17}$/.test(steamId)) {
    partnerTrace('skinplace.inventory.bad-steamid');
    return { ok: false, code: 'API_ERROR', error: 'Unable to fetch inventory from the trade provider' };
  }

  const signature = generateSkinplaceSignature(steamId, privateKey);
  const params = new URLSearchParams();
  params.append('steamid', steamId);
  params.append('signature', signature);
  params.append('project', 'csgo');
  params.append('public key', publicKey);
  const url = `https://api.skin.place/api/v3/instant/inventory?${params.toString()}`;

  const started = Date.now();
  partnerTrace('skinplace.inventory.fetch.start', { steamId, heapMb: heapMb() });

  const maxAttempts = 3;
  let lastFail: Extract<FetchSkinplaceInstantInventoryResult, { ok: false }> | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await fetchSkinplaceInstantInventoryOnce(url, started, attempt);
    if (result.ok) return result;
    lastFail = result;
    if (!isRetryableSkinplaceInventoryError(result.provider?.error_message) || attempt === maxAttempts) {
      break;
    }
    partnerTrace('skinplace.inventory.fetch.retry', {
      attempt,
      providerError: result.provider?.error_message,
    });
    await new Promise((resolve) => setTimeout(resolve, 700 * attempt));
  }

  return lastFail ?? {
    ok: false,
    code: 'API_ERROR',
    error: 'Unable to fetch inventory from the trade provider',
  };
}

async function fetchSkinplaceInstantInventoryOnce(
  url: string,
  started: number,
  attempt: number
): Promise<FetchSkinplaceInstantInventoryResult> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'MoonSkin/1.0',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    partnerTrace('skinplace.inventory.fetch.headers', {
      attempt,
      status: response.status,
      elapsedMs: Date.now() - started,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
    });

    if (!response.ok) {
      partnerTrace('skinplace.inventory.fetch.http-error', { attempt, status: response.status });
      return {
        ok: false,
        code: 'API_ERROR',
        error: 'Unable to fetch inventory from the trade provider',
      };
    }

    const payload: unknown = await response.json();
    const items = extractSkinplaceInventoryItems(payload);
    const provider = skinplaceErrorFields(payload);
    partnerTrace('skinplace.inventory.fetch.body', {
      attempt,
      elapsedMs: Date.now() - started,
      itemCount: items?.length ?? -1,
      keys: jsonRootKeys(payload),
      providerStatus: provider.status,
      providerError: provider.error_message,
      heapMb: heapMb(),
    });
    if (!items) {
      partnerTrace('skinplace.inventory.fetch.shape-mismatch', {
        attempt,
        keys: jsonRootKeys(payload),
        providerStatus: provider.status,
        providerError: provider.error_message,
      });
      if ((provider.error_message ?? '').toLowerCase().replace(/-/g, '_') === 'empty_inventory') {
        partnerTrace('skinplace.inventory.empty', { attempt });
        return { ok: true, inventory: [] };
      }
      return {
        ok: false,
        code: 'API_ERROR',
        error: 'Unable to fetch inventory from the trade provider',
        provider,
      };
    }

    return { ok: true, inventory: items };
  } catch (err) {
    partnerTrace('skinplace.inventory.fetch.throw', {
      attempt,
      elapsedMs: Date.now() - started,
      error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
      heapMb: heapMb(),
    });
    return {
      ok: false,
      code: 'API_ERROR',
      error: 'Unable to fetch inventory from the trade provider',
    };
  }
}
