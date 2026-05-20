import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '~/prisma/prisma';
import {
  getTransactionStatus as getFlexifyTransactionStatus,
  getTransactionByReference as getFlexifyTransactionByReference,
  checkPayoutByReference as checkFlexifyPayoutByReference,
  isTransactionCompleted as isFlexifyCompleted,
  isTransactionFailed as isFlexifyFailed,
  flexifyLog,
  type FlexifyTransactionStatus,
} from '@/lib/flexify';
import {
  resolveWhitepayTransactionStatus,
  isTransactionComplete as isWhitepayComplete,
  isTransactionFailed as isWhitepayFailed,
} from '@/lib/whitepay';
import { PayoutLifecycle } from '@/lib/payout-lifecycle';
import { RateLimiter, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';

const reconcileRateLimiter = new RateLimiter('USER_PAYOUT_RECONCILE', RATE_LIMIT_CONFIGS.PAYOUT_RECONCILE);

interface ReconcileResult {
  payoutId: string;
  action: 'debited' | 'failed' | 'unchanged' | 'error' | 'corrected';
  amountCents: number;
  provider: 'flexify' | 'whitepay';
}

const FLEXIFY_STATUSES = [
  'PROCESSING',
  'PENDING',
  'FLEXIFY_PENDING',
  'FLEXIFY_PROCESSING',
  // Payouts dont le webhook a marqué le statut final mais où le débit/dégel a échoué
  'FLEXIFY_PAID',
  'PAID',
] as const;
const WHITEPAY_STATUSES = [
  'WHITEPAY_PENDING_WITHDRAWAL',
  'WHITEPAY_PROCESSING_WITHDRAWAL',
  'WHITEPAY_WAITING_CONFIRMATION',
  'PROCESSING',
  'PENDING',
  // Payouts dont le webhook a marqué COMPLETE mais où onCompleted a échoué silencieusement
  'WHITEPAY_COMPLETE',
  'PAID',
] as const;

/**
 * Interroge Flexify avec 3 fallbacks (H2H Check, Reporting par transaction_id, Reporting par reference)
 * pour récupérer le statut final même si webhook a échoué.
 */
async function fetchFlexifyStatus(
  payout: { flexifyPayoutId: string | null; gateFiOrderId?: string | null; paymentMethodType?: string | null },
): Promise<FlexifyTransactionStatus | null> {
  const pm = (payout.paymentMethodType ?? '').toUpperCase();
  const credentialType: 'sepa' | 'card' =
    pm === 'SEPA' || pm === 'FLEXIFY_SEPA' ? 'sepa' : 'card';

  // 1) Check officiel H2H par référence (le plus fiable, doc Flexify)
  if (payout.gateFiOrderId) {
    try {
      const data = await checkFlexifyPayoutByReference(payout.gateFiOrderId, credentialType);
      const s = data.transaction?.status ?? data.status;
      if (s) return s;
    } catch (err) {
      flexifyLog('RECONCILE_CHECK_FAILED', { reference: payout.gateFiOrderId, error: String(err) }, 'warn');
    }
  }

  // 2) Reporting par transaction_id (si on a un identifier PT*)
  if (payout.flexifyPayoutId) {
    try {
      const data = await getFlexifyTransactionStatus(payout.flexifyPayoutId);
      const s = data.transaction?.status ?? data.status;
      if (s) return s;
    } catch (err) {
      flexifyLog('RECONCILE_GET_TX_STATUS_FAILED', { txId: payout.flexifyPayoutId, error: String(err) }, 'warn');
    }
  }

  // 3) Reporting par reference (dernier fallback)
  if (payout.gateFiOrderId) {
    try {
      const data = await getFlexifyTransactionByReference(payout.gateFiOrderId);
      const s = data.transaction?.status ?? data.status;
      if (s) return s;
    } catch (err) {
      flexifyLog('RECONCILE_GET_TX_BY_REF_FAILED', { reference: payout.gateFiOrderId, error: String(err) }, 'warn');
    }
  }

  return null;
}

async function reconcileFlexifyPayout(
  userId: string,
  payout: { id: string; flexifyPayoutId: string | null; gateFiOrderId: string | null; status: string; amountCents: number; tradeId: string | null; paymentMethodType: string | null },
): Promise<ReconcileResult> {
  // Statut interne déjà « payé » mais débit balance pas rejoué : on revérifie Flexify avant tout débit
  if (payout.status === 'FLEXIFY_PAID' || payout.status === 'PAID') {
    const flexifyStatus = await fetchFlexifyStatus(payout);
    if (!flexifyStatus) {
      return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider: 'flexify' };
    }
    if (isFlexifyFailed(flexifyStatus)) {
      return applyFailed(userId, payout, 'flexify');
    }
    if (!isFlexifyCompleted(flexifyStatus)) {
      return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider: 'flexify' };
    }
    return applyDebit(userId, payout, 'flexify', { preserveExistingStatus: true });
  }

  const flexifyStatus = await fetchFlexifyStatus(payout);

  if (!flexifyStatus) {
    return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider: 'flexify' };
  }

  if (isFlexifyCompleted(flexifyStatus)) {
    return applyDebit(userId, payout, 'flexify');
  }
  if (isFlexifyFailed(flexifyStatus)) {
    return applyFailed(userId, payout, 'flexify');
  }
  return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider: 'flexify' };
}

/**
 * Retrouve l'orderId (external_id envoyé à Whitepay) depuis l'audit log.
 * Nécessaire pour le fallback /transactions?external_id= quand /convert-withdrawal/{id} retourne 404.
 */
async function getWhitepayOrderIdFromAudit(userId: string, payoutId: string): Promise<string | null> {
  // Cherche dans toutes les actions qui contiennent un orderId Whitepay
  const entry = await prisma.auditLog.findFirst({
    where: {
      userId,
      action: {
        in: [
          'WHITEPAY_WITHDRAWAL_CREATED',
          'WHITEPAY_INSTANT_WITHDRAWAL_CREATED',
          'ADMIN_PAYOUT_APPROVED',  // Payouts approuvés manuellement par un admin
        ],
      },
      details: { path: ['payoutId'], equals: payoutId },
    },
    select: { details: true },
  });
  if (!entry) return null;
  const d = entry.details as Record<string, unknown>;
  return typeof d.orderId === 'string' ? d.orderId : null;
}

async function reconcileWhitepayPayout(
  userId: string,
  payout: { id: string; whitepayTransactionId: string | null; status: string; amountCents: number; tradeId: string | null; createdAt: Date },
): Promise<ReconcileResult> {
  // Résolution avec double fallback : /convert-withdrawal → /transactions?external_id
  const externalId = await getWhitepayOrderIdFromAudit(userId, payout.id);
  const resolved = await resolveWhitepayTransactionStatus(payout.whitepayTransactionId, externalId);

  console.log(`[RECONCILE] Whitepay ${payout.id}: status=${resolved?.status ?? 'unknown'} source=${resolved?.source ?? 'none'} externalId=${externalId ?? 'none'}`);

  const wpStatus = resolved?.status;

  // Statut interne succès sans débit → confirmer chez Whitepay avant tout débit
  if (payout.status === 'WHITEPAY_COMPLETE' || payout.status === 'PAID') {
    if (!wpStatus) {
      return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider: 'whitepay' };
    }
    if (isWhitepayFailed(wpStatus as never)) {
      return applyFailed(userId, payout, 'whitepay');
    }
    if (!isWhitepayComplete(wpStatus as never)) {
      return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider: 'whitepay' };
    }
    return applyDebit(userId, payout, 'whitepay', { preserveExistingStatus: true });
  }

  if (!wpStatus) {
    // Introuvable ni sur convert-withdrawal ni sur /transactions — si > 24h on abandonne
    const ageMs = Date.now() - payout.createdAt.getTime();
    if (ageMs > 24 * 60 * 60 * 1000) {
      console.log(`[RECONCILE] Whitepay tx introuvable pour ${payout.id} (${Math.round(ageMs / 3600000)}h) → FAILED`);
      return applyFailed(userId, payout, 'whitepay');
    }
    return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider: 'whitepay' };
  }

  if (isWhitepayComplete(wpStatus as never)) {
    return applyDebit(userId, payout, 'whitepay');
  }
  if (isWhitepayFailed(wpStatus as never)) {
    return applyFailed(userId, payout, 'whitepay');
  }
  return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider: 'whitepay' };
}

async function applyDebit(
  userId: string,
  payout: { id: string; amountCents: number; tradeId: string | null },
  provider: 'flexify' | 'whitepay',
  options: { preserveExistingStatus?: boolean } = {},
): Promise<ReconcileResult> {
  const { debited } = await PayoutLifecycle.onCompleted(
    userId, payout.id, payout.amountCents,
    {
      tradeId: payout.tradeId,
      reason: `Payout ${provider} ${payout.id} complété (rattrapage polling)`,
      // Fast-path : on garde le statut et la date d'origine posés par le webhook provider
      ...(options.preserveExistingStatus ? {} : { finalStatus: 'PAID', paidAt: new Date() }),
    },
  );
  if (!debited) {
    return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider };
  }
  return { payoutId: payout.id, action: 'debited', amountCents: payout.amountCents, provider };
}

async function applyFailed(
  userId: string,
  payout: { id: string; amountCents: number; tradeId: string | null },
  provider: 'flexify' | 'whitepay',
): Promise<ReconcileResult> {
  const { unfrozen } = await PayoutLifecycle.onFailed(
    userId, payout.id, payout.amountCents,
    { tradeId: payout.tradeId, finalStatus: 'FAILED' },
  );
  if (!unfrozen) {
    return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider };
  }
  return { payoutId: payout.id, action: 'failed', amountCents: payout.amountCents, provider };
}

/**
 * Correction : payout marqué FAILED dans notre système mais COMPLETE chez Whitepay.
 * Cela arrive quand onFailed s'est déclenché (timeout > 24h) avant l'arrivée du webhook.
 * Le solde a déjà été dégélé (unfreezeBalance) → on doit juste débiter et passer en PAID.
 */
async function correctFailedWhitepayToPaid(
  userId: string,
  payout: { id: string; whitepayTransactionId: string | null; amountCents: number; tradeId: string | null },
): Promise<ReconcileResult> {
  const externalId = await getWhitepayOrderIdFromAudit(userId, payout.id);
  const resolved = await resolveWhitepayTransactionStatus(payout.whitepayTransactionId, externalId);
  const wpStatus = resolved?.status;

  console.log(`[RECONCILE] correctFailed ${payout.id}: status=${wpStatus ?? 'unknown'} source=${resolved?.source ?? 'none'} externalId=${externalId ?? 'none'}`);

  if (!wpStatus) {
    return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider: 'whitepay' };
  }

  if (!wpStatus || !isWhitepayComplete(wpStatus as never)) {
    return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider: 'whitepay' };
  }

  console.log(`[RECONCILE] Correction FAILED→PAID for payout ${payout.id} (Whitepay status=${wpStatus})`);

  // Réinitialiser le verrou pour permettre à onCompleted de s'exécuter
  const reset = await prisma.payout.updateMany({
    where: { id: payout.id, status: 'FAILED' },
    data: { balanceDebitedAt: null, status: 'WHITEPAY_COMPLETE' },
  });

  if (reset.count === 0) {
    console.warn(`[RECONCILE] Correction skipped for ${payout.id} — already corrected or concurrent update`);
    return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider: 'whitepay' };
  }

  const { debited } = await PayoutLifecycle.onCompleted(
    userId, payout.id, payout.amountCents,
    {
      tradeId: payout.tradeId,
      reason: `Correction: Whitepay tx ${payout.whitepayTransactionId} = COMPLETE (payout était FAILED)`,
      finalStatus: 'PAID',
      paidAt: new Date(),
    },
  );

  if (!debited) {
    console.error(`[RECONCILE] Correction failed: onCompleted returned debited=false for ${payout.id}`);
    return { payoutId: payout.id, action: 'error', amountCents: payout.amountCents, provider: 'whitepay' };
  }

  console.log(`[RECONCILE] Correction SUCCESS: payout ${payout.id} → PAID, balance débité de ${payout.amountCents} centimes`);
  return { payoutId: payout.id, action: 'corrected', amountCents: payout.amountCents, provider: 'whitepay' };
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = session.user.id;
    const isManual = request.nextUrl.searchParams.get('manual') === 'true';
    const triggerSource = isManual ? 'MANUAL_USER_CLICK' : 'AUTO_POLL';

    console.log(`[RECONCILE] Triggered by user ${userId} — source: ${triggerSource}`, {
      userId,
      triggerSource,
      timestamp: new Date().toISOString(),
    });

    const rateCheck = await reconcileRateLimiter.checkLimit(request, userId);
    if (!rateCheck.allowed) {
      console.warn(`[RECONCILE] Rate limit hit for user ${userId} — source: ${triggerSource}`);
      return NextResponse.json(
        { error: 'Trop de requêtes. Réessayez plus tard.', resetTime: rateCheck.resetTime },
        { status: 429 },
      );
    }

    // Flexify payouts bloqués (carte ou SEPA)
    // On garde aussi ceux sans flexifyPayoutId mais avec gateFiOrderId (check officiel H2H par référence)
    const flexifyPayoutsRaw = await prisma.payout.findMany({
      where: {
        userId,
        status: { in: [...FLEXIFY_STATUSES] },
        OR: [
          { flexifyPayoutId: { not: null } },
          { gateFiOrderId: { not: null } },
        ],
        balanceDebitedAt: null,
        paymentMethod: { type: { in: ['FLEXIFY_CARD', 'SEPA', 'CARD', 'FLEXIFY_SEPA'] } },
      },
      select: {
        id: true, flexifyPayoutId: true, gateFiOrderId: true, status: true, amountCents: true,
        tradeId: true,
        paymentMethod: { select: { type: true } },
      },
    });
    const flexifyPayouts = flexifyPayoutsRaw.map((p) => ({
      id: p.id,
      flexifyPayoutId: p.flexifyPayoutId,
      gateFiOrderId: p.gateFiOrderId,
      status: p.status,
      amountCents: p.amountCents,
      tradeId: p.tradeId,
      paymentMethodType: p.paymentMethod?.type ?? null,
    }));

    // WhitePay payouts bloqués : avec ou sans transactionId (on a le fallback /transactions?external_id=)
    const whitepayPayouts = await prisma.payout.findMany({
      where: {
        userId,
        status: { in: [...WHITEPAY_STATUSES] },
        balanceDebitedAt: null,
        paymentMethod: { type: 'WHITEPAY_CRYPTO' },
      },
      select: { id: true, whitepayTransactionId: true, status: true, amountCents: true, tradeId: true, createdAt: true },
    });

    // Payouts FAILED Whitepay : vérifier que Whitepay ne les a pas marqués COMPLETE
    // (cas : onFailed déclenché par timeout avant l'arrivée du webhook Whitepay)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const failedWhitepayToCheck = await prisma.payout.findMany({
      where: {
        userId,
        status: 'FAILED',
        paidAt: null,
        createdAt: { lt: thirtyMinutesAgo },
        paymentMethod: { type: 'WHITEPAY_CRYPTO' },
      },
      select: { id: true, whitepayTransactionId: true, amountCents: true, tradeId: true },
    });

    // Payouts WhitePay sans transactionId mais en PROCESSING depuis > 24h → marqués FAILED
    // (création API a échoué, donc plus jamais de webhook possible — il faut libérer la balance)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const orphanWhitepayPayouts = await prisma.payout.findMany({
      where: {
        userId,
        status: { in: [...WHITEPAY_STATUSES] },
        whitepayTransactionId: null,
        balanceDebitedAt: null,
        createdAt: { lt: oneDayAgo },
        paymentMethod: { type: 'WHITEPAY_CRYPTO' },
      },
      select: { id: true, status: true, amountCents: true, tradeId: true },
    });

    console.log(`[RECONCILE] Found payouts to check for user ${userId}:`, {
      flexify: flexifyPayouts.length,
      whitepay: whitepayPayouts.length,
      orphanWhitepay: orphanWhitepayPayouts.length,
      failedWhitepayToCorrect: failedWhitepayToCheck.length,
    });

    if (flexifyPayouts.length === 0 && whitepayPayouts.length === 0 && orphanWhitepayPayouts.length === 0 && failedWhitepayToCheck.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const results: ReconcileResult[] = [];

    for (const p of flexifyPayouts) {
      try {
        results.push(await reconcileFlexifyPayout(userId, p));
      } catch (err) {
        flexifyLog('RECONCILE_PAYOUT_ERROR', { payoutId: p.id, provider: 'flexify', error: String(err) }, 'error');
        results.push({ payoutId: p.id, action: 'error', amountCents: p.amountCents, provider: 'flexify' });
      }
    }

    for (const p of whitepayPayouts) {
      try {
        results.push(await reconcileWhitepayPayout(userId, p));
      } catch (err) {
        console.error('[RECONCILE] Whitepay error:', p.id, err);
        results.push({ payoutId: p.id, action: 'error', amountCents: p.amountCents, provider: 'whitepay' });
      }
    }

    // Correction FAILED → PAID : Whitepay a payé mais notre système a déclenché onFailed par timeout
    for (const p of failedWhitepayToCheck) {
      try {
        const r = await correctFailedWhitepayToPaid(userId, p);
        if (r.action !== 'unchanged') results.push(r);
      } catch (err) {
        console.error('[RECONCILE] correctFailedWhitepayToPaid error:', p.id, err);
        results.push({ payoutId: p.id, action: 'error', amountCents: p.amountCents, provider: 'whitepay' });
      }
    }

    // Orphelins Whitepay : pas d'ID provider, > 24h → on libère la balance (FAILED)
    for (const p of orphanWhitepayPayouts) {
      try {
        const r = await applyFailed(userId, p, 'whitepay');
        results.push(r);
      } catch (err) {
        console.error('[RECONCILE] Orphan Whitepay error:', p.id, err);
        results.push({ payoutId: p.id, action: 'error', amountCents: p.amountCents, provider: 'whitepay' });
      }
    }

    const acted = results.filter((r) => r.action === 'debited' || r.action === 'failed' || r.action === 'corrected');
    if (acted.length > 0) {
      console.log(`[RECONCILE] State changes for user ${userId}:`, acted.map((r) => ({
        payoutId: r.payoutId,
        action: r.action,
        provider: r.provider,
        amountCents: r.amountCents,
      })));
    } else {
      console.log(`[RECONCILE] No changes needed for user ${userId} — all payouts up to date`);
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('[RECONCILE_PAYOUTS] Error:', error);
    return NextResponse.json({ error: 'Erreur lors de la réconciliation' }, { status: 500 });
  }
}
