import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { TradeStatus } from '@prisma/client';
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

interface SkinplaceBotInfo {
  name: string;
  avatar: string;
  profile_url: string;
  level: string;
  registration_date: string;
  steamid: string;
}

/**
 * Mapper les statuts Skinplace/Steam vers nos statuts TradeStatus
 */
function mapSkinplaceStatusToTradeStatus(skinplaceStatus: string): TradeStatus {
  const statusMap: Record<string, TradeStatus> = {
    // Offre créée, en attente d'acceptation
    'pending': 'CREATED',
    'sent': 'CREATED',
    'created': 'CREATED',
    
    // Offre acceptée par l'utilisateur
    'accepted': 'ACCEPTED_BY_BOT',
    
    // En période de trade hold Steam (7 jours)
    'active': 'IN_TRADE_HOLD',
    'trade_hold': 'IN_TRADE_HOLD',
    
    // Items reçus, disponibles pour paiement
    'completed': 'AVAILABLE',
    'done': 'AVAILABLE',
    
    // Annulé
    'cancelled': 'CANCELLED',
    // Échecs techniques
    'declined': 'FAILED',
    'rejected': 'FAILED',
    'expired': 'FAILED',
    'failed': 'FAILED',
  };

  return statusMap[skinplaceStatus.toLowerCase()] || 'CREATED';
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

    // Vérifier les limites de trade (AVANT l'appel Skinplace pour éviter les trades orphelins)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tradesCountToday = await prisma.trade.count({
      where: {
        userId: user.id,
        createdAt: { gte: today },
      },
    });

    if (tradesCountToday >= 5) {
      return NextResponse.json(
        { success: false, error: 'Limite de trades quotidienne atteinte (5 max)' },
        { status: 429 }
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

    // Générer le token ici pour l'utiliser à la fois dans le payload Skinplace (order_id)
    // et comme ticketId du trade en DB — c'est la clé de lookup dans le webhook IPN
    const tradeToken2 = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Préparer les données pour l'API Skinplace selon la nouvelle structure
    const skinplacePayload = {
      signature: signature,
      public_key: publicKey,
      project: 'csgo',
      steamid: body.steam_id,
      trade_token: tradeToken,
      offers: body.items.map(item => item.asset_id), // Asset IDs des items à vendre
      ipn_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/skinplace/webhook?secret=${process.env.SKINPLACE_WEBHOOK_SECRET || ''}`, // URL de callback avec secret
      order_id: tradeToken2,
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
        'User-Agent': 'MoonSkin/1.0',
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
    const skinplaceStatus = steamTrade?.status || skinplaceData.status || 'pending';
    // Bot qui a récupéré le trade (peut être null si trade pas encore assigné)
    const botInfo: SkinplaceBotInfo | null = steamTrade?.bot || null;
    
    console.log('✅ Trade créé avec succès:');
    console.log('  - Trade Offer ID Steam:', tradeOfferId);
    console.log('  - Token Skinplace:', skinplaceToken);
    console.log('  - Prix total Skinplace:', steamTrade?.price, '€');
    console.log('  - Status Skinplace:', skinplaceStatus);
    
    // Mapper le statut Skinplace vers notre enum TradeStatus
    const tradeStatus = mapSkinplaceStatusToTradeStatus(skinplaceStatus);
    console.log('  - Status mappé:', tradeStatus);

    // Générer un ID unique pour le trade
    const tradeId = `TRADE-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    // tradeToken2 a déjà été généré avant le payload Skinplace et utilisé comme order_id
    const token = tradeToken2;

    // Date d'expiration (7 jours selon les règles Steam)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Date de disponibilité (dépend du statut)
    const availableAt = new Date();
    if (tradeStatus === 'ACCEPTED_BY_BOT' || tradeStatus === 'IN_TRADE_HOLD') {
      // 7 jours de trade hold si accepté
      availableAt.setDate(availableAt.getDate() + 7);
    } else if (tradeStatus === 'AVAILABLE') {
      // Disponible immédiatement si déjà complété
      // (cas rare mais possible)
    }

    // Date d'acceptation du trade (si accepté)
    const tradeAcceptedAt = (tradeStatus === 'ACCEPTED_BY_BOT' || tradeStatus === 'IN_TRADE_HOLD' || tradeStatus === 'AVAILABLE') 
      ? new Date() 
      : undefined;

    // Enregistrer le trade en base de données selon les règles CTF
    // Le statut est maintenant basé sur la réponse réelle de Skinplace
    const trade = await prisma.trade.create({
      data: {
        id: tradeId,
        userId: user.id,
        steamId: body.steam_id,
        tradeUrl: body.trade_url,
        status: tradeStatus, // États: CREATED -> ACCEPTED_BY_BOT -> IN_TRADE_HOLD -> AVAILABLE -> PAYOUT_PENDING -> PAID -> FAILED
        grossCents: body.gross_value_centimes,
        cashoutFees: body.fees.cashout_fee,
        networkFees: body.fees.network_fee,
        netCents: body.net_value_centimes,
        availableAt: tradeStatus !== 'FAILED' ? availableAt : undefined,
        expiresAt: expiresAt,
        tradeAcceptedAt,
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
          initialStatus: tradeStatus,
          skinplaceStatus,
          tradeOfferId,
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
      // Infos du bot Skinplace qui a récupéré le trade
      bot: botInfo,
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
