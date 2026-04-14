import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { TradeStatus } from '@prisma/client';
import { TradeHooks } from '@/lib/trade-hooks';

// =============================================================================
// Skinplace IPN (webhook)
// Doc : https://skinplace.stoplight.io/docs/skinplace/9bbegvp9w1nxu-ipn-signature
//
// FORMAT : GET request avec paramètres dans la query string
// RÉPONSE ATTENDUE : HTTP 200 avec body texte "ok"
//
// SIGNATURE : sha256(token + secret_key)
//   où token = champ "token" de la query string (token de transaction Skinplace)
//
// Deux types d'IPN :
//   - IPN #1 (type=payment)       : changement de statut du paiement (status=complete/cancelled/active)
//   - IPN #2 (protection_status)  : levée du hold 8 jours après (unconfirmed/confirmed/rollback)
// =============================================================================

/**
 * Statuts du paiement (champ "status" de l'IPN) :
 *   complete  → trade accepté, fonds EN HOLD chez Skinplace (~8 jours) — PAS de crédit balance
 *   active    → trade en cours / hold Steam actif
 *   cancelled → trade annulé
 *
 * Statuts du steamtrade (champ "steamtrade.status" de l'API) :
 *   active / pending / cancelled / finished
 *
 * protection_status :
 *   unconfirmed → fonds toujours en hold (IPN #1 initial) — PAS de crédit balance
 *   confirmed   → fonds définitivement libérés (IPN #2 après ~8 jours) → CRÉDIT BALANCE ici
 *   rollback    → trade rollback (remboursement) → trade FAILED, pas de crédit
 *
 * Sécurité anti-fraude : on ne crédite JAMAIS à l'IPN #1.
 * Un utilisateur malveillant pourrait sinon : accepter → payout → rollback Steam.
 */

function mapSkinplaceStatusToTradeStatus(status: string): TradeStatus {
  const statusMap: Record<string, TradeStatus> = {
    // IPN payment.status (doc Skinplace)
    // 'active'   = offre Steam envoyée, en attente d'acceptation utilisateur
    // 'complete' = utilisateur a accepté, fonds en hold 8 jours chez Skinplace
    'active':    'ACCEPTED_BY_BOT',
    'complete':  'IN_TRADE_HOLD',
    // steamtrade status (sync polling)
    'pending':   'CREATED',
    'sent':      'CREATED',
    'finished':  'IN_TRADE_HOLD',
    // Annulé
    'cancelled': 'CANCELLED',
    // Échecs techniques
    'declined':  'FAILED',
    'rejected':  'FAILED',
    'expired':   'FAILED',
    'failed':    'FAILED',
  };
  return statusMap[status.toLowerCase()] ?? 'CREATED';
}

/**
 * Vérifie la signature IPN Skinplace.
 * sha256(token + secret_key) doit correspondre au champ "signature" reçu.
 */
function verifySkinplaceSignature(token: string, receivedSignature: string, secretKey: string): boolean {
  const expected = crypto.createHash('sha256').update(token + secretKey).digest('hex');
  try {
    if (expected.length !== receivedSignature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(receivedSignature));
  } catch {
    return false;
  }
}

// =============================================================================
// GET — Skinplace envoie les IPN via GET avec params dans la query string
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const token            = searchParams.get('token') ?? '';
    const orderId          = searchParams.get('order_id') ?? '';
    const status           = searchParams.get('status') ?? '';
    const type             = searchParams.get('type') ?? '';
    const protectionStatus = searchParams.get('protection_status');
    const receivedSignature = searchParams.get('signature') ?? '';
    const tradeOfferId     = searchParams.get('trade_offer_id') ?? searchParams.get('tradeoffer_id') ?? '';
    const amount           = searchParams.get('amount') ?? '';
    const transactionId    = searchParams.get('transaction_id') ?? '';

    console.log('[WEBHOOK] ========== IPN Skinplace reçu ==========');
    console.log('[WEBHOOK] type=' + type + ' status=' + status + ' token=' + token);
    console.log('[WEBHOOK] orderId=' + orderId + ' protectionStatus=' + protectionStatus);
    console.log('[WEBHOOK] tradeOfferId=' + tradeOfferId + ' amount=' + amount + ' transactionId=' + transactionId);
    console.log('[WEBHOOK] URL complète:', request.url);

    // Vérification de la signature IPN officielle
    // secret_key IPN = SKINPLACE_API_KEY_PRIVATE (confirmé dashboard skin.place)
    const secretKey = process.env.SKINPLACE_SECRET_KEY ?? process.env.SKINPLACE_API_KEY_PRIVATE ?? '';
    if (secretKey && receivedSignature) {
      if (!verifySkinplaceSignature(token, receivedSignature, secretKey)) {
        console.error('❌ IPN Skinplace: signature invalide');
        return new Response('wrong signature', { status: 401 });
      }
    } else if (!secretKey) {
      console.warn('⚠️  SKINPLACE_API_KEY_PRIVATE non configurée — vérification signature IPN désactivée');
    }

    if (!token && !orderId) {
      return new Response('missing token', { status: 400 });
    }

    // Chercher le trade : priorité à order_id (notre ticketId), fallback sur token Skinplace
    let trade = await prisma.trade.findFirst({
      where: { ticketId: orderId || token },
      include: { user: true, items: true },
    });

    if (!trade && orderId) {
      // Dernier fallback : le token Skinplace stocké dans ticketId
      trade = await prisma.trade.findFirst({
        where: { ticketId: token },
        include: { user: true, items: true },
      });
    }

    if (!trade) {
      console.error('[WEBHOOK] Trade introuvable — order_id="' + orderId + '" token="' + token + '"');
      console.error('[WEBHOOK] Cherché d\'abord avec ticketId=orderId, puis ticketId=token');
      return new Response('ok', { status: 200 });
    }

    console.log('[WEBHOOK] Trade trouvé: id="' + trade.id + '" status actuel="' + trade.status + '" ticketId="' + trade.ticketId + '"');
    const oldStatus = trade.status;

    // =========================================================================
    // IPN #2 — protection_status (~8 jours après l'échange)
    // Valeurs : 'unconfirmed' (en hold), 'confirmed' (libéré), 'rollback'
    //
    // IMPORTANT : Skinplace peut envoyer protection_status=unconfirmed ET
    // status=cancelled dans le même IPN (ex. annulation côté utilisateur).
    // Dans ce cas, l'annulation est prioritaire : on ne doit pas ignorer le
    // status=cancelled sous prétexte que protectionStatus est présent.
    // On n'entre dans le bloc IPN #2 que si le statut n'est pas une annulation.
    // =========================================================================
    if (protectionStatus !== null && status !== 'cancelled') {
      console.log(`🔒 IPN #2 protection_status pour trade ${trade.id}: ${protectionStatus}`);

      await prisma.auditLog.create({
        data: {
          userId: trade.userId,
          action: 'SKINPLACE_PROTECTION_STATUS',
          details: {
            tradeId: trade.id,
            protectionStatus,
            currentTradeStatus: trade.status,
            tradeOfferId,
            transactionId,
            source: 'ipn2',
          },
          ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'skinplace',
        },
      });

      if (protectionStatus === 'confirmed') {
        console.log(`✅ Fonds Skinplace définitivement libérés pour trade ${trade.id} — crédit balance`);
        // On passe le trade en AVAILABLE et on crédite la balance.
        // onTradeAvailable gère l'idempotence : pas de double crédit si le webhook est rejoué.
        if (trade.status !== 'PAID' && trade.status !== 'FAILED') {
          await prisma.trade.update({
            where: { id: trade.id },
            data: { status: 'AVAILABLE', availableAt: new Date() },
          });
          await TradeHooks.onTradeAvailable(trade.id);
        }
      } else if (protectionStatus === 'rollback') {
        console.error(`⚠️  Rollback Skinplace pour trade ${trade.id} — annulation du pending balance`);
        await prisma.trade.update({
          where: { id: trade.id },
          data: { status: 'FAILED' },
        });
        await TradeHooks.onTradeRolledBack(trade.userId, trade.id);
      }

      return new Response('ok', { status: 200 });
    }

    // =========================================================================
    // IPN #1 — Changement de statut du paiement
    // status : 'complete' | 'active' | 'cancelled'
    // =========================================================================
    if (!status) {
      console.warn('IPN Skinplace sans champ status, ignoré');
      return new Response('ok', { status: 200 });
    }

    const newStatus = mapSkinplaceStatusToTradeStatus(status);
    console.log('[WEBHOOK] IPN #1 mappage: skinplace.status="' + status + '" -> TradeStatus="' + newStatus + '"');
    console.log('[WEBHOOK] IPN #1 trade ' + trade.id + ': ' + oldStatus + ' -> ' + newStatus);

    const statusOrder: TradeStatus[] = [
      'CREATED', 'ACCEPTED_BY_BOT', 'IN_TRADE_HOLD', 'AVAILABLE', 'PAYOUT_PENDING', 'PAID',
    ];
    const oldIdx = statusOrder.indexOf(oldStatus);
    const newIdx = statusOrder.indexOf(newStatus);

    const TERMINAL_STATUSES: TradeStatus[] = ['FAILED', 'CANCELLED', 'PAID'];
    // Ne pas réécrire un état terminal déjà atteint
    if (TERMINAL_STATUSES.includes(oldStatus)) {
      console.log(`ℹ️  Trade ${trade.id} déjà en état terminal ${oldStatus}, IPN ignoré`);
      return new Response('ok', { status: 200 });
    }

    // FAILED et CANCELLED sont des états terminaux qui peuvent arriver depuis n'importe quel état
    if (newStatus === 'FAILED' || newStatus === 'CANCELLED' || newIdx > oldIdx) {
      let availableAt = trade.availableAt;
      if (newStatus === 'ACCEPTED_BY_BOT' && !availableAt) {
        availableAt = new Date();
        availableAt.setDate(availableAt.getDate() + 8);
      } else if (newStatus === 'AVAILABLE') {
        availableAt = new Date();
      }

      trade = await prisma.trade.update({
        where: { id: trade.id },
        data: {
          status: newStatus,
          availableAt,
          tradeAcceptedAt: newStatus === 'ACCEPTED_BY_BOT' ? new Date() : trade.tradeAcceptedAt,
          updatedAt: new Date(),
        },
        include: { user: true, items: true },
      });

      await prisma.auditLog.create({
        data: {
          userId: trade.userId,
          action: 'TRADE_STATUS_UPDATED',
          details: {
            tradeId: trade.id,
            oldStatus,
            newStatus,
            skinplaceStatus: status,
            tradeOfferId,
            transactionId,
            amount,
            source: 'ipn1',
          },
          ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'skinplace',
        },
      });

      if (newStatus === 'ACCEPTED_BY_BOT') {
        await TradeHooks.onTradeAccepted(trade.userId, trade.id);
      } else if (newStatus === 'AVAILABLE') {
        await TradeHooks.onTradeAvailable(trade.id);
      } else if (newStatus === 'FAILED') {
        console.error(`Trade ${trade.id} échoué pour user ${trade.userId}`);
      }
    } else {
      console.log('[WEBHOOK] Statut ignoré (pas de progression): ' + oldStatus + ' -> ' + newStatus + ' (old idx=' + statusOrder.indexOf(oldStatus) + ' new idx=' + statusOrder.indexOf(newStatus) + ')');
    }

    // Skinplace attend HTTP 200 avec body "ok"
    return new Response('ok', { status: 200 });

  } catch (error) {
    console.error('❌ Erreur IPN Skinplace:', error);
    return new Response('error', { status: 500 });
  }
}

// Garder POST pour compatibilité éventuelle (certains setups peuvent envoyer POST)
export async function POST(request: NextRequest) {
  // Rediriger vers GET avec les params du body si nécessaire
  // Skinplace envoie normalement en GET, mais on garde un fallback
  try {
    const body = await request.json().catch(() => ({}));
    const url = new URL(request.url);
    for (const [key, value] of Object.entries(body as Record<string, string>)) {
      if (!url.searchParams.has(key)) url.searchParams.set(key, String(value));
    }
    return GET(new NextRequest(url.toString(), { headers: request.headers }));
  } catch {
    return new Response('ok', { status: 200 });
  }
}

