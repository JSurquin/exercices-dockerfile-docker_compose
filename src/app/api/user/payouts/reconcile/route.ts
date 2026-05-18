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
  getTransactionStatus as getWhitepayTransactionStatus,
  isTransactionComplete as isWhitepayComplete,
  isTransactionFailed as isWhitepayFailed,
} from '@/lib/whitepay';
import { PayoutLifecycle } from '@/lib/payout-lifecycle';
import { RateLimiter, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';

const reconcileRateLimiter = new RateLimiter('USER_PAYOUT_RECONCILE', RATE_LIMIT_CONFIGS.PAYOUT_RECONCILE);

interface ReconcileResult {
  payoutId: string;
  action: 'debited' | 'failed' | 'unchanged' | 'error';
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

async function reconcileWhitepayPayout(
  userId: string,
  payout: { id: string; whitepayTransactionId: string | null; status: string; amountCents: number; tradeId: string | null; createdAt: Date },
): Promise<ReconcileResult> {
  // Même logique : statut interne succès sans débit → confirmer chez Whitepay avant applyDebit
  if (payout.status === 'WHITEPAY_COMPLETE' || payout.status === 'PAID') {
    let wpStatus: string | undefined;
    try {
      const wpData = await getWhitepayTransactionStatus(payout.whitepayTransactionId!);
      wpStatus = wpData.transaction?.status;
    } catch (err) {
      const msg = (err as Error).message ?? '';
      const ageMs = Date.now() - payout.createdAt.getTime();
      if ((msg.includes('404') || msg.toLowerCase().includes('not found')) && ageMs > 24 * 60 * 60 * 1000) {
        return applyFailed(userId, payout, 'whitepay');
      }
      return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider: 'whitepay' };
    }
    if (wpStatus && isWhitepayFailed(wpStatus as never)) {
      return applyFailed(userId, payout, 'whitepay');
    }
    if (!wpStatus || !isWhitepayComplete(wpStatus as never)) {
      return { payoutId: payout.id, action: 'unchanged', amountCents: payout.amountCents, provider: 'whitepay' };
    }
    return applyDebit(userId, payout, 'whitepay', { preserveExistingStatus: true });
  }

  let wpStatus: string | undefined;
  try {
    const wpData = await getWhitepayTransactionStatus(payout.whitepayTransactionId!);
    wpStatus = wpData.transaction?.status;
  } catch (err) {
    const msg = (err as Error).message ?? '';
    // Transaction inconnue chez Whitepay + > 24h → on libère la balance (FAILED)
    const ageMs = Date.now() - payout.createdAt.getTime();
    if ((msg.includes('404') || msg.toLowerCase().includes('not found')) && ageMs > 24 * 60 * 60 * 1000) {
      return applyFailed(userId, payout, 'whitepay');
    }
    throw err;
  }

  if (!wpStatus) {
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

    // WhitePay payouts bloqués (uniquement ceux avec transactionId — sinon rien à interroger)
    const whitepayPayouts = await prisma.payout.findMany({
      where: {
        userId,
        status: { in: [...WHITEPAY_STATUSES] },
        whitepayTransactionId: { not: null },
        balanceDebitedAt: null,
      },
      select: { id: true, whitepayTransactionId: true, status: true, amountCents: true, tradeId: true, createdAt: true },
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
    });

    if (flexifyPayouts.length === 0 && whitepayPayouts.length === 0 && orphanWhitepayPayouts.length === 0) {
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

    const acted = results.filter((r) => r.action === 'debited' || r.action === 'failed');
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
