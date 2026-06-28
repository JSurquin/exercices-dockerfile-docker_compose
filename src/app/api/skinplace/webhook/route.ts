import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { TradeStatus } from '@prisma/client';
import { TradeHooks } from '@/lib/trade-hooks';
import { isProductionApp } from '@/lib/env-production';
import { safeParseJson } from '@/lib/validation/helpers';
import { skinplaceWebhookPostBodySchema } from '@/lib/validation/schemas/integrations';
import { logger } from '@/lib/logger';

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

    logger.info(`[WEBHOOK] IPN received: type=${type}, status=${status}`);

    // SÉCURITÉ: Vérification de la signature IPN (auth serveur-à-serveur)
    // secret_key IPN = SKINPLACE_API_KEY_PRIVATE (confirmé dashboard skin.place)
    const secretKey = process.env.SKINPLACE_SECRET_KEY ?? process.env.SKINPLACE_API_KEY_PRIVATE ?? '';
    const inProd = isProductionApp();
    
    // En production : secret ET signature obligatoires
    if (inProd) {
      if (!secretKey) {
        logger.error('[WEBHOOK] Skinplace API key missing in production');
        return new Response('ipn not configured', { status: 503 });
      }
      if (!receivedSignature) {
        return new Response('missing signature', { status: 401 });
      }
      if (!verifySkinplaceSignature(token, receivedSignature, secretKey)) {
        logger.error('[WEBHOOK] Skinplace signature invalid');
        return new Response('wrong signature', { status: 401 });
      }
    } else {
      if (!secretKey) {
        logger.error('[WEBHOOK] SKINPLACE_API_KEY_PRIVATE not configured — webhook blocked');
        return new Response('webhook endpoint disabled (no secret key)', { status: 503 });
      }
      if (!receivedSignature) {
        return new Response('missing signature', { status: 401 });
      }
      if (!verifySkinplaceSignature(token, receivedSignature, secretKey)) {
        logger.error('[WEBHOOK] Skinplace signature invalid');
        return new Response('wrong signature', { status: 401 });
      }
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
      logger.error('[WEBHOOK] Trade not found for IPN');
      return new Response('ok', { status: 200 });
    }

    logger.info(`[WEBHOOK] Trade found: ${trade.id}, status=${trade.status}`);

    // Cross-validation: compare webhook amount with stored trade amount
    const webhookAmountCents = Math.round(parseFloat(amount) * 100);
    if (webhookAmountCents > 0 && trade.grossCents > 0) {
      const drift = Math.abs(webhookAmountCents - trade.grossCents) / trade.grossCents;
      if (drift > 0.1) {
        logger.warn(`[WEBHOOK][SECURITY] Amount mismatch for trade ${trade.id}`);
      }
    }

    const oldStatus = trade.status;

    // =========================================================================
    // IPN #2 — protection_status confirmé ou rollback (~8 jours après l'échange)
    //
    // Skinplace envoie souvent protection_status=unconfirmed + status=complete
    // dès l'acceptation Steam (IPN #1). Ce cas ne doit PAS entrer ici : il est
    // traité plus bas via le champ status (→ IN_TRADE_HOLD).
    //
    // Skinplace peut aussi envoyer protection_status=unconfirmed ET status=cancelled
    // dans le même IPN : l'annulation est alors traitée via IPN #1.
    // =========================================================================
    if (protectionStatus === 'confirmed' || protectionStatus === 'rollback') {
      logger.info(`[WEBHOOK] IPN #2 protection_status=${protectionStatus} for trade ${trade.id}`);

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
        logger.info(`[WEBHOOK] Funds released for trade ${trade.id}`);
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
        logger.error(`[WEBHOOK] Rollback for trade ${trade.id}`);
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
      logger.warn('[WEBHOOK] IPN without status field, ignored');
      return new Response('ok', { status: 200 });
    }

    const newStatus = mapSkinplaceStatusToTradeStatus(status);
    logger.info(`[WEBHOOK] IPN #1 trade ${trade.id}: ${oldStatus} -> ${newStatus}`);

    const statusOrder: TradeStatus[] = [
      'CREATED', 'ACCEPTED_BY_BOT', 'IN_TRADE_HOLD', 'AVAILABLE', 'PAYOUT_PENDING', 'PAID',
    ];
    const oldIdx = statusOrder.indexOf(oldStatus);
    const newIdx = statusOrder.indexOf(newStatus);

    const TERMINAL_STATUSES: TradeStatus[] = ['FAILED', 'CANCELLED', 'PAID'];
    // Ne pas réécrire un état terminal déjà atteint
    if (TERMINAL_STATUSES.includes(oldStatus)) {
      logger.info(`[WEBHOOK] Trade ${trade.id} already terminal (${oldStatus}), IPN ignored`);
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

      await TradeHooks.applyStatusProgressionHooks(trade.userId, trade.id, oldStatus, newStatus);
    } else {
      logger.debug(`[WEBHOOK] Status not progressing: ${oldStatus} -> ${newStatus}, ignored`);
    }

    // Skinplace attend HTTP 200 avec body "ok"
    return new Response('ok', { status: 200 });

  } catch (error) {
    logger.error('[WEBHOOK] Skinplace IPN error', error);
    return new Response('error', { status: 500 });
  }
}

// Garder POST pour compatibilité éventuelle (certains setups peuvent envoyer POST)
export async function POST(request: NextRequest) {
  // Rediriger vers GET avec les params du body si nécessaire
  // Skinplace envoie normalement en GET, mais on garde un fallback
  try {
    const raw = await request.json().catch(() => ({}));
    const parsed = safeParseJson(raw, skinplaceWebhookPostBodySchema);
    const body = parsed.ok ? parsed.data : {};
    const url = new URL(request.url);
    for (const [key, value] of Object.entries(body as Record<string, string>)) {
      if (!url.searchParams.has(key)) url.searchParams.set(key, String(value));
    }
    return GET(new NextRequest(url.toString(), { headers: request.headers }));
  } catch {
    return new Response('ok', { status: 200 });
  }
}

