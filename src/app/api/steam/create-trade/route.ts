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

interface CreateTradeRequest {
  steam_id: string;
  trade_url: string;
  items: Array<{
    asset_id: string;
    icon_url: string;
    rarity: string;
    class_id: string;
    instance_id: string;
    market_hash_name: string;
    estimated_price: number; // En centimes
  }>;
  gross_value: number; // En centimes
  fees: {
    cashout_fee: number;
    network_fee: number;
    total_fees: number;
  };
  net_value: number; // En centimes
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, steamCreateTradeBodySchema, {
      errorStyle: 'successFalse',
    });
    if (!parsed.ok) {
      return parsed.response;
    }
    const body: CreateTradeRequest = parsed.data;

    // Vérifier que l'utilisateur vend ses propres items
    if (body.steam_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Vous ne pouvez vendre que vos propres items' },
        { status: 403 }
      );
    }

    // Validation de l'URL de trade
    // Accepte avec ou sans / après "new" (Steam peut renvoyer les deux formats)
    const steamTradeUrlRegex = /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/?\?partner=\d+&token=[a-zA-Z0-9_-]+$/;
    if (!steamTradeUrlRegex.test(body.trade_url)) {
      return NextResponse.json(
        { success: false, error: 'URL de trade Steam invalide' },
        { status: 400 }
      );
    }

    if (body.gross_value <= 0) {
      return NextResponse.json(
        { success: false, error: 'La valeur brute doit être positive' },
        { status: 400 }
      );
    }

    const cashoutFeeRate = await getCashoutFeeRate();
    const ledger = computeTradeLedgerFromGross(body.gross_value, cashoutFeeRate);
    if (ledger.netCents <= 0) {
      return NextResponse.json(
        { success: false, error: 'La valeur nette après frais plateforme doit être positive' },
        { status: 400 }
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
    // if (tradesCountToday >= 5) {
    //   return NextResponse.json(
    //     { success: false, error: 'Limite de trades quotidienne atteinte (5 max)' },
    //     { status: 429 }
    //   );
    // }

    // Générer un ID unique pour le trade
    const tradeId = `TRADE-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Date d'expiration (7 jours selon les règles Steam)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Date de disponibilité (7 jours de trade hold)
    const availableAt = new Date();
    availableAt.setDate(availableAt.getDate() + 7);

    const vipBonusCents = Math.round(body.gross_value * (user.bonusRatePercent ?? 0) / 100);
    const netCentsWithBonus = ledger.netCents + vipBonusCents;

    // Créer le trade en base de données
    const trade = await prisma.trade.create({
      data: {
        id: tradeId,
        userId: user.id,
        steamId: body.steam_id,
        tradeUrl: body.trade_url,
        status: 'CREATED',
        grossCents: body.gross_value,
        cashoutFees: ledger.cashoutFees,
        networkFees: ledger.networkFees,
        netCents: netCentsWithBonus,
        vipBonusCents,
        availableAt: availableAt,
        ticketId: token,
        items: {
          create: body.items.map((item, index) => ({
            assetId: item.asset_id,
            classId: item.class_id,
            instanceId: item.instance_id,
            marketHashName: item.market_hash_name,
            name: item.market_hash_name,
            priceCents: item.estimated_price,
            iconUrl: item.icon_url,
            rarity: item.rarity,
            estimatedPriceCentimes: item.estimated_price,
            position: index,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // TODO: Ici, intégrer avec l'API Skinplace pour créer le trade réel
    // Pour l'instant, on simule la création du trade
    
    // Journaliser l'action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'TRADE_CREATED',
        details: {
          tradeId: trade.id,
          itemsCount: body.items.length,
          grossValue: body.gross_value,
          netValue: netCentsWithBonus,
          vipBonusCents,
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
            grossValue: body.gross_value,
            netValue: ledger.netCents,
            availableAt: trade.availableAt?.toISOString() || new Date().toISOString(),
          }
        );
        console.log(`✅ Email de confirmation de trade envoyé à ${notificationEmail}`);
      } catch (emailError) {
        console.error('❌ Erreur envoi email trade:', emailError);
        // Ne pas faire échouer la création du trade si l'email échoue
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        trade_id: trade.id,
        token: trade.ticketId,
        status: trade.status,
        gross_value: trade.grossCents,
        net_value: trade.netCents,
        fees: {
          cashout_fee: trade.cashoutFees,
          network_fee: trade.networkFees,
        },
        expires_at: trade.expiresAt?.toISOString() || null,
        available_at: trade.availableAt?.toISOString() || null,
        items_count: trade.items?.length || 0 || null,
      },
    });

  } catch (error) {
    console.error('Erreur lors de la création du trade:', error);
    
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
