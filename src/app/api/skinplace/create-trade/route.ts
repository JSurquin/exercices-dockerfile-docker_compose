import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { TradeStatus } from '@prisma/client';
import { generateSkinplaceSignature } from '@/utils/skinplace-signature';
import { TradeHooks } from '@/lib/trade-hooks';
import { newsletterService } from '@/lib/newsletter-service';
import {
  computeTradeLedgerFromGross,
  getCashoutFeeRate,
} from '@/lib/trade-platform-fees';
import { AffiliateService } from '@/lib/affiliate-service';

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
  /** Code affilié = code promo (+0,2 % brut net + fragments à la confirmation) */
  affiliate_promo_code?: string | null;
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
  // Source: skinplace3.md — steamtrade.status enum
  // "pending"   = trade en cours de création côté bot (pas encore envoyé)
  // "active"    = offre Steam envoyée par le bot, en ATTENTE d'acceptation utilisateur
  // "finished"  = l'utilisateur a accepté → entre en trade hold 7 jours
  // "cancelled" = annulé
  const statusMap: Record<string, TradeStatus> = {
    'pending':    'CREATED',
    'sent':       'CREATED',
    'created':    'CREATED',

    // Offre envoyée, en attente d'acceptation utilisateur
    'active':     'ACCEPTED_BY_BOT',

    // Utilisateur a accepté → hold démarre
    'finished':   'IN_TRADE_HOLD',

    // Items disponibles
    'completed':  'AVAILABLE',
    'done':       'AVAILABLE',

    // Annulé / échecs
    'cancelled':  'CANCELLED',
    'declined':   'FAILED',
    'rejected':   'FAILED',
    'expired':    'FAILED',
    'failed':     'FAILED',
    'error':      'FAILED',
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

    if (body.gross_value_centimes <= 0) {
      return NextResponse.json(
        { success: false, error: 'La valeur brute doit être positive' },
        { status: 400 }
      );
    }

    const cashoutFeeRate = await getCashoutFeeRate();
    const ledger = computeTradeLedgerFromGross(body.gross_value_centimes, cashoutFeeRate);
    if (ledger.netCents <= 0) {
      return NextResponse.json(
        { success: false, error: 'La valeur nette après frais plateforme doit être positive' },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur depuis la base de données (avant promo / Skinplace)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    let affiliatePromoCode: string | null = null;
    let affiliatePromoBonusCents = 0;
    const rawPromo =
      typeof body.affiliate_promo_code === 'string' ? body.affiliate_promo_code.trim() : '';
    if (rawPromo) {
      const promo = await AffiliateService.validateAffiliateSellPromoCode(user.id, rawPromo);
      if (!promo.ok) {
        const err =
          promo.error === 'self'
            ? 'Vous ne pouvez pas utiliser votre propre code affilié.'
            : promo.error === 'other_affiliate'
              ? 'Un autre partenaire est déjà associé à votre compte : ce code ne peut pas être appliqué.'
              : 'Code promo invalide ou affilié inactif.';
        return NextResponse.json({ success: false, error: err }, { status: 400 });
      }
      await AffiliateService.bindUserToAffiliateForSellPromo(user.id, promo.affiliateId);
      affiliatePromoCode = promo.code;
      affiliatePromoBonusCents = AffiliateService.computeSellPromoBonusCents(
        body.gross_value_centimes
      );
    }

    const netCentsWithPromo = ledger.netCents + affiliatePromoBonusCents;
    if (netCentsWithPromo <= 0) {
      return NextResponse.json(
        { success: false, error: 'La valeur nette après frais et code promo doit être positive' },
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

    // Vérifier les limites de trade (AVANT l'appel Skinplace pour éviter les trades orphelins)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tradesCountToday = await prisma.trade.count({
      where: {
        userId: user.id,
        createdAt: { gte: today },
      },
    });

    // if (tradesCountToday >= 5) {
    //   return NextResponse.json(
    //     { success: false, error: 'Limite de trades quotidienne atteinte (5 max)' },
    //     { status: 429 }
    //   );
    // }

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
    
    console.log('[CREATE-TRADE] Réponse Skinplace complète:', JSON.stringify(skinplaceData, null, 2));
    console.log('[CREATE-TRADE] skinplaceData.token (skinplaceToken):', skinplaceData.token ?? 'NULL');
    console.log('[CREATE-TRADE] skinplaceData.steamtrade:', JSON.stringify(skinplaceData.steamtrade, null, 2));
    console.log('[CREATE-TRADE] order_id envoyé (tradeToken2/ticketId):', tradeToken2);

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
    
    console.log('[CREATE-TRADE] Trade Skinplace créé:');
    console.log('[CREATE-TRADE]   tradeOfferId Steam:', tradeOfferId ?? 'NULL (async mode?)');
    console.log('[CREATE-TRADE]   skinplaceToken:', skinplaceToken ?? 'NULL !!!');
    console.log('[CREATE-TRADE]   steamtrade.status:', skinplaceStatus);
    console.log('[CREATE-TRADE]   steamtrade.price:', steamTrade?.price);

    if (!skinplaceToken) {
      console.error('[CREATE-TRADE] ATTENTION: skinplaceToken NULL — la stratégie 1 du polling sera impossible, seul le fallback order_id fonctionnera');
    }
    
    const tradeStatus = mapSkinplaceStatusToTradeStatus(skinplaceStatus);
    console.log('[CREATE-TRADE]   status mappé Prisma:', tradeStatus);

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
        cashoutFees: ledger.cashoutFees,
        networkFees: ledger.networkFees,
        netCents: netCentsWithPromo,
        affiliatePromoCode,
        affiliatePromoBonusCents,
        availableAt: tradeStatus !== 'FAILED' ? availableAt : undefined,
        expiresAt: expiresAt,
        tradeAcceptedAt,
        ticketId: token,
        skinplaceToken: skinplaceToken || null,
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
          netValue: netCentsWithPromo,
          affiliatePromoCode,
          affiliatePromoBonusCents,
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
    const notificationEmail = (user as { contactEmail?: string | null }).contactEmail || user.email;
    if (notificationEmail) {
      try {
        await newsletterService.sendTradeCreatedEmail(
          notificationEmail,
          user.name || notificationEmail,
          {
            tradeId: trade.id,
            itemsCount: body.items.length,
            grossValue: body.gross_value_centimes,
            netValue: netCentsWithPromo,
            availableAt: trade.availableAt?.toISOString() || new Date().toISOString(),
          }
        );
        console.log(`✅ Email de confirmation de trade envoyé à ${notificationEmail}`);
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

    console.log('[CREATE-TRADE] Trade sauvegardé en DB:', trade.id, '| skinplaceToken stocké:', trade.skinplaceToken ?? 'NULL');
    console.log('[CREATE-TRADE] Réponse au client (tradeData):', JSON.stringify(tradeData, null, 2));

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
