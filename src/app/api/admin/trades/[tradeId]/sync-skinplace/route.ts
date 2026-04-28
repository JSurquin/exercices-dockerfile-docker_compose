import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { prisma } from '~/prisma/prisma';
import { TradeStatus } from '@prisma/client';
import { generateSkinplaceSignature } from '@/utils/skinplace-signature';
import { TradeHooks } from '@/lib/trade-hooks';

// Statuts actifs pour lesquels le polling a du sens
const SYNCABLE_STATUSES: TradeStatus[] = ['CREATED', 'ACCEPTED_BY_BOT', 'IN_TRADE_HOLD', 'AVAILABLE'];

interface SkinplaceStatusResponse {
  status: string;
  token?: string;
  order_id?: string;
  protection_status?: string;
  steamtrade?: {
    tradeofferid: string;
    status: string;
    price: string;
    items_to_receive: number;
  };
}

function mapSkinplaceStatusToTradeStatus(skinplaceStatus: string): TradeStatus {
  const statusMap: Record<string, TradeStatus> = {
    'pending': 'CREATED',
    'sent': 'CREATED',
    'created': 'CREATED',
    'accepted': 'ACCEPTED_BY_BOT',
    'active': 'IN_TRADE_HOLD',
    'trade_hold': 'IN_TRADE_HOLD',
    'completed': 'AVAILABLE',
    'done': 'AVAILABLE',
    'declined': 'FAILED',
    'rejected': 'FAILED',
    'expired': 'FAILED',
    'cancelled': 'FAILED',
    'failed': 'FAILED',
  };
  return statusMap[skinplaceStatus.toLowerCase()] || 'CREATED';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { tradeId } = await params;

    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: { user: true },
    });

    if (!trade) {
      return NextResponse.json({ error: 'Trade introuvable' }, { status: 404 });
    }

    const adminGate = await requireAdminSessionWithDbCheck(request);
    const isAdmin = !!adminGate;
    if (!isAdmin && trade.userId !== session.user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    if (!SYNCABLE_STATUSES.includes(trade.status)) {
      return NextResponse.json(
        { error: `Sync impossible sur un trade en statut ${trade.status}` },
        { status: 400 }
      );
    }

    if (!trade.ticketId) {
      return NextResponse.json(
        { error: 'Ce trade n\'a pas de ticketId Skinplace enregistré' },
        { status: 400 }
      );
    }

    const privateKey = process.env.SKINPLACE_API_KEY_PRIVATE;
    const publicKey = process.env.SKINPLACE_API_KEY_PUBLIC;

    if (!privateKey || !publicKey) {
      return NextResponse.json({ error: 'Configuration API Skinplace manquante' }, { status: 500 });
    }

    const signature = generateSkinplaceSignature(trade.steamId, privateKey);

    // GET /api/v3/instant/payment/trade/{token}
    // Le "token" est le ticketId que nous avons passé comme order_id lors de la création
    const skinplaceUrl = new URL(`https://api.skin.place/api/v3/instant/payment/trade/${trade.ticketId}`);
    skinplaceUrl.searchParams.set('signature', signature);
    skinplaceUrl.searchParams.set('public_key', publicKey);
    skinplaceUrl.searchParams.set('project', 'csgo');
    skinplaceUrl.searchParams.set('steamid', trade.steamId);

    const skinplaceRes = await fetch(skinplaceUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MoonSkin/1.0',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!skinplaceRes.ok) {
      const errorText = await skinplaceRes.text().catch(() => 'unknown');
      console.error(`[Skinplace Sync] API error ${skinplaceRes.status}:`, errorText);
      return NextResponse.json(
        { error: `Erreur API Skinplace: ${skinplaceRes.status}` },
        { status: 502 }
      );
    }

    const skinplaceData: SkinplaceStatusResponse = await skinplaceRes.json();
    console.log('[Skinplace Sync] Response:', JSON.stringify(skinplaceData, null, 2));

    const oldStatus = trade.status;
    const skinplaceStatus = skinplaceData.steamtrade?.status || skinplaceData.status;
    const newStatus = mapSkinplaceStatusToTradeStatus(skinplaceStatus);

    const statusOrder: TradeStatus[] = [
      'CREATED', 'ACCEPTED_BY_BOT', 'IN_TRADE_HOLD', 'AVAILABLE', 'PAYOUT_PENDING', 'PAID',
    ];
    const oldIdx = statusOrder.indexOf(oldStatus);
    const newIdx = statusOrder.indexOf(newStatus);

    const shouldUpdate = newStatus === 'FAILED' || newIdx > oldIdx;

    if (!shouldUpdate) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'ADMIN_TRADE_SYNC_NO_CHANGE',
          details: {
            tradeId,
            currentStatus: oldStatus,
            skinplaceStatus,
            triggeredBy: session.user.id,
          },
        },
      });

      return NextResponse.json({
        synced: false,
        message: 'Aucun changement de statut détecté',
        currentStatus: oldStatus,
        skinplaceStatus,
      });
    }

    // Mettre à jour le trade
    let availableAt = trade.availableAt;
    if (newStatus === 'ACCEPTED_BY_BOT' && !availableAt) {
      availableAt = new Date();
      availableAt.setDate(availableAt.getDate() + 8);
    } else if (newStatus === 'AVAILABLE') {
      availableAt = new Date();
    }

    await prisma.trade.update({
      where: { id: tradeId },
      data: {
        status: newStatus,
        availableAt,
        tradeAcceptedAt: newStatus === 'ACCEPTED_BY_BOT' ? new Date() : trade.tradeAcceptedAt,
        updatedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMIN_TRADE_SYNC_UPDATED',
        details: {
          tradeId,
          oldStatus,
          newStatus,
          skinplaceStatus,
          protectionStatus: skinplaceData.protection_status,
          triggeredBy: session.user.id,
          source: 'admin_manual_sync',
        },
      },
    });

    // Appliquer les mêmes hooks que le webhook IPN #1
    if (newStatus === 'ACCEPTED_BY_BOT') {
      await TradeHooks.onTradeAccepted(trade.userId, tradeId);
    } else if (newStatus === 'AVAILABLE') {
      await TradeHooks.onTradeAvailable(tradeId);
    }

    return NextResponse.json({
      synced: true,
      message: `Statut mis à jour: ${oldStatus} → ${newStatus}`,
      oldStatus,
      newStatus,
      skinplaceStatus,
      protectionStatus: skinplaceData.protection_status,
    });
  } catch (error) {
    console.error('[Skinplace Sync] Error:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Timeout lors de l\'appel Skinplace' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
