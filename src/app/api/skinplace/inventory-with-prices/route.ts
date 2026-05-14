import { NextRequest, NextResponse } from 'next/server';
import { INVENTORY_ERROR_PRIVATE } from '@/lib/inventory-api-errors';
import { auth } from '~/lib/auth';
import { generateSkinplaceSignature, validateSkinplaceParams } from '@/utils/skinplace-signature';
import { RateLimiter, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';

const rateLimiter = new RateLimiter('INVENTORY_FETCH', RATE_LIMIT_CONFIGS.API_GENERAL);

// Interface pour la réponse de l'API Skin.place
interface SkinplaceInventoryItem {
  market_name: string;
  market_hash_name: string;
  steam_market_hash_name: string;
  assetid: string;
  appid: number;
  project: string;
  skip_reason?: string;
  untouchable: boolean;
  item_id: number;
  steam_short_name: string;
  is_stattrak: number;
  is_souvenir: number;
  rarity: string;
  rarity_color: string;
  steam_itemtype: string;
  exterior: string;
  shorten_exterior: string;
  phase: string | null;
  price: number;
  price_original: number;
  price_real: number;
  inspect_url: string;
  icon_url: string;
  descriptions: Array<{
    type: string;
    value: string;
    name: string;
    color?: string;
  }>;
  tags: any[];
  stickers: Array<{
    id: number;
    name: string;
    icon_url: string;
    price: number;
    steam_price: number;
    type: string;
  }>;
}

interface SkinplaceInventoryResponse {
  inventory: SkinplaceInventoryItem[];
}

// Interface pour notre réponse normalisée
export interface NormalizedInventoryItem {
  // Identifiants
  id: string;
  assetid: string;
  appid: number;
  project: string;
  
  // Informations de base
  market_name: string;
  market_hash_name: string;
  steam_market_hash_name: string;
  steam_short_name: string;
  name: string;
  type: string;
  
  // Apparence
  icon_url: string;
  inspect_url: string;
  
  // Propriétés
  rarity: string;
  rarity_color: string;
  exterior: string;
  shorten_exterior: string;
  phase: string | null;
  is_stattrak: boolean;
  is_souvenir: boolean;
  
  // Prix (en centimes pour respecter les règles)
  price_centimes: number;
  price_original_centimes: number;
  price_real_centimes: number;
  
  // Statut
  tradable: boolean;
  marketable: boolean;
  skip_reason?: string;
  
  // Données supplémentaires
  descriptions: Array<{
    type: string;
    value: string;
    name: string;
    color?: string;
  }>;
  stickers: Array<{
    id: number;
    name: string;
    icon_url: string;
    price_centimes: number;
    steam_price_centimes: number;
    type: string;
  }>;
}

export interface NormalizedInventoryResponse {
  success: boolean;
  total_count: number;
  tradable_count: number;
  total_value_centimes: number;
  items: NormalizedInventoryItem[];
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const rateCheck = await rateLimiter.checkLimit(request, session.user.id);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Trop de requêtes. Réessayez plus tard.' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const steamId = searchParams.get('steam_id');

    if (!steamId) {
      return NextResponse.json(
        { success: false, error: 'steam_id est requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur demande son propre inventaire OU celui de son trade link
    const { prisma } = await import('~/prisma/prisma');
    const { parseSteamId64FromUserInput } = await import('@/lib/steam-id');
    
    // Récupérer le trade link de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { steamId: true, tradeLink: true }
    });
    
    const allowedSteamIds = [session.user.steamId];
    
    // Si l'utilisateur a un trade link, autoriser aussi le Steam ID qu'il contient
    if (user?.tradeLink) {
      const tradeLinkSteamId = parseSteamId64FromUserInput(user.tradeLink);
      if (tradeLinkSteamId) {
        allowedSteamIds.push(tradeLinkSteamId);
      }
    }
    
    if (!allowedSteamIds.includes(steamId)) {
      console.log('🚫 Accès refusé:', {
        demandé: steamId,
        autorisés: allowedSteamIds,
        session_steamId: session.user.steamId,
        tradeLink: user?.tradeLink,
      });
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      );
    }
    
    console.log('✅ Accès autorisé pour Steam ID:', steamId, '(compte connexion ou trade link)');

    // Récupérer les clés d'API depuis les variables d'environnement
    const privateKey = process.env.SKINPLACE_API_KEY_PRIVATE;
    const publicKey = process.env.SKINPLACE_API_KEY_PUBLIC;

    if (!privateKey || !publicKey) {
      console.error('[INVENTORY] Skinplace API keys missing');
      return NextResponse.json(
        { success: false, error: 'Configuration API manquante' },
        { status: 500 }
      );
    }

    // Générer la signature
    const signature = generateSkinplaceSignature(steamId, privateKey);

    // Valider les paramètres
    const params = {
      steamId, // On garde steamId ici pour la validation interne
      signature,
      project: 'csgo',
      publicKey,
    };

    if (!validateSkinplaceParams(params)) {
      return NextResponse.json(
        { success: false, error: 'Paramètres invalides' },
        { status: 400 }
      );
    }

    // Construire l'URL de l'API Skin.place - Méthode alternative pour éviter les problèmes d'encodage
    const baseUrl = 'https://api.skin.place/api/v3/instant/inventory';
    const urlParams = new URLSearchParams();
    urlParams.append('steamid', steamId); // ⚠️ CORRECTION: steamid en minuscules !
    urlParams.append('signature', signature);
    urlParams.append('project', 'csgo');
    urlParams.append('public key', publicKey);
    
    const finalUrl = `${baseUrl}?${urlParams.toString()}`;


    // Appeler l'API Skin.place
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'MoonSkin/1.0',
        'Accept': 'application/json',
      },
      // Timeout de 15 secondes
      signal: AbortSignal.timeout(15000),
    });


    if (!response.ok) {
      console.error(`Erreur API Skin.place: ${response.status} ${response.statusText}`);
      
      if (response.status === 401) {
        return NextResponse.json(
          { success: false, error: 'Authentification Skin.place échouée' },
          { status: 401 }
        );
      }
      
      if (response.status === 403) {
        return NextResponse.json(
          { success: false, error: INVENTORY_ERROR_PRIVATE },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération de l\'inventaire' },
        { status: response.status }
      );
    }

    const data: SkinplaceInventoryResponse = await response.json();

    // Normaliser les données pour notre application
    const normalizedItems: NormalizedInventoryItem[] = (data.inventory || []).map(item => ({
      // Identifiants
      id: item.assetid,
      assetid: item.assetid,
      appid: item.appid,
      project: item.project,
      
      // Informations de base
      market_name: item.market_name,
      market_hash_name: item.market_hash_name,
      steam_market_hash_name: item.steam_market_hash_name,
      steam_short_name: item.steam_short_name,
      name: item.market_name, // Utiliser market_name comme nom principal
      type: item.steam_itemtype,
      
      // Apparence
      icon_url: `https://community.cloudflare.steamstatic.com/economy/image/${item.icon_url}`,
      inspect_url: item.inspect_url,
      
      // Propriétés
      rarity: item.rarity,
      rarity_color: item.rarity_color,
      exterior: item.exterior,
      shorten_exterior: item.shorten_exterior,
      phase: item.phase,
      is_stattrak: item.is_stattrak === 1,
      is_souvenir: item.is_souvenir === 1,
      
      // Prix (convertir en centimes selon les règles)
      price_centimes: Math.round(item.price * 100),
      price_original_centimes: Math.round(item.price_original * 100),
      price_real_centimes: Math.round(item.price_real * 100),
      
      // tradable = l'item est visible dans l'inventaire Steam (même si Skinplace ne peut pas l'acheter)
      // Un item avec skip_reason reste "tradable" (affiché) mais non sélectionnable
      // untouchable sans skip_reason = item Steam non tradable (ex: cadeau non ouvert)
      tradable: !item.untouchable || !!item.skip_reason,
      marketable: true,
      // Si untouchable sans skip_reason explicite, on marque system_lock (overstock)
      skip_reason: item.skip_reason || (item.untouchable ? 'system_lock' : undefined),
      
      // Données supplémentaires
      descriptions: item.descriptions || [],
      stickers: (item.stickers || []).map(sticker => ({
        ...sticker,
        price_centimes: Math.round(sticker.price * 100),
        steam_price_centimes: Math.round(sticker.steam_price * 100),
      })),
    }));

    // Filtrer les items tradables et calculer les statistiques
    const tradableItems = normalizedItems.filter(item => item.tradable);
    const totalValue = tradableItems.reduce((sum, item) => sum + item.price_centimes, 0);

    const result: NormalizedInventoryResponse = {
      success: true,
      total_count: normalizedItems.length,
      tradable_count: tradableItems.length,
      total_value_centimes: totalValue,
      items: normalizedItems,
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'inventaire Skin.place:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: 'Timeout lors de la récupération de l\'inventaire' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
