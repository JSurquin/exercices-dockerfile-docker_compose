import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { decrypt } from '@/lib/encryption';
import { safeParseJson } from '@/lib/validation/helpers';
import { adminMerchantWithdrawBodySchema } from '@/lib/validation/schemas/merchant-withdraw';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { PayoutLifecycle } from '@/lib/payout-lifecycle';
import { verifyMutationOrigin } from '@/lib/csrf-mutation-guard';
import { isMerchantWithdrawReference, type MerchantWithdrawDetails } from '@/lib/merchant-withdraw';
import { getClientIP } from '@/lib/security/audit-helpers';
import { RateLimiter, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';

const adminRateLimiter = new RateLimiter('ADMIN_MERCHANT_WITHDRAW', RATE_LIMIT_CONFIGS.SENSITIVE_ACTIONS);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ payoutId: string }> },
) {
  try {
    const csrfBlock = verifyMutationOrigin(request);
    if (csrfBlock) return csrfBlock;

    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const rateCheck = await adminRateLimiter.checkLimit(request, session.user.id);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Trop de requêtes. Réessayez plus tard.' }, { status: 429 });
    }

    const { payoutId } = await params;
    const raw = await request.json();
    const parsed = safeParseJson(raw, adminMerchantWithdrawBodySchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    const { action, reason, reference, internalNote } = parsed.data;
    const ipAddress = getClientIP(request);

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!payout) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    }

    if (!isMerchantWithdrawReference(payout.gateFiOrderId)) {
      return NextResponse.json({ error: 'Cette demande n\'est pas un retrait merchant' }, { status: 400 });
    }

    const previousStatus = payout.status;

    if (action === 'process') {
      if (payout.status !== 'PENDING_APPROVAL') {
        return NextResponse.json(
          { error: `Impossible de passer en traitement depuis le statut "${payout.status}"` },
          { status: 400 },
        );
      }

      const updated = await prisma.payout.update({
        where: { id: payoutId },
        data: { status: 'PROCESSING' },
      });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'ADMIN_MERCHANT_WITHDRAW_PROCESSING',
          details: {
            payoutId,
            previousStatus,
            newStatus: 'PROCESSING',
            adminId: session.user.id,
            ipAddress,
          },
        },
      });

      return NextResponse.json({ success: true, payout: updated });
    }

    if (action === 'approve') {
      if (!reference?.trim()) {
        return NextResponse.json(
          { error: 'La référence de paiement (tx hash ou référence de virement) est obligatoire' },
          { status: 400 },
        );
      }

      if (!['PENDING_APPROVAL', 'PROCESSING'].includes(payout.status)) {
        return NextResponse.json(
          { error: `Impossible de marquer comme payé depuis le statut "${payout.status}"` },
          { status: 400 },
        );
      }

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'ADMIN_MERCHANT_WITHDRAW_APPROVED',
          details: {
            payoutId,
            previousStatus,
            reference: reference.trim(),
            internalNote: internalNote?.trim() ?? null,
            amountCents: payout.amountCents,
            adminId: session.user.id,
            ipAddress,
          },
        },
      });

      const { debited } = await PayoutLifecycle.onCompleted(
        payout.user!.id,
        payoutId,
        payout.amountCents,
        {
          reason: `Merchant withdraw ${payoutId} payé`,
          finalStatus: 'PAID',
          paidAt: new Date(),
        },
      );

      if (!debited) {
        return NextResponse.json(
          { error: 'Impossible de débiter le solde. Le payout n\'a pas été finalisé.' },
          { status: 400 },
        );
      }

      const updatedPayout = await prisma.payout.update({
        where: { id: payoutId },
        data: {
          paymentReference: reference.trim(),
          errorMessage: internalNote?.trim() ? `[note interne] ${internalNote.trim()}` : null,
        },
      });

      return NextResponse.json({ success: true, payout: updatedPayout });
    }

    // action === 'reject'
    if (!reason?.trim()) {
      return NextResponse.json({ error: 'Le motif de refus est obligatoire' }, { status: 400 });
    }

    if (!['PENDING_APPROVAL', 'PROCESSING'].includes(payout.status)) {
      return NextResponse.json(
        { error: `Impossible de refuser depuis le statut "${payout.status}"` },
        { status: 400 },
      );
    }

    await PayoutLifecycle.onFailed(payout.user!.id, payoutId, payout.amountCents, {
      finalStatus: 'CANCELLED',
    });

    const updatedPayout = await prisma.payout.update({
      where: { id: payoutId },
      data: { errorMessage: reason.trim() },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMIN_MERCHANT_WITHDRAW_REJECTED',
        details: {
          payoutId,
          previousStatus,
          reason: reason.trim(),
          amountCents: payout.amountCents,
          adminId: session.user.id,
          ipAddress,
        },
      },
    });

    return NextResponse.json({ success: true, payout: updatedPayout });
  } catch (error) {
    console.error('[ADMIN MERCHANT WITHDRAW] PATCH error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ payoutId: string }> },
) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { payoutId } = await params;
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        user: {
          select: { id: true, name: true, email: true, steamUsername: true, steamAvatar: true },
        },
      },
    });

    if (!payout || !isMerchantWithdrawReference(payout.gateFiOrderId)) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    }

    let details: MerchantWithdrawDetails | null = null;
    if (payout.pendingFlexifyRequestEncrypted) {
      try {
        details = JSON.parse(decrypt(payout.pendingFlexifyRequestEncrypted)) as MerchantWithdrawDetails;
      } catch {
        // ignore
      }
    }

    return NextResponse.json({
      id: payout.id,
      reference: payout.gateFiOrderId,
      status: payout.status,
      amountCents: payout.amountCents,
      netCents: payout.amountCents,
      createdAt: payout.createdAt,
      paidAt: payout.paidAt,
      errorMessage: payout.errorMessage,
      paymentReference: payout.paymentReference,
      user: payout.user,
      coordinates: details,
    });
  } catch (error) {
    console.error('[ADMIN MERCHANT WITHDRAW] detail GET error', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
