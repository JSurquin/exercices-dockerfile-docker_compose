import crypto from 'crypto';
import { TradeStatus } from '@prisma/client';
import { prisma } from '~/prisma/prisma';
import { TradeHooks } from '@/lib/trade-hooks';
import { computeTradeLedgerFromGross, getCashoutFeeRate } from '@/lib/trade-platform-fees';
import { verifyAndPriceItems } from '@/lib/skinplace-price-verifier';
import { generateSkinplaceSignature } from '@/utils/skinplace-signature';
import { notifyAdminsNewTrade } from '@/lib/admin-notification-hooks';
import { notifyTradeStatusChange } from '@/lib/partner-api/webhook-service';
import { logger } from '@/lib/logger';

function mapSkinplaceStatusToTradeStatus(skinplaceStatus: string): TradeStatus {
  const statusMap: Record<string, TradeStatus> = {
    pending: 'CREATED',
    sent: 'CREATED',
    created: 'CREATED',
    active: 'ACCEPTED_BY_BOT',
    finished: 'IN_TRADE_HOLD',
    completed: 'AVAILABLE',
    done: 'AVAILABLE',
    cancelled: 'CANCELLED',
    declined: 'FAILED',
    rejected: 'FAILED',
    expired: 'FAILED',
    failed: 'FAILED',
    error: 'FAILED',
  };
  return statusMap[skinplaceStatus.toLowerCase()] || 'CREATED';
}

export type CreatePartnerTradeResult =
  | {
      ok: true;
      trade: {
        id: string;
        ticketId: string;
        status: TradeStatus;
        grossCents: number;
        netCents: number;
        cashoutFees: number;
        networkFees: number;
        expiresAt: Date | null;
        availableAt: Date | null;
      };
    }
  | { ok: false; error: string; code: string; status: number };

export async function createPartnerTrade(
  userId: string,
  params: { tradeUrl: string; assetIds: string[] }
): Promise<CreatePartnerTradeResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { ok: false, error: 'Utilisateur non trouvé', code: 'NOT_FOUND', status: 404 };
  }
  if (user.accountFrozen) {
    return { ok: false, error: 'Compte gelé', code: 'ACCOUNT_FROZEN', status: 403 };
  }
  if (!user.steamId) {
    return { ok: false, error: 'Steam ID non lié au compte', code: 'VALIDATION_ERROR', status: 400 };
  }
  if (!user.tradeLink) {
    return { ok: false, error: 'Trade link non configuré sur le compte', code: 'VALIDATION_ERROR', status: 400 };
  }

  const steamId = user.steamId;
  const verification = await verifyAndPriceItems(steamId, params.assetIds);
  if (!verification.ok) {
    const status = verification.code === 'ITEMS_NOT_FOUND' ? 400 : 502;
    return { ok: false, error: verification.error, code: verification.code, status };
  }

  const serverGrossCentimes = Array.from(verification.items.values()).reduce(
    (sum, item) => sum + item.price_centimes,
    0
  );

  if (serverGrossCentimes < 100) {
    return {
      ok: false,
      error: 'La valeur brute doit être d\'au moins 1,00 € (100 centimes)',
      code: 'VALIDATION_ERROR',
      status: 400,
    };
  }

  const cashoutFeeRate = await getCashoutFeeRate();
  const ledger = computeTradeLedgerFromGross(serverGrossCentimes, cashoutFeeRate);
  const vipBonusCents = Math.round(serverGrossCentimes * (user.bonusRatePercent ?? 0) / 100);
  const netCentsWithPromo = ledger.netCents + vipBonusCents;

  if (netCentsWithPromo <= 0) {
    return {
      ok: false,
      error: 'La valeur nette après frais doit être positive',
      code: 'VALIDATION_ERROR',
      status: 400,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tradesCountToday = await prisma.trade.count({
    where: { userId: user.id, createdAt: { gte: today } },
  });
  if (tradesCountToday >= 10) {
    return {
      ok: false,
      error: 'Limite de trades quotidienne atteinte (10 max)',
      code: 'RATE_LIMITED',
      status: 429,
    };
  }

  const privateKey = process.env.SKINPLACE_API_KEY_PRIVATE;
  const publicKey = process.env.SKINPLACE_API_KEY_PUBLIC;
  if (!privateKey || !publicKey) {
    return { ok: false, error: 'Configuration API manquante', code: 'CONFIG_ERROR', status: 500 };
  }

  const tradeUrlMatch = params.tradeUrl.match(/partner=(\d+)&token=([a-zA-Z0-9_-]+)/);
  if (!tradeUrlMatch) {
    return { ok: false, error: 'URL de trade invalide', code: 'VALIDATION_ERROR', status: 400 };
  }
  const tradeToken = tradeUrlMatch[2];
  const signature = generateSkinplaceSignature(steamId, privateKey);
  const orderId = crypto.randomUUID().replace(/-/g, '');

  const skinplacePayload = {
    signature,
    public_key: publicKey,
    project: 'csgo',
    steamid: steamId,
    trade_token: tradeToken,
    offers: params.assetIds,
    ipn_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/skinplace/webhook`,
    order_id: orderId,
    send_offer_sync: 1,
  };

  const skinplaceResponse = await fetch('https://api.skin.place/api/v3/instant/inventory', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'MoonSkin/1.0',
      Accept: 'application/json',
    },
    body: JSON.stringify(skinplacePayload),
    signal: AbortSignal.timeout(15000),
  });

  if (!skinplaceResponse.ok) {
    const errorData = await skinplaceResponse.json().catch(() => ({}));
    return {
      ok: false,
      error: (errorData as { message?: string }).message || 'Erreur Skinplace',
      code: 'API_ERROR',
      status: skinplaceResponse.status >= 500 ? 502 : 400,
    };
  }

  const skinplaceData = await skinplaceResponse.json();
  if (skinplaceData.status !== 'success') {
    return {
      ok: false,
      error: skinplaceData.error || skinplaceData.message || 'Erreur création trade',
      code: 'API_ERROR',
      status: 400,
    };
  }

  const steamTrade = skinplaceData.steamtrade;
  const skinplaceStatus = steamTrade?.status || skinplaceData.status || 'pending';
  const tradeStatus = mapSkinplaceStatusToTradeStatus(skinplaceStatus);

  const tradeId = `TRADE-${Date.now()}-${crypto.randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase()}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const availableAt = new Date();
  if (tradeStatus === 'ACCEPTED_BY_BOT' || tradeStatus === 'IN_TRADE_HOLD') {
    availableAt.setDate(availableAt.getDate() + 7);
  }

  const tradeAcceptedAt =
    tradeStatus === 'ACCEPTED_BY_BOT' || tradeStatus === 'IN_TRADE_HOLD' || tradeStatus === 'AVAILABLE'
      ? new Date()
      : undefined;

  const itemsData = params.assetIds.map((assetId) => {
    const verified = verification.items.get(assetId)!;
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
      steamId,
      tradeUrl: params.tradeUrl,
      status: tradeStatus,
      grossCents: serverGrossCentimes,
      cashoutFees: ledger.cashoutFees,
      networkFees: ledger.networkFees,
      netCents: netCentsWithPromo,
      vipBonusCents,
      availableAt: tradeStatus !== 'FAILED' ? availableAt : undefined,
      expiresAt,
      tradeAcceptedAt,
      ticketId: orderId,
      skinplaceToken: skinplaceData.token || null,
      items: { create: itemsData },
    },
  });

  await TradeHooks.onTradeCreated(user.id, trade.id);
  await notifyAdminsNewTrade(trade.id, user.id, serverGrossCentimes);

  await notifyTradeStatusChange(
    user.id,
    {
      id: trade.id,
      status: trade.status,
      grossCents: trade.grossCents,
      cashoutFees: trade.cashoutFees,
      networkFees: trade.networkFees,
      netCents: trade.netCents,
      ticketId: trade.ticketId,
    },
    'trade.created'
  );

  logger.info('[PartnerTrade] Trade created', { tradeId: trade.id, userId });

  return {
    ok: true,
    trade: {
      id: trade.id,
      ticketId: trade.ticketId,
      status: trade.status,
      grossCents: trade.grossCents,
      netCents: trade.netCents,
      cashoutFees: trade.cashoutFees,
      networkFees: trade.networkFees,
      expiresAt: trade.expiresAt,
      availableAt: trade.availableAt,
    },
  };
}

export async function estimatePartnerItems(
  userId: string,
  assetIds: string[]
): Promise<
  | {
      ok: true;
      gross_centimes: number;
      frais: { cashout: number; réseau: number };
      net_centimes: number;
      items: Array<{ asset_id: string; market_hash_name: string; prix_centimes: number }>;
    }
  | { ok: false; error: string; status: number }
> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { steamId: true } });
  if (!user?.steamId) {
    return { ok: false, error: 'Steam ID non lié', status: 400 };
  }

  const verification = await verifyAndPriceItems(user.steamId, assetIds);
  if (!verification.ok) {
    return { ok: false, error: verification.error, status: verification.code === 'ITEMS_NOT_FOUND' ? 400 : 502 };
  }

  const gross = Array.from(verification.items.values()).reduce((s, i) => s + i.price_centimes, 0);
  const cashoutFeeRate = await getCashoutFeeRate();
  const ledger = computeTradeLedgerFromGross(gross, cashoutFeeRate);

  return {
    ok: true,
    gross_centimes: gross,
    frais: { cashout: ledger.cashoutFees, réseau: ledger.networkFees },
    net_centimes: ledger.netCents,
    items: assetIds.map((id) => {
      const v = verification.items.get(id)!;
      return { asset_id: id, market_hash_name: v.market_hash_name, prix_centimes: v.price_centimes };
    }),
  };
}
