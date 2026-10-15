import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import { TradeStatus } from '@prisma/client';
import { generateSkinplaceSignature } from '@/utils/skinplace-signature';
import { TradeHooks } from '@/lib/trade-hooks';
import { newsletterService } from '@/lib/newsletter-service';
import {
  computeTradeLedgerFromGross,
  getCashoutFeeRate,
} from '@/lib/trade-platform-fees';
import { AffiliateService } from '@/lib/affiliate-service';
import { isAffiliateRewardsBlocked, isMerchantAccount } from '@/lib/user-rewards-guard';
import { resolveUserContactEmail } from '@/lib/user-contact-email';
import { safeParseJson } from '@/lib/validation/helpers';
import { skinplaceCreateTradeBodySchema } from '@/lib/validation/schemas/integrations';
import { verifyAndPriceItems } from '@/lib/skinplace-price-verifier';
import { extractSteamTradeOfferId } from '@/lib/steam-trade-offer-id';
import { RateLimiter, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';
import { rateLimitedJson } from '@/lib/rate-limited-response';
import { notifyAdminsNewTrade } from '@/lib/admin-notification-hooks';

interface CreateTradeBody {
  steam_id: string;
  trade_url: string;
  items: Array<{ asset_id: string }>;
  affiliate_promo_code?: string | null;
}

interface SkinplaceBotInfo {
  name: string;
  avatar: string;
  profile_url: string;
  level: string;
  registration_date: string;
  steamid: string;
}

const tradeRateLimiter = new RateLimiter('TRADE_CREATION', RATE_LIMIT_CONFIGS.TRADE_CREATION);

function mapSkinplaceStatusToTradeStatus(skinplaceStatus: string): TradeStatus {
  const statusMap: Record<string, TradeStatus> = {
    'pending':    'CREATED',
    'sent':       'CREATED',
    'created':    'CREATED',
    'active':     'ACCEPTED_BY_BOT',
    'finished':   'IN_TRADE_HOLD',
    'completed':  'AVAILABLE',
    'done':       'AVAILABLE',
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
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateCheck = await tradeRateLimiter.checkLimit(request, session.user.id);
    if (!rateCheck.allowed) {
      return rateLimitedJson(
        { success: false },
        { headers: { 'Retry-After': String(Math.ceil((rateCheck.resetTime - Date.now()) / 1000)) } },
      );
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, skinplaceCreateTradeBodySchema, {
      errorStyle: 'successFalse',
    });
    if (!parsed.ok) {
      return parsed.response;
    }
    const body = parsed.data as unknown as CreateTradeBody;

    const { isSteamIdAllowedForUser } = await import('@/lib/steam-access');

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    if (user.accountFrozen) {
      return NextResponse.json(
        { success: false, error: 'Votre compte est gelé. Contactez le support.' },
        { status: 403 }
      );
    }

    if (!isSteamIdAllowedForUser(body.steam_id, session.user.steamId, user)) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const steamTradeUrlRegex = /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/?\?partner=\d+&token=[a-zA-Z0-9_-]+$/;
    if (!steamTradeUrlRegex.test(body.trade_url)) {
      return NextResponse.json(
        { success: false, error: 'URL de trade Steam invalide' },
        { status: 400 }
      );
    }

    // SECURITE: Vérifier ownership + récupérer les prix réels depuis Skinplace
    const assetIds = body.items.map(i => i.asset_id);
    const verification = await verifyAndPriceItems(body.steam_id, assetIds);

    if (!verification.ok) {
      const status = verification.code === 'ITEMS_NOT_FOUND' ? 400 : 502;
      return NextResponse.json(
        { success: false, error: verification.error },
        { status }
      );
    }

    const verifiedItems = verification.items;

    // Calcul du gross à partir des prix serveur uniquement
    const serverGrossCentimes = Array.from(verifiedItems.values()).reduce(
      (sum, item) => sum + item.price_centimes, 0
    );

    if (serverGrossCentimes <= 0) {
      return NextResponse.json(
        { success: false, error: 'La valeur brute doit être positive' },
        { status: 400 }
      );
    }

    if (serverGrossCentimes < 100) {
      return NextResponse.json(
        { success: false, error: 'La valeur brute totale doit être d\'au moins 1,00 € (100 centimes) pour créer un trade' },
        { status: 400 }
      );
    }

    const cashoutFeeRate = await getCashoutFeeRate();
    const ledger = computeTradeLedgerFromGross(serverGrossCentimes, cashoutFeeRate);
    if (ledger.netCents <= 0) {
      return NextResponse.json(
        { success: false, error: 'La valeur nette après frais plateforme doit être positive' },
        { status: 400 }
      );
    }

    let affiliatePromoCode: string | null = null;
    let affiliateAttributionCode: string | null = null;
    let affiliatePromoBonusCents = 0;
    let affiliateSwitch: { attached: boolean; affiliateName: string } | null = null;
    const rawPromo =
      typeof body.affiliate_promo_code === 'string' ? body.affiliate_promo_code.trim() : '';
    const isMerchant = isMerchantAccount(user);
    if (rawPromo) {
      if (isMerchant) {
        return NextResponse.json(
          {
            success: false,
            error: 'Les comptes merchant ne peuvent pas utiliser de code promotionnel.',
          },
          { status: 400 }
        );
      }
      const promo = await AffiliateService.validateAffiliateSellPromoCode(user.id, rawPromo);
      if (!promo.ok) {
        const err =
          promo.error === 'self'
            ? 'Vous ne pouvez pas utiliser votre propre code affilié.'
            : promo.error === 'merchant'
              ? 'Les comptes merchant ne peuvent pas utiliser de code promotionnel.'
            : 'Code promo invalide ou affilié inactif.';
        return NextResponse.json({ success: false, error: err }, { status: 400 });
      }
      const bindResult = await AffiliateService.bindUserToAffiliateForSellPromo(
        user.id,
        promo.affiliateId
      );
      affiliateSwitch = {
        attached: bindResult.attached,
        affiliateName: bindResult.affiliateName || promo.affiliateName,
      };
      affiliatePromoCode = promo.code;
      affiliateAttributionCode = promo.code;
      if (
        !isAffiliateRewardsBlocked({
          affiliateRewardsBlocked: user.affiliateRewardsBlocked ?? false,
          xpRewardsBlocked: user.xpRewardsBlocked ?? false,
        })
      ) {
        affiliatePromoBonusCents = AffiliateService.computeSellPromoBonusCents(
          serverGrossCentimes
        );
      }
    } else if (user.referredByAffiliateId && !isMerchant) {
      const refAffiliate = await prisma.affiliateStats.findUnique({
        where: { id: user.referredByAffiliateId, isActive: true },
        select: { code: true, userId: true },
      });
      if (refAffiliate && refAffiliate.userId !== user.id) {
        affiliateAttributionCode = refAffiliate.code;
      }
    }

    const vipBonusCents = Math.round(serverGrossCentimes * (user.bonusRatePercent ?? 0) / 100);
    const netCentsWithPromo = ledger.netCents + affiliatePromoBonusCents + vipBonusCents;
    if (netCentsWithPromo <= 0) {
      return NextResponse.json(
        { success: false, error: 'La valeur nette après frais et code promo doit être positive' },
        { status: 400 }
      );
    }

    const privateKey = process.env.SKINPLACE_API_KEY_PRIVATE;
    const publicKey = process.env.SKINPLACE_API_KEY_PUBLIC;

    if (!privateKey || !publicKey) {
      return NextResponse.json(
        { success: false, error: 'Configuration API manquante' },
        { status: 500 }
      );
    }

    // Vérifier les limites de trade quotidiennes
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tradesCountToday = await prisma.trade.count({
      where: {
        userId: user.id,
        createdAt: { gte: today },
      },
    });

    if (tradesCountToday >= 10) {
      return NextResponse.json(
        { success: false, error: 'Limite de trades quotidienne atteinte (10 max)' },
        { status: 429 }
      );
    }

    const signature = generateSkinplaceSignature(body.steam_id, privateKey);

    const tradeUrlMatch = body.trade_url.match(/partner=(\d+)&token=([a-zA-Z0-9_-]+)/);
    if (!tradeUrlMatch) {
      return NextResponse.json(
        { success: false, error: 'URL de trade Steam invalide - impossible d\'extraire le token' },
        { status: 400 }
      );
    }
    const tradeToken = tradeUrlMatch[2];

    const tradeToken2 = crypto.randomUUID().replace(/-/g, '');

    const skinplacePayload = {
      signature,
      public_key: publicKey,
      project: 'csgo',
      steamid: body.steam_id,
      trade_token: tradeToken,
      offers: assetIds,
      ipn_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/skinplace/webhook`,
      order_id: tradeToken2,
      send_offer_sync: 1,
    };

    logger.info('[CREATE-TRADE] Creating Skinplace trade', {
      itemsCount: assetIds.length,
      grossCentimes: serverGrossCentimes,
    });

    const skinplaceResponse = await fetch('https://api.skin.place/api/v3/instant/inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MoonSkin/1.0',
        'Accept': 'application/json',
      },
      body: JSON.stringify(skinplacePayload),
      signal: AbortSignal.timeout(15000),
    });

    if (!skinplaceResponse.ok) {
      const errorData = await skinplaceResponse.json().catch(() => ({}));
      console.error('[CREATE-TRADE] Skinplace error:', skinplaceResponse.status, errorData);
      return NextResponse.json(
        { 
          success: false, 
          error: `Erreur: ${(errorData as { message?: string }).message || 'Erreur lors de la création du trade'}`
        },
        { status: skinplaceResponse.status }
      );
    }

    let skinplaceData: {
      status?: string;
      error?: string;
      message?: string;
      token?: string;
      steamtrade?: {
        tradeofferid?: string;
        status?: string;
        bot?: SkinplaceBotInfo;
      };
    };
    try {
      skinplaceData = await skinplaceResponse.json();
    } catch {
      console.error('[CREATE-TRADE] Skinplace returned non-JSON response');
      return NextResponse.json(
        { success: false, error: 'Réponse invalide du partenaire de vente. Réessayez dans un instant.' },
        { status: 502 }
      );
    }

    if (skinplaceData.status !== 'success') {
      return NextResponse.json(
        { 
          success: false, 
          error: skinplaceData.error || skinplaceData.message || 'Erreur lors de la création du trade' 
        },
        { status: 400 }
      );
    }

    const steamTrade = skinplaceData.steamtrade;
    const tradeOfferId = extractSteamTradeOfferId(skinplaceData);
    const skinplaceToken = skinplaceData.token;
    const skinplaceStatus = steamTrade?.status || skinplaceData.status || 'pending';
    const botInfo: SkinplaceBotInfo | null = steamTrade?.bot || null;
    
    const tradeStatus = mapSkinplaceStatusToTradeStatus(skinplaceStatus);

    const tradeId = `TRADE-${Date.now()}-${crypto.randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase()}`;
    const token = tradeToken2;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const availableAt = new Date();
    if (tradeStatus === 'ACCEPTED_BY_BOT' || tradeStatus === 'IN_TRADE_HOLD') {
      availableAt.setDate(availableAt.getDate() + 7);
    }

    const tradeAcceptedAt = (tradeStatus === 'ACCEPTED_BY_BOT' || tradeStatus === 'IN_TRADE_HOLD' || tradeStatus === 'AVAILABLE') 
      ? new Date() 
      : undefined;

    // Stocker les items avec les données vérifiées depuis Skinplace (jamais le client)
    const itemsData = assetIds.map((assetId) => {
      const verified = verifiedItems.get(assetId)!;
      return {
        name: verified.market_hash_name,
        marketHashName: verified.market_hash_name,
        priceCents: verified.price_centimes,
        iconUrl: verified.icon_url,
        rarity: verified.rarity,
        exterior: verified.exterior || '',
        statTrak: verified.is_stattrak,
      };
    });

    const trade = await prisma.trade.create({
      data: {
        id: tradeId,
        userId: user.id,
        steamId: body.steam_id,
        tradeUrl: body.trade_url,
        status: tradeStatus,
        grossCents: serverGrossCentimes,
        cashoutFees: ledger.cashoutFees,
        networkFees: ledger.networkFees,
        netCents: netCentsWithPromo,
        affiliatePromoCode,
        affiliateAttributionCode,
        affiliatePromoBonusCents,
        vipBonusCents,
        availableAt: tradeStatus !== 'FAILED' ? availableAt : undefined,
        expiresAt,
        tradeAcceptedAt,
        ticketId: token,
        skinplaceToken: skinplaceToken || null,
        steamTradeOfferId: tradeOfferId,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'TRADE_CREATED',
        details: {
          tradeId: trade.id,
          itemsCount: assetIds.length,
          grossValue: serverGrossCentimes,
          netValue: netCentsWithPromo,
          affiliatePromoCode,
          affiliateAttributionCode,
          affiliatePromoBonusCents,
          vipBonusCents,
          initialStatus: tradeStatus,
          skinplaceStatus,
          tradeOfferId,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
      },
    });

    await TradeHooks.onTradeCreated(user.id, trade.id);

    await notifyAdminsNewTrade(trade.id, user.id, serverGrossCentimes);

    const notificationEmail = resolveUserContactEmail({
      contactEmail: user.contactEmail,
      email: user.email,
    });
    if (notificationEmail) {
      try {
        await newsletterService.sendTradeCreatedEmail(
          notificationEmail,
          user.name || notificationEmail,
          {
            tradeId: trade.id,
            itemsCount: assetIds.length,
            grossValue: serverGrossCentimes,
            netValue: netCentsWithPromo,
            availableAt: trade.availableAt?.toISOString() || new Date().toISOString(),
          }
        );
      } catch (emailError) {
        console.error('[CREATE-TRADE] Email send failed:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
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
        bot: botInfo,
        affiliateSwitch,
      },
    });

  } catch (error) {
    console.error('[CREATE-TRADE] Unexpected error:', error);
    
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
