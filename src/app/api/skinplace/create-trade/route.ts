import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateSkinplaceSignature } from '@/utils/skinplace-signature';

interface CreateTradeRequest {
  steam_id: string;
  trade_url: string;
  items: Array<{
    asset_id: string;
    market_hash_name: string;
    icon_url: string;
    rarity: string;
    exterior: string;
    is_stattrak: boolean;
    is_souvenir: boolean;
    price_centimes: number;
  }>;
  gross_value_centimes: number;
  fees: {
    cashout_fee: number;
    network_fee: number;
    total_fees: number;
  };
  net_value_centimes: number;
}

interface SkinplaceTradeResponse {
  success: boolean;
  trade_id?: string;
  token?: string;
  status?: string;
  expires_at?: string;
  error?: string;
  message?: string;
}

export async function POST(request: NextRequest) {
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

    const body: CreateTradeRequest = await request.json();
    
    // Validation des données
    if (!body.steam_id || !body.trade_url || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur crée un trade pour lui-même
    if (body.steam_id !== session.user.steamId) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Validation de l'URL de trade Steam
    const steamTradeUrlRegex = /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=\d+&token=[a-zA-Z0-9_-]+$/;
    if (!steamTradeUrlRegex.test(body.trade_url)) {
      return NextResponse.json(
        { success: false, error: 'URL de trade Steam invalide' },
        { status: 400 }
      );
    }

    // Validation des valeurs (doivent être positives)
    if (body.gross_value_centimes <= 0 || body.net_value_centimes <= 0) {
      return NextResponse.json(
        { success: false, error: 'Les valeurs doivent être positives' },
        { status: 400 }
      );
    }

    // Récupérer les clés d'API depuis les variables d'environnement
    const privateKey = process.env.SKINPLACE_API_KEY_PRIVATE;
    const publicKey = process.env.SKINPLACE_API_KEY_PUBLIC;

    if (!privateKey || !publicKey) {
      console.error('Clés API Skinplace manquantes');
      return NextResponse.json(
        { success: false, error: 'Configuration API manquante' },
        { status: 500 }
      );
    }

    // Générer la signature pour l'API Skinplace
    const signature = generateSkinplaceSignature(body.steam_id, privateKey);

    // Extraire le token de trade depuis l'URL Steam
    const tradeUrlMatch = body.trade_url.match(/partner=(\d+)&token=([a-zA-Z0-9_-]+)/);
    if (!tradeUrlMatch) {
      return NextResponse.json(
        { success: false, error: 'URL de trade Steam invalide - impossible d\'extraire le token' },
        { status: 400 }
      );
    }
    const tradeToken = tradeUrlMatch[2];

    // Préparer les données pour l'API Skinplace selon la nouvelle structure
    const skinplacePayload = {
      signature: signature,
      public_key: publicKey,
      project: 'csgo',
      steamid: body.steam_id,
      trade_token: tradeToken,
      offers: body.items.map(item => item.asset_id), // Asset IDs des items à vendre
      ipn_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/skinplace/webhook`, // URL de callback
      order_id: `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      send_offer_sync: 1, // Envoyer l'offre de manière synchrone
    };

    console.log('🔄 Création de trade Skinplace:');
    console.log('  - Steam ID:', body.steam_id);
    console.log('  - Nombre d\'items:', body.items.length);
    console.log('  - Items (asset IDs):', body.items.map(item => item.asset_id));
    console.log('  - Trade token:', tradeToken);
    console.log('  - Payload complet:', JSON.stringify(skinplacePayload, null, 2));

    // Appeler l'API Skinplace pour créer le trade instantané
    const skinplaceResponse = await fetch('https://api.skin.place/api/v3/instant/inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CashTrade/1.0',
        'Accept': 'application/json',
      },
      body: JSON.stringify(skinplacePayload),
      // Timeout de 15 secondes
      signal: AbortSignal.timeout(15000),
    });

    if (!skinplaceResponse.ok) {
      console.error(`Erreur API Skinplace: ${skinplaceResponse.status} ${skinplaceResponse.statusText}`);
      
      const errorData = await skinplaceResponse.json().catch(() => ({}));
      console.error('Détails erreur Skinplace:', errorData);
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Erreur Skinplace: ${errorData.message || 'Erreur lors de la création du trade'}` 
        },
        { status: skinplaceResponse.status }
      );
    }

    const skinplaceData = await skinplaceResponse.json();
    
    console.log('📦 Réponse Skinplace complète:', JSON.stringify(skinplaceData, null, 2));

    // Skinplace retourne { status: 'success' } au lieu de { success: true }
    if (skinplaceData.status !== 'success') {
      return NextResponse.json(
        { 
          success: false, 
          error: skinplaceData.error || skinplaceData.message || 'Erreur lors de la création du trade' 
        },
        { status: 400 }
      );
    }

    // Extraire les données importantes de la réponse Skinplace
    const steamTrade = skinplaceData.steamtrade;
    const tradeOfferId = steamTrade?.tradeofferid;
    const skinplaceToken = skinplaceData.token;
    
    console.log('✅ Trade créé avec succès:');
    console.log('  - Trade Offer ID Steam:', tradeOfferId);
    console.log('  - Token Skinplace:', skinplaceToken);
    console.log('  - Prix total Skinplace:', steamTrade?.price, '€');
    console.log('  - Status:', steamTrade?.status);

    // TODO: Enregistrer le trade en base de données selon les règles CTF
    // - Créer l'entrée dans la table `trades`
    // - Enregistrer les items associés
    // - Calculer et enregistrer les frais
    // - Définir le statut initial ('accepté_par_bot')
    // - Programmer le paiement automatique après 7 jours

    // Date de disponibilité (7 jours de trade hold Steam)
    const availableAt = new Date();
    availableAt.setDate(availableAt.getDate() + 7);

    const tradeData = {
      trade_id: tradeOfferId || `TRADE_${Date.now()}`,
      token: skinplaceToken || '',
      status: 'accepté_par_bot', // Le bot a accepté le trade
      expires_at: availableAt.toISOString(),
      gross_value_centimes: body.gross_value_centimes,
      net_value_centimes: body.net_value_centimes,
      fees: body.fees,
      items: body.items,
      skinplace_data: {
        token: skinplaceToken,
        trade_offer_id: tradeOfferId,
        bot_steamid: steamTrade?.bot?.steamid,
        bot_name: steamTrade?.bot?.name,
        price_skinplace: Math.round((steamTrade?.price || 0) * 100), // Convertir en centimes
      },
    };

    console.log('Trade créé avec succès:', tradeData.trade_id);

    return NextResponse.json({
      success: true,
      data: tradeData,
    });

  } catch (error) {
    console.error('Erreur lors de la création du trade:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: 'Timeout lors de la création du trade' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
