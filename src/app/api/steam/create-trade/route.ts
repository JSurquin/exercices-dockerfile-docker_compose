import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { newsletterService } from '@/lib/newsletter-service';
import { TradeHooks } from '@/lib/trade-hooks';
import {
  computeTradeLedgerFromGross,
  getCashoutFeeRate,
} from '@/lib/trade-platform-fees';
import { safeParseJson } from '@/lib/validation/helpers';
import { steamCreateTradeBodySchema } from '@/lib/validation/schemas/integrations';
import { verifyAndPriceItems } from '@/lib/skinplace-price-verifier';
import { RateLimiter, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';
import { rateLimitedJson } from '@/lib/rate-limited-response';
import { resolveUserContactEmail } from '@/lib/user-contact-email';

interface CreateTradeBody {
  steam_id: string;
  trade_url: string;
  items: Array<{ asset_id: string }>;
  affiliate_promo_code?: string | null;
}

const tradeRateLimiter = new RateLimiter('STEAM_TRADE_CREATION', RATE_LIMIT_CONFIGS.TRADE_CREATION);

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentification requise' },
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
    const parsed = safeParseJson(raw, steamCreateTradeBodySchema, {
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
        { success: false, error: 'Vous ne pouvez vendre que vos propres items' },
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

    const tradeId = `TRADE-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const availableAt = new Date();
    availableAt.setDate(availableAt.getDate() + 7);

    const vipBonusCents = Math.round(serverGrossCentimes * (user.bonusRatePercent ?? 0) / 100);
    const netCentsWithBonus = ledger.netCents + vipBonusCents;

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
        status: 'CREATED',
        grossCents: serverGrossCentimes,
        cashoutFees: ledger.cashoutFees,
        networkFees: ledger.networkFees,
        netCents: netCentsWithBonus,
        vipBonusCents,
        availableAt,
        ticketId: token,
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
          netValue: netCentsWithBonus,
          vipBonusCents,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
      },
    });

    await TradeHooks.onTradeCreated(user.id, trade.id);

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
            netValue: netCentsWithBonus,
            availableAt: trade.availableAt?.toISOString() || new Date().toISOString(),
          }
        );
      } catch (emailError) {
        console.error('[STEAM-TRADE] Email send failed:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        trade_id: trade.id,
        token: trade.ticketId,
        status: trade.status,
        gross_value_centimes: trade.grossCents,
        net_value_centimes: trade.netCents,
        fees: {
          cashout_fee: trade.cashoutFees,
          network_fee: trade.networkFees,
        },
        expires_at: trade.expiresAt?.toISOString() || null,
        available_at: trade.availableAt?.toISOString() || null,
        items_count: trade.items?.length || 0,
      },
    });

  } catch (error) {
    console.error('[STEAM-TRADE] Unexpected error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
