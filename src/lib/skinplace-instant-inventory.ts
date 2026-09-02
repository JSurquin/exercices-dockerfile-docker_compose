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
  | { ok: false; code: 'CONFIG_ERROR' | 'API_ERROR'; error: string };

function jsonRootKeys(payload: unknown): string[] | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  return Object.keys(payload as object).slice(0, 24);
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

  const started = Date.now();
  partnerTrace('skinplace.inventory.fetch.start', { steamId, heapMb: heapMb() });
  try {
    const response = await fetch(
      `https://api.skin.place/api/v3/instant/inventory?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'MoonSkin/1.0',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    partnerTrace('skinplace.inventory.fetch.headers', {
      status: response.status,
      elapsedMs: Date.now() - started,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
    });

    if (!response.ok) {
      partnerTrace('skinplace.inventory.fetch.http-error', { status: response.status });
      return {
        ok: false,
        code: 'API_ERROR',
        error: 'Unable to fetch inventory from the trade provider',
      };
    }

    const payload: unknown = await response.json();
    const items = extractSkinplaceInventoryItems(payload);
    partnerTrace('skinplace.inventory.fetch.body', {
      elapsedMs: Date.now() - started,
      itemCount: items?.length ?? -1,
      keys: jsonRootKeys(payload),
      heapMb: heapMb(),
    });
    if (!items) {
      partnerTrace('skinplace.inventory.fetch.shape-mismatch', {
        keys: jsonRootKeys(payload),
      });
      return {
        ok: false,
        code: 'API_ERROR',
        error: 'Unable to fetch inventory from the trade provider',
      };
    }

    return { ok: true, inventory: items };
  } catch (err) {
    partnerTrace('skinplace.inventory.fetch.throw', {
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
