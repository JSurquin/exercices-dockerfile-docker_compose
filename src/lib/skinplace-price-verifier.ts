import { generateSkinplaceSignature } from '@/utils/skinplace-signature';

export interface VerifiedItem {
  asset_id: string;
  market_hash_name: string;
  icon_url: string;
  rarity: string;
  exterior: string;
  is_stattrak: boolean;
  is_souvenir: boolean;
  price_centimes: number;
}

interface SkinplaceInventoryItem {
  market_name: string;
  market_hash_name: string;
  assetid: string;
  appid: number;
  project: string;
  skip_reason?: string;
  untouchable: boolean;
  is_stattrak: number;
  is_souvenir: number;
  rarity: string;
  exterior: string;
  price: number;
  icon_url: string;
}

interface SkinplaceInventoryResponse {
  inventory: SkinplaceInventoryItem[];
}

type VerifyResult =
  | { ok: true; items: Map<string, VerifiedItem> }
  | { ok: false; error: string; code: 'API_ERROR' | 'ITEMS_NOT_FOUND' | 'CONFIG_ERROR' };

/**
 * Appelle Skinplace pour récupérer l'inventaire réel du joueur et retourne
 * les prix vérifiés pour les asset_ids demandés.
 *
 * Vérifie à la fois l'ownership (l'item est dans l'inventaire du user)
 * et le prix (prix serveur, jamais le prix client).
 */
export async function verifyAndPriceItems(
  steamId: string,
  assetIds: string[]
): Promise<VerifyResult> {
  const privateKey = process.env.SKINPLACE_API_KEY_PRIVATE;
  const publicKey = process.env.SKINPLACE_API_KEY_PUBLIC;

  if (!privateKey || !publicKey) {
    return { ok: false, error: 'Configuration API manquante', code: 'CONFIG_ERROR' };
  }

  const signature = generateSkinplaceSignature(steamId, privateKey);

  const params = new URLSearchParams({
    steamid: steamId,
    signature,
    project: 'csgo',
    'public key': publicKey,
  });

  const url = `https://api.skin.place/api/v3/instant/inventory?${params.toString()}`;

  let data: SkinplaceInventoryResponse;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'MoonSkin/1.0',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      console.error(`[PRICE-VERIFIER] Skinplace API error: ${response.status}`);
      return {
        ok: false,
        error: `Erreur API (${response.status}): impossible de vérifier les prix`,
        code: 'API_ERROR',
      };
    }

    data = await response.json();
  } catch (err) {
    console.error('[PRICE-VERIFIER] Fetch failed:', err);
    return {
      ok: false,
      error: 'Impossible de contacter notre API pour vérifier les prix',
      code: 'API_ERROR',
    };
  }

  if (!data.inventory || !Array.isArray(data.inventory)) {
    return {
      ok: false,
      error: 'Inventaire vide ou inaccessible',
      code: 'API_ERROR',
    };
  }

  const inventoryMap = new Map<string, SkinplaceInventoryItem>();
  for (const item of data.inventory) {
    if (!item.untouchable && !item.skip_reason) {
      inventoryMap.set(item.assetid, item);
    }
  }

  const verifiedItems = new Map<string, VerifiedItem>();
  const missingIds: string[] = [];

  for (const assetId of assetIds) {
    const inv = inventoryMap.get(assetId);
    if (!inv) {
      missingIds.push(assetId);
      continue;
    }

    verifiedItems.set(assetId, {
      asset_id: inv.assetid,
      market_hash_name: inv.market_hash_name,
      icon_url: `https://community.cloudflare.steamstatic.com/economy/image/${inv.icon_url}`,
      rarity: inv.rarity,
      exterior: inv.exterior,
      is_stattrak: inv.is_stattrak === 1,
      is_souvenir: inv.is_souvenir === 1,
      price_centimes: Math.round(inv.price * 100),
    });
  }

  if (missingIds.length > 0) {
    console.warn('[PRICE-VERIFIER] Items not found in inventory:', missingIds);
    return {
      ok: false,
      error: `Items introuvables dans votre inventaire Steam: ${missingIds.join(', ')}. Ils ne vous appartiennent pas ou ne sont pas disponibles.`,
      code: 'ITEMS_NOT_FOUND',
    };
  }

  return { ok: true, items: verifiedItems };
}
