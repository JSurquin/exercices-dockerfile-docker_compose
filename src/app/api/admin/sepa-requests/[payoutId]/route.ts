import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { decrypt } from '@/lib/encryption';
import { safeParseJson } from '@/lib/validation/helpers';
import { adminSepaRequestBodySchema } from '@/lib/validation/schemas/admin-bodies';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { PayoutLifecycle } from '@/lib/payout-lifecycle';
import { isSepaFrPayout, notifySepaFrApproved, notifySepaFrRejected } from '@/lib/sepa-fr-notify';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ payoutId: string }> }
) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { payoutId } = await params;
    const raw = await request.json();
    const parsed = safeParseJson(raw, adminSepaRequestBodySchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const { action, reason, reference } = parsed.data;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action invalide. Utiliser "approve" ou "reject".' }, { status: 400 });
    }

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        user: { select: { id: true, name: true, email: true, contactEmail: true } },
      },
    });

    if (!payout) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    }

    if (!isSepaFrPayout(payout.gateFiOrderId)) {
      return NextResponse.json({ error: 'Cette demande n\'est pas une demande SEPA France' }, { status: 400 });
    }

    if (payout.status !== 'PENDING_APPROVAL') {
      return NextResponse.json({ error: `Impossible de modifier une demande en statut "${payout.status}"` }, { status: 400 });
    }

    let beneficiaryIban = '';
    let beneficiaryBic = '';
    if (payout.pendingFlexifyRequestEncrypted) {
      try {
        const decrypted = JSON.parse(decrypt(payout.pendingFlexifyRequestEncrypted));
        beneficiaryIban = decrypted.iban ?? '';
        beneficiaryBic = decrypted.bic ?? '';
      } catch {
        // ignore
      }
    }

    if (action === 'approve') {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'ADMIN_SEPA_FR_APPROVED',
          details: {
            payoutId,
            reference: reference ?? null,
            amountCents: payout.amountCents,
            adminId: session.user.id,
          },
        },
      });

      const { debited } = await PayoutLifecycle.onCompleted(
        payout.user!.id, payoutId, payout.amountCents,
        {
          tradeId: payout.tradeId,
          
          reason: `Payout Instant bank transfer ${payoutId} approuvé`,
          finalStatus: 'PAID',
          paidAt: new Date(),
        },
      );

      if (!debited) {
        return NextResponse.json(
          { error: 'Impossible de débiter le solde. Le payout n\'a pas été finalisé.' },
          { status: 400 }
        );
      }

      // Only update reference/clear errorMessage AFTER successful debit
      await prisma.payout.update({
        where: { id: payoutId },
        data: {
          paymentReference: reference ?? null,
          errorMessage: null,
        },
      });

      const updatedPayout = await prisma.payout.findUnique({ where: { id: payoutId } });

      try {
        await notifySepaFrApproved({
          user: payout.user ?? {},
          amountCents: payout.amountCents,
          reference: reference ?? payout.gateFiOrderId ?? payoutId,
          iban: beneficiaryIban,
          bic: beneficiaryBic,
        });
      } catch (err) {
        console.error('[ADMIN SEPA FR] approval email failed', payoutId, err);
      }

      return NextResponse.json({ success: true, payout: updatedPayout });
    }

    // action === 'reject'
    if (!reason?.trim()) {
      return NextResponse.json({ error: 'La raison du refus est requise' }, { status: 400 });
    }

    await PayoutLifecycle.onFailed(payout.user!.id, payoutId, payout.amountCents, {
      tradeId: payout.tradeId,
      finalStatus: 'CANCELLED',
    });

    const updatedPayout = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        errorMessage: reason.trim(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMIN_SEPA_FR_REJECTED',
        details: {
          payoutId,
          reason: reason.trim(),
          amountCents: payout.amountCents,
          adminId: session.user.id,
        },
      },
    });

    try {
      await notifySepaFrRejected({
        user: payout.user ?? {},
        amountCents: payout.amountCents,
        reason: reason.trim(),
      });
    } catch (err) {
      console.error('[ADMIN SEPA FR] rejection email failed', payoutId, err);
    }

    return NextResponse.json({ success: true, payout: updatedPayout });
  } catch (error) {
    console.error('[ADMIN SEPA FR] PATCH error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    );
  }
}

