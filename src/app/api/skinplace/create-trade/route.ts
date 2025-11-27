import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { generateSkinplaceSignature } from '@/utils/skinplace-signature';
import { TradeHooks } from '@/lib/trade-hooks';
import { newsletterService } from '@/lib/newsletter-service';

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

    // Récupérer l'utilisateur depuis la base de données
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier les limites de trade (selon les règles CTF)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tradesCountToday = await prisma.trade.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: today,
        },
      },
    });

    // Limite de 5 trades par jour par utilisateur
    if (tradesCountToday >= 5) {
      return NextResponse.json(
        { success: false, error: 'Limite de trades quotidienne atteinte (5 max)' },
        { status: 429 }
      );
    }

    // Générer un ID unique pour le trade
    const tradeId = `TRADE-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Date d'expiration (7 jours selon les règles Steam)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Date de disponibilité (7 jours de trade hold)
    const availableAt = new Date();
    availableAt.setDate(availableAt.getDate() + 7);

    // Enregistrer le trade en base de données selon les règles CTF
    const trade = await prisma.trade.create({
      data: {
        id: tradeId,
        userId: user.id,
        steamId: body.steam_id,
        tradeUrl: body.trade_url,
        status: 'ACCEPTED_BY_BOT', // États: CREATED -> ACCEPTED_BY_BOT -> IN_TRADE_HOLD -> AVAILABLE -> PAYMENT_IN_PROGRESS -> PAID -> FAILED
        grossCents: body.gross_value_centimes,
        cashoutFees: body.fees.cashout_fee,
        networkFees: body.fees.network_fee,
        netCents: body.net_value_centimes,
        availableAt: availableAt,
        expiresAt: expiresAt,
        ticketId: token,
        items: {
          create: body.items.map((item) => ({
            name: item.market_hash_name,
            marketHashName: item.market_hash_name,
            priceCents: item.price_centimes,
            iconUrl: item.icon_url,
            rarity: item.rarity,
            exterior: item.exterior || '',
            statTrak: item.is_stattrak,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Journaliser l'action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'TRADE_CREATED',
        details: {
          tradeId: trade.id,
          itemsCount: body.items.length,
          grossValue: body.gross_value_centimes,
          netValue: body.net_value_centimes,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
      },
    });

    // Appeler les hooks de trade
    await TradeHooks.onTradeCreated(user.id, trade.id);

    // Envoyer l'email de confirmation de trade (en arrière-plan)
    if (user.email) {
      try {
        await newsletterService.sendTradeCreatedEmail(
          user.email,
          user.name || user.email,
          {
            tradeId: trade.id,
            itemsCount: body.items.length,
            grossValue: body.gross_value_centimes,
            netValue: body.net_value_centimes,
            availableAt: trade.availableAt?.toISOString() || new Date().toISOString(),
          }
        );
        console.log(`✅ Email de confirmation de trade envoyé à ${user.email}`);
      } catch (emailError) {
        console.error('❌ Erreur envoi email trade:', emailError);
        // Ne pas faire échouer la création du trade si l'email échoue
      }
    }

    const tradeData = {
      trade_id: trade.id,
      token: trade.ticketId,
      status: trade.status,
      expires_at: trade.expiresAt?.toISOString() || null,
      gross_value_centimes: trade.grossCents,
      net_value_centimes: trade.netCents,
      fees: {
        cashout_fee: trade.cashoutFees,
        network_fee: trade.networkFees,
      },
      items_count: trade.items?.length || 0,
    };

    console.log('✅ Trade créé et sauvegardé avec succès:', trade.id);

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
