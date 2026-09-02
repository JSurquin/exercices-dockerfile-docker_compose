import {
  fetchSkinplaceInstantInventory,
  isSkinplaceItemSellable,
  type SkinplaceInstantInventoryItem,
} from '@/lib/skinplace-instant-inventory';
import { partnerTrace } from '@/lib/partner-api/trace';

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

type VerifyResult =
  | { ok: true; items: Map<string, VerifiedItem> }
  | {
      ok: false;
      error: string;
      code: 'API_ERROR' | 'ITEMS_NOT_FOUND' | 'CONFIG_ERROR';
      provider?: { status?: string; error_message?: string };
    };

function toVerifiedItem(inv: SkinplaceInstantInventoryItem): VerifiedItem {
  const icon = inv.icon_url?.startsWith('http')
    ? inv.icon_url
    : `https://community.cloudflare.steamstatic.com/economy/image/${inv.icon_url}`;
  return {
    asset_id: inv.assetid,
    market_hash_name: inv.market_hash_name,
    icon_url: icon,
    rarity: inv.rarity,
    exterior: inv.exterior,
    is_stattrak: inv.is_stattrak === 1,
    is_souvenir: inv.is_souvenir === 1,
    price_centimes: Math.round(inv.price * 100),
  };
}

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
  partnerTrace('price-verifier.start', { steamId, assetCount: assetIds.length });
  const fetched = await fetchSkinplaceInstantInventory(steamId);
  if (!fetched.ok) {
    partnerTrace('price-verifier.fail', {
      code: fetched.code,
      providerStatus: fetched.provider?.status,
      providerError: fetched.provider?.error_message,
    });
    if (fetched.code === 'CONFIG_ERROR') {
      return { ok: false, error: 'Configuration API manquante', code: 'CONFIG_ERROR' };
    }
    return {
      ok: false,
      error: 'Impossible de contacter notre API pour vérifier les prix',
      code: 'API_ERROR',
      provider: fetched.provider,
    };
  }

  const inventoryMap = new Map<string, SkinplaceInstantInventoryItem>();
  for (const item of fetched.inventory) {
    if (isSkinplaceItemSellable(item)) {
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
    verifiedItems.set(assetId, toVerifiedItem(inv));
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
