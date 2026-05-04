import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '~/prisma/prisma';
import { canUserMakePayout } from '@/lib/kycaid';
import { buildEncryptedSepaDetails } from '@/lib/payment-method-sepa';
import { encrypt } from '@/lib/encryption';
import { validateIban } from '@/lib/flexify';
import { getBalance } from '@/lib/balance-service';
import { PayoutLifecycle } from '@/lib/payout-lifecycle';
import crypto from 'crypto';
import { safeParseJson } from '@/lib/validation/helpers';
import { payoutsSepaFrBodySchema } from '@/lib/validation/schemas/integrations';

const generateReference = () =>
  `MOON-SEPA-FR-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = session.user.id;

    const kycCheck = await canUserMakePayout(userId);
    if (!kycCheck.allowed) {
      return NextResponse.json({ error: kycCheck.reason, code: 'KYC_REQUIRED' }, { status: 403 });
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, payoutsSepaFrBodySchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const { amountCents, iban, bic, firstName, lastName } = parsed.data;

    if (!amountCents || amountCents <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }
    if (amountCents < 1000) {
      return NextResponse.json({ error: 'Montant minimum : 10 €' }, { status: 400 });
    }

    if (!iban) {
      return NextResponse.json({ error: 'IBAN requis' }, { status: 400 });
    }

    const ibanClean = iban.replace(/\s/g, '').toUpperCase();
    if (!ibanClean.startsWith('FR')) {
      return NextResponse.json(
        { error: 'Cet endpoint est réservé aux IBAN français (FR). Pour les autres pays, utilisez la méthode SEPA standard.' },
        { status: 400 }
      );
    }

    const ibanValidation = validateIban(iban);
    if (!ibanValidation.isValid) {
      return NextResponse.json({ error: ibanValidation.error }, { status: 400 });
    }

    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ error: 'Prénom et nom requis' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user?.email) {
      return NextResponse.json({ error: 'Email utilisateur requis' }, { status: 400 });
    }

    // Check available balance via the canonical balance service
    const balance = await getBalance(userId);
    if (amountCents > balance.availableCents) {
      return NextResponse.json({ error: 'Solde insuffisant' }, { status: 400 });
    }

    const reference = generateReference();
    const bicClean = (bic || '').replace(/\s/g, '').toUpperCase();

    const encryptedDetails = buildEncryptedSepaDetails(ibanClean, bicClean);

    let paymentMethod = await prisma.paymentMethod.findFirst({
      where: { userId, type: 'SEPA' },
    });

    if (!paymentMethod) {
      paymentMethod = await prisma.paymentMethod.create({
        data: { userId, type: 'SEPA', details: encryptedDetails as object, isVerified: true },
      });
    } else {
      paymentMethod = await prisma.paymentMethod.update({
        where: { id: paymentMethod.id },
        data: { details: encryptedDetails as object },
      });
    }

    // Store beneficiary info encrypted for admin view
    const sepaFrPayload = encrypt(JSON.stringify({
      iban: ibanClean,
      bic: bicClean,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      userEmail: user.email,
    }));

    // Frais SEPA Premium : 1.7%
    const processingFeeCents = Math.ceil(amountCents * 0.017);
    const networkFeeCents = 0;

    const payout = await prisma.payout.create({
      data: {
        userId,
        status: 'PENDING_APPROVAL',
        amountCents,
        paymentMethodId: paymentMethod.id,
        gateFiOrderId: reference,
        processingFeeCents,
        networkFeeCents,
        pendingFlexifyRequestEncrypted: sepaFrPayload,
      },
    });
    try {
      await PayoutLifecycle.onCreated(userId, payout.id, amountCents);
    } catch (freezeErr) {
      await prisma.payout.update({ where: { id: payout.id }, data: { status: 'FAILED', errorMessage: 'freeze_failed' } });
      if (freezeErr instanceof Error && freezeErr.message === 'INSUFFICIENT_AVAILABLE_BALANCE') {
        return NextResponse.json({ error: 'Solde insuffisant' }, { status: 409 });
      }
      throw freezeErr;
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'SEPA_FR_PAYOUT_REQUESTED',
        details: {
          payoutId: payout.id,
          reference,
          amountCents,
          maskedIban: ibanClean.slice(0, 4) + '****' + ibanClean.slice(-4),
        },
      },
    });

    return NextResponse.json({
      success: true,
      pendingApproval: true,
      message: 'Demande enregistrée. Notre équipe traitera votre virement sous 24-48h ouvrées.',
      payout: {
        id: payout.id,
        reference,
        status: 'PENDING_APPROVAL',
        amountCents,
        fees: { processingCents: processingFeeCents, networkCents: 0, totalCents: processingFeeCents },
        netCents: amountCents - processingFeeCents,
        method: 'SEPA_FR',
      },
    });
  } catch (error) {
    console.error('[SEPA_FR] POST error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la création de la demande' },
      { status: 500 }
    );
  }
}
