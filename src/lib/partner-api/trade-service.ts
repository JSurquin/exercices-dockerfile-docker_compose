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
import { getPartnerOperatingSteamId, validatePartnerTradeUrl } from '@/lib/partner-api/trade-url-validation';
import { toPartnerFacingProviderError } from '@/lib/partner-api/response';
import { assertPartnerAccountReady } from '@/lib/partner-api/account-guards';
import { heapMb, partnerTrace } from '@/lib/partner-api/trace';

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
        vipBonusCents: number;
      };
    }
  | { ok: false; error: string; code: string; status: number };

export async function createPartnerTrade(
  userId: string,
  params: { tradeUrl: string; assetIds: string[] }
): Promise<CreatePartnerTradeResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { ok: false, error: 'User not found', code: 'NOT_FOUND', status: 404 };
  }
  if (user.accountFrozen) {
    return { ok: false, error: 'Account frozen', code: 'ACCOUNT_FROZEN', status: 403 };
  }
  const accountReady = assertPartnerAccountReady(user, { requireTradeLink: true });
  if (!accountReady.ok) {
    return {
      ok: false,
      error: accountReady.message,
      code: accountReady.code,
      status: accountReady.status,
    };
  }

  const accountTradeLink = user.tradeLink!;

  const tradeUrlCheck = validatePartnerTradeUrl(params.tradeUrl, user.steamId ?? '', accountTradeLink);
  if (!tradeUrlCheck.ok) {
    return {
      ok: false,
      error: tradeUrlCheck.error,
      code: 'VALIDATION_ERROR',
      status: 400,
    };
  }

  const steamId = tradeUrlCheck.steamId;

  const verification = await verifyAndPriceItems(steamId, params.assetIds);
  if (!verification.ok) {
    partnerTrace('trades.skinplace.verify.fail', { code: verification.code });
    const status = verification.code === 'ITEMS_NOT_FOUND' ? 400 : 502;
    return {
      ok: false,
      error: toPartnerFacingProviderError(verification.code),
      code: verification.code,
      status,
    };
  }

  const serverGrossCentimes = Array.from(verification.items.values()).reduce(
    (sum, item) => sum + item.price_centimes,
    0
  );

  if (serverGrossCentimes < 100) {
    return {
      ok: false,
      error: 'Gross value must be at least 1.00 EUR (100 cents)',
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
      error: 'Net value after fees must be positive',
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
      error: 'Daily trade limit reached (10 max)',
      code: 'RATE_LIMITED',
      status: 429,
    };
  }

  const privateKey = process.env.SKINPLACE_API_KEY_PRIVATE;
  const publicKey = process.env.SKINPLACE_API_KEY_PUBLIC;
  if (!privateKey || !publicKey) {
    return { ok: false, error: 'Trade provider is not configured', code: 'CONFIG_ERROR', status: 500 };
  }

  const tradeUrlMatch = params.tradeUrl.match(/partner=(\d+)&token=([a-zA-Z0-9_-]+)/);
  if (!tradeUrlMatch) {
    return { ok: false, error: 'Invalid trade URL', code: 'VALIDATION_ERROR', status: 400 };
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

  const started = Date.now();
  partnerTrace('trades.skinplace.post.start', { steamId, offerCount: params.assetIds.length, heapMb: heapMb() });
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

  partnerTrace('trades.skinplace.post.headers', {
    status: skinplaceResponse.status,
    elapsedMs: Date.now() - started,
    heapMb: heapMb(),
  });

  if (!skinplaceResponse.ok) {
    const errorData = await skinplaceResponse.json().catch(() => ({}));
    logger.warn('[PartnerTrade] Skinplace HTTP error', {
      status: skinplaceResponse.status,
      error: errorData,
    });
    return {
      ok: false,
      error: 'Trade provider rejected the request',
      code: 'API_ERROR',
      status: skinplaceResponse.status >= 500 ? 502 : 400,
    };
  }

  const skinplaceData = await skinplaceResponse.json();
  if (skinplaceData.status !== 'success') {
    logger.warn('[PartnerTrade] Skinplace business error', {
      error: skinplaceData.error || skinplaceData.message,
    });
    return {
      ok: false,
      error: 'Trade provider rejected the request',
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

  let trade;
  try {
    trade = await prisma.trade.create({
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
  } catch (err) {
    logger.error('[PartnerTrade] Skinplace offer created but DB persist failed', {
      orderId,
      userId,
      err,
    });
    return {
      ok: false,
      error: `Trade could not be saved. Support reference: ${orderId}`,
      code: 'INTERNAL_ERROR',
      status: 500,
    };
  }

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
      vipBonusCents,
    },
  };
}

export async function estimatePartnerItems(
  userId: string,
  assetIds: string[]
): Promise<
  | {
      ok: true;
      data: {
        gross_cents: number;
        fees: { cashout: number; network: number };
        net_cents: number;
        vip_bonus_cents: number;
        items: Array<{ asset_id: string; market_hash_name: string; price_cents: number }>;
      };
    }
  | { ok: false; error: string; code: string; status: number }
> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { steamId: true, tradeLink: true, bonusRatePercent: true },
  });
  const steamId = user ? getPartnerOperatingSteamId(user) : null;
  if (!user || !steamId) {
    return { ok: false, error: 'Steam ID is not linked to this account', code: 'VALIDATION_ERROR', status: 400 };
  }

  partnerTrace('estimate.verify.start', { steamId, assetCount: assetIds.length });
  const verification = await verifyAndPriceItems(steamId, assetIds);
  if (!verification.ok) {
    return {
      ok: false,
      error: toPartnerFacingProviderError(verification.code),
      code: verification.code,
      status: verification.code === 'ITEMS_NOT_FOUND' ? 400 : 502,
    };
  }

  const gross = Array.from(verification.items.values()).reduce((s, i) => s + i.price_centimes, 0);
  const cashoutFeeRate = await getCashoutFeeRate();
  const ledger = computeTradeLedgerFromGross(gross, cashoutFeeRate);
  const vipBonusCents = Math.round(gross * (user.bonusRatePercent ?? 0) / 100);

  return {
    ok: true,
    data: {
      gross_cents: gross,
      fees: { cashout: ledger.cashoutFees, network: ledger.networkFees },
      net_cents: ledger.netCents + vipBonusCents,
      vip_bonus_cents: vipBonusCents,
      items: assetIds.map((id) => {
        const v = verification.items.get(id)!;
        return { asset_id: id, market_hash_name: v.market_hash_name, price_cents: v.price_centimes };
      }),
    },
  };
}
