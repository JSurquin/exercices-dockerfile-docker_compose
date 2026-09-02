import { generateSkinplaceSignature } from '@/utils/skinplace-signature';

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
    return { ok: false, code: 'CONFIG_ERROR', error: 'Trade provider is not configured' };
  }

  if (!/^\d{17}$/.test(steamId)) {
    return { ok: false, code: 'API_ERROR', error: 'Unable to fetch inventory from the trade provider' };
  }

  const signature = generateSkinplaceSignature(steamId, privateKey);
  const params = new URLSearchParams();
  params.append('steamid', steamId);
  params.append('signature', signature);
  params.append('project', 'csgo');
  params.append('public key', publicKey);

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

    if (!response.ok) {
      return {
        ok: false,
        code: 'API_ERROR',
        error: 'Unable to fetch inventory from the trade provider',
      };
    }

    const data = (await response.json()) as { inventory?: SkinplaceInstantInventoryItem[] };
    if (!Array.isArray(data.inventory)) {
      return {
        ok: false,
        code: 'API_ERROR',
        error: 'Unable to fetch inventory from the trade provider',
      };
    }

    return { ok: true, inventory: data.inventory };
  } catch {
    return {
      ok: false,
      code: 'API_ERROR',
      error: 'Unable to fetch inventory from the trade provider',
    };
  }
}
