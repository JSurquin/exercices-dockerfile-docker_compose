import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { generateSkinplaceSignature, validateSkinplaceParams } from '@/utils/skinplace-signature';

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

    const { searchParams } = new URL(request.url);
    const steamId = searchParams.get('steam_id');

    if (!steamId) {
      return NextResponse.json(
        { success: false, error: 'steam_id est requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur demande son propre inventaire
    if (steamId !== session.user.steamId) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Récupérer les clés d'API depuis les variables d'environnement
    const privateKey = process.env.SKINPLACE_API_KEY_PRIVATE;
    const publicKey = process.env.SKINPLACE_API_KEY_PUBLIC;

    console.log('🔑 Variables d\'environnement Skinplace:');
    console.log('  - SKINPLACE_API_KEY_PRIVATE définie:', !!privateKey);
    console.log('  - SKINPLACE_API_KEY_PRIVATE longueur:', privateKey?.length || 0);
    console.log('  - SKINPLACE_API_KEY_PUBLIC définie:', !!publicKey);
    console.log('  - SKINPLACE_API_KEY_PUBLIC:', publicKey);

    if (!privateKey || !publicKey) {
      console.error('❌ Clés API Skinplace manquantes');
      console.error('  - Variables d\'environnement disponibles:', Object.keys(process.env).filter(key => key.includes('SKINPLACE')));
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

    console.log('🔗 URL construite (méthode alternative):');
    console.log('  - URL complète:', finalUrl.replace(signature, '[SIGNATURE_HIDDEN]'));
    console.log('  - Paramètres individuels:');
    urlParams.forEach((value, key) => {
      console.log(`    ${key}: ${key === 'signature' ? value.substring(0, 10) + '...' : value}`);
    });

    console.log('🔍 DEBUG - Paramètres générés:');
    console.log('  - steamId:', steamId);
    console.log('  - signature (premiers 10 chars):', signature.substring(0, 10) + '...');
    console.log('  - signature (longueur):', signature.length);
    console.log('  - publicKey:', publicKey);
    console.log('  - privateKey (définie):', !!privateKey);
    
    console.log('🌐 Appel API Skin.place:', finalUrl.replace(signature, '[SIGNATURE_HIDDEN]'));

    // Appeler l'API Skin.place
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'CashTrade/1.0',
        'Accept': 'application/json',
      },
      // Timeout de 15 secondes
      signal: AbortSignal.timeout(15000),
    });

    console.log('📡 Réponse API Skin.place:');
    console.log('  - Status:', response.status);
    console.log('  - Status Text:', response.statusText);
    console.log('  - Headers:', Object.fromEntries(response.headers.entries()));

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
          { success: false, error: 'Inventaire privé ou inaccessible' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération de l\'inventaire' },
        { status: response.status }
      );
    }

    const data: SkinplaceInventoryResponse = await response.json();
    
    console.log('📦 Données brutes reçues de Skin.place:');
    console.log('  - Type de data:', typeof data);
    console.log('  - Clés disponibles:', Object.keys(data));
    console.log('  - data.inventory existe:', !!data.inventory);
    console.log('  - Type de data.inventory:', typeof data.inventory);
    console.log('  - Longueur inventory:', data.inventory?.length || 'undefined');
    
    if (data.inventory && data.inventory.length > 0) {
      console.log('  - Premier item exemple:', JSON.stringify(data.inventory[0], null, 2));
    } else {
      console.log('  - Données complètes reçues:', JSON.stringify(data, null, 2));
    }
    
    console.log(`📊 Inventaire récupéré: ${data.inventory?.length || 0} items`);

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
      
      // Statut (les items de Skin.place sont généralement tradables sauf si skip_reason)
      tradable: true,
      marketable: true,
      skip_reason: item.skip_reason,
      
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
