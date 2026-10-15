import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '~/prisma/prisma';
import { canUserMakePayout } from '@/lib/kycaid';
import { buildEncryptedSepaDetails } from '@/lib/payment-method-sepa';
import { encrypt } from '@/lib/encryption';
import { validateSepaIban } from '@/lib/iban-sepa';
import { getBalance } from '@/lib/balance-service';
import { PayoutLifecycle } from '@/lib/payout-lifecycle';
import { notifyAdminsPayoutPendingApproval } from '@/lib/admin-notification-hooks';
import crypto from 'crypto';
import { validateAmountCents } from '@/lib/amount-validation';
import { safeParseJson } from '@/lib/validation/helpers';
import { payoutsSepaFrBodySchema } from '@/lib/validation/schemas/integrations';
import { RateLimiter, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';
import { rateLimitedJson } from '@/lib/rate-limited-response';

const payoutRateLimiter = new RateLimiter('PAYOUT_SEPA_FR', RATE_LIMIT_CONFIGS.PAYOUT_REQUEST);

const generateReference = () =>
  `MOON-SEPA-FR-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = session.user.id;

    const frozenCheck = await prisma.user.findUnique({
      where: { id: userId },
      select: { accountFrozen: true },
    });
    if (frozenCheck?.accountFrozen) {
      return NextResponse.json({ error: 'Votre compte est gelé. Contactez le support.' }, { status: 403 });
    }

    const kycCheck = await canUserMakePayout(userId);
    if (!kycCheck.allowed) {
      return NextResponse.json({ error: kycCheck.reason, code: 'KYC_REQUIRED' }, { status: 403 });
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, payoutsSepaFrBodySchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const { iban, bic, firstName, lastName } = parsed.data;
    const amountCents = validateAmountCents(parsed.data.amountCents);
    if (amountCents === null) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }
    if (amountCents < 1000) {
      return NextResponse.json({ error: 'Montant minimum : 10 €' }, { status: 400 });
    }
    if (amountCents > 1_000_000_00) {
      return NextResponse.json({ error: 'Montant maximum dépassé' }, { status: 400 });
    }

    if (!iban) {
      return NextResponse.json({ error: 'IBAN requis' }, { status: 400 });
    }

    const ibanClean = iban.replace(/\s/g, '').toUpperCase();

    const ibanValidation = validateSepaIban(ibanClean);
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

    // Vérification IBAN cooldown + limites quotidiennes
    const { SecurityService } = await import('@/lib/security-service');
    const securityService = new SecurityService();
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const secCheck = await securityService.checkPayoutEligibility(userId, amountCents, paymentMethod.id, ipAddress);
    // Montant > plafond mensuel : le SEPA Premium est justement le flux de validation manuelle admin.
    if (!secCheck.allowed && !secCheck.requiresManualVerification) {
      return NextResponse.json({ error: secCheck.reason }, { status: 403 });
    }

    const rateCheck = await payoutRateLimiter.checkLimit(request, userId);
    if (!rateCheck.allowed) {
      return rateLimitedJson({ success: false });
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

    await notifyAdminsPayoutPendingApproval(payout.id, userId, amountCents, 'SEPA FR');

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
      { error: 'Erreur lors de la création de la demande' },
      { status: 500 }
    );
  }
}
