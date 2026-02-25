import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '~/prisma/prisma';
import {
  createSepaPayout,
  createCardPayout,
  calculateSepaFees,
  calculateCardFees,
  getPayoutLimits,
  validateIban,
  validateBic,
  centsToEur,
  FlexifyApiError,
  flexifyLog,
} from '@/lib/flexify';
import { canUserMakePayout } from '@/lib/kycaid';
import crypto from 'crypto';
import {
  buildEncryptedSepaDetails,
  getDecryptedSepaPayload,
  getPublicSepaDetails,
  migrateToEncryptedDetails,
  type SepaDetailsStored,
} from '@/lib/payment-method-sepa';

const generateReference = () => `MOON-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

/** Log toutes les étapes (dev + prod) pour tracer Flexify */
const LOG = (step: string, data?: object) => {
  flexifyLog(`PAYOUT_API_${step}`, (data ?? {}) as Record<string, unknown>);
};

// =============================================================================
// POST - Créer un nouveau payout Flexify (Carte ou SEPA). Crypto → /api/whitepay/withdrawal
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    LOG('START', {});
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      LOG('AUTH_FAIL', {});
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    LOG('SESSION_OK', { userId });

    const kycCheck = await canUserMakePayout(userId);
    if (!kycCheck.allowed) {
      LOG('KYC_REJECTED', { reason: kycCheck.reason });
      return NextResponse.json(
        { error: kycCheck.reason, code: 'KYC_REQUIRED' },
        { status: 403 }
      );
    }
    LOG('KYC_OK', {});

    const body = await request.json();
    LOG('BODY_RECEIVED', { keys: Object.keys(body) });
    const {
      method, // 'card' | 'sepa' — crypto → /api/whitepay/withdrawal
      amountCents,
      tradeId,
      paymentMethodId,
      description,
      // Card
      cardNumber,
      cardHolder,
      expireMonth,
      expireYear,
      cvv,
      // SEPA / bénéficiaire
      iban,
      bic,
      firstName,
      lastName,
      phone,
      address: addressStr,
      beneficiaryCity,
      beneficiaryCountry,
      beneficiaryEmail,
    } = body;

    const methodNorm = typeof method === 'string' ? method.toLowerCase() : method;
    if (methodNorm !== 'card' && methodNorm !== 'sepa') {
      LOG('METHOD_INVALID', { method });
      return NextResponse.json(
        { error: 'Cette route gère Carte et SEPA uniquement. Pour la crypto, utilisez /api/whitepay/withdrawal.' },
        { status: 400 }
      );
    }

    if (!amountCents || amountCents <= 0) {
      LOG('AMOUNT_INVALID', { amountCents });
      return NextResponse.json(
        { error: 'Montant invalide' },
        { status: 400 }
      );
    }

    const limits = getPayoutLimits(methodNorm === 'card' ? 'card' : 'sepa');
    if (amountCents < limits.minCents) {
      return NextResponse.json(
        { error: `Montant minimum: ${centsToEur(limits.minCents)}€` },
        { status: 400 }
      );
    }
    if (amountCents > limits.maxCents) {
      return NextResponse.json(
        { error: `Montant maximum: ${centsToEur(limits.maxCents)}€` },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user?.email) {
      LOG('USER_EMAIL_MISSING', {});
      return NextResponse.json(
        { error: 'Email utilisateur requis' },
        { status: 400 }
      );
    }
    LOG('USER_OK', { email: user.email });

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     '0.0.0.0';

    const reference = generateReference();

    // ————— Carte (Flexify) —————
    if (methodNorm === 'card') {
      const cardNum = (cardNumber || '').replace(/\s/g, '');
      if (!cardNum || cardNum.length < 13) {
        return NextResponse.json(
          { error: 'Numéro de carte invalide' },
          { status: 400 }
        );
      }
      if (!cardHolder?.trim()) {
        return NextResponse.json(
          { error: 'Titulaire de la carte requis' },
          { status: 400 }
        );
      }
      const expMonth = (expireMonth || '').toString().padStart(2, '0');
      const expYear = (expireYear || '').toString();
      const expYearFull = expYear.length === 2 ? `20${expYear}` : expYear;
      if (!expMonth || !expYearFull || expMonth.length !== 2) {
        return NextResponse.json(
          { error: 'Date d\'expiration invalide' },
          { status: 400 }
        );
      }
      if (!cvv || cvv.length < 3) {
        return NextResponse.json(
          { error: 'CVV requis' },
          { status: 400 }
        );
      }

      const fees = calculateCardFees(amountCents);
      LOG('CALL_CREATE_CARD_PAYOUT', { reference, amountCents });
      const flexifyResponse = await createCardPayout({
        reference,
        amountCents,
        customer: {
          identifier: userId,
          email: user.email,
          country: (beneficiaryCountry && typeof beneficiaryCountry === 'string') ? beneficiaryCountry : 'FR',
          ip: clientIp,
        },
        card: {
          number: cardNum,
          holderName: cardHolder.trim(),
          expireMonth: expMonth,
          expireYear: expYearFull,
          cvv: cvv.toString(),
        },
      });

      if (flexifyResponse.code !== 0 || !flexifyResponse.transaction) {
        LOG('CARD_PAYOUT_REJECTED', { code: flexifyResponse.code, error_message: flexifyResponse.error_message });
        throw new Error(flexifyResponse.error_message || 'Échec de la création du payout carte');
      }
      LOG('CARD_PAYOUT_OK', { transactionId: flexifyResponse.transaction?.id });

      const cardPaymentMethod = await prisma.paymentMethod.create({
        data: {
          userId,
          type: 'FLEXIFY_CARD',
          details: { last4: cardNum.slice(-4) },
          isVerified: true,
        },
      });

      const payout = await prisma.payout.create({
        data: {
          userId,
          tradeId: tradeId || null,
          status: 'PENDING',
          amountCents,
          paymentMethodId: cardPaymentMethod.id,
          gateFiOrderId: reference,
          flexifyPayoutId: flexifyResponse.transaction!.id,
          processingFeeCents: fees.processingFeeCents,
          networkFeeCents: fees.networkFeeCents,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'FLEXIFY_PAYOUT_CREATED',
          details: {
            payoutId: payout.id,
            reference,
            method: 'CARD',
            amountCents,
            fees,
            flexifyTransactionId: flexifyResponse.transaction!.id,
            flexifyStatus: flexifyResponse.transaction!.status,
          },
        },
      });

      LOG('DB_PAYOUT_CREATED_CARD', { payoutId: payout.id });
      return NextResponse.json({
        success: true,
        payout: {
          id: payout.id,
          reference,
          status: payout.status,
          amountCents,
          fees: {
            processingCents: fees.processingFeeCents,
            networkCents: fees.networkFeeCents,
            totalCents: fees.totalFeeCents,
          },
          netCents: amountCents - fees.totalFeeCents,
          method: 'CARD',
          flexifyTransactionId: flexifyResponse.transaction!.id,
          flexifyStatus: flexifyResponse.transaction!.status,
          estimatedArrival: 'Instantané à 24h',
        },
      });
    }

    // ————— SEPA (Flexify) —————
    let ibanToUse: string;
    let bicToUse: string;
    let paymentMethod = null;

    // Cas 1 : réutilisation d'un moyen de paiement SEPA existant (IBAN déjà chiffré en BDD)
    if (paymentMethodId) {
      const existing = await prisma.paymentMethod.findFirst({
        where: { id: paymentMethodId, userId, type: 'SEPA' },
      });
      if (!existing) {
        return NextResponse.json(
          { error: 'Moyen de paiement SEPA introuvable ou invalide' },
          { status: 400 }
        );
      }
      const details = existing.details as unknown as SepaDetailsStored;
      // Migration lazy : si ancien format (iban en clair), chiffrer et mettre à jour
      const migrated = migrateToEncryptedDetails(details);
      if (migrated) {
        await prisma.paymentMethod.update({
          where: { id: existing.id },
          data: { details: migrated as object },
        });
      }
      const payload = getDecryptedSepaPayload(migrated ?? details);
      if (!payload) {
        return NextResponse.json(
          { error: 'Impossible de récupérer les coordonnées bancaires enregistrées' },
          { status: 400 }
        );
      }
      ibanToUse = payload.iban;
      bicToUse = payload.bic || '';
      paymentMethod = migrated ? await prisma.paymentMethod.findUnique({ where: { id: existing.id } }) : existing;
    } else {
      // Cas 2 : nouvel IBAN fourni dans le body
      if (!iban) {
        LOG('SEPA_IBAN_MISSING', {});
        return NextResponse.json(
          { error: 'IBAN requis pour un paiement SEPA' },
          { status: 400 }
        );
      }
      const ibanValidation = validateIban(iban);
      if (!ibanValidation.isValid) {
        LOG('SEPA_IBAN_INVALID', { error: ibanValidation.error });
        return NextResponse.json(
          { error: ibanValidation.error },
          { status: 400 }
        );
      }
      LOG('SEPA_IBAN_VALID', {});
      if (bic) {
        const bicValidation = validateBic(bic);
        if (!bicValidation.isValid) {
          return NextResponse.json(
            { error: bicValidation.error },
            { status: 400 }
          );
        }
      }
      ibanToUse = iban.replace(/\s/g, '').toUpperCase();
      bicToUse = (bic || '').replace(/\s/g, '').toUpperCase();
    }

    const fees = calculateSepaFees(amountCents);
    const beneficiaryFirst = (firstName ?? user.name?.split(' ')[0] ?? 'User').trim();
    const beneficiaryLast = (lastName ?? user.name?.split(' ').slice(1).join(' ') ?? 'User').trim();
    const customerAddress = typeof addressStr === 'string' ? addressStr : '';
    const beneficiaryAddr = customerAddress;

    LOG('CALL_CREATE_SEPA_PAYOUT', { reference, amountCents });
    const flexifyResponse = await createSepaPayout({
      reference,
      amountCents,
      description: typeof description === 'string' ? description : undefined,
      customer: {
        identifier: userId,
        email: user.email,
        phone: (phone && typeof phone === 'string') ? phone : '',
        first_name: beneficiaryFirst,
        last_name: beneficiaryLast,
        address: customerAddress,
        country: beneficiaryCountry || 'FR',
        ip: clientIp,
      },
      sepa: {
        iban: ibanToUse,
        bic: bicToUse || undefined,
        beneficiary_first_name: beneficiaryFirst,
        beneficiary_last_name: beneficiaryLast,
        beneficiary_country: (beneficiaryCountry && typeof beneficiaryCountry === 'string') ? beneficiaryCountry : 'FR',
        beneficiary_city: (beneficiaryCity && typeof beneficiaryCity === 'string') ? beneficiaryCity : '',
        beneficiary_address: beneficiaryAddr,
        beneficiary_email: (beneficiaryEmail && typeof beneficiaryEmail === 'string') ? beneficiaryEmail : user.email,
      },
    });

    if (flexifyResponse.code !== 0 || !flexifyResponse.transaction) {
      LOG('SEPA_PAYOUT_REJECTED', { code: flexifyResponse.code, error_message: flexifyResponse.error_message });
      throw new Error(flexifyResponse.error_message || 'Échec de la création du payout');
    }
    LOG('SEPA_PAYOUT_OK', { transactionId: flexifyResponse.transaction?.id });

    // Créer ou récupérer la méthode de paiement (stockage chiffré)
    if (!paymentMethod) {
      const encryptedDetails = buildEncryptedSepaDetails(ibanToUse, bicToUse);
      paymentMethod = await prisma.paymentMethod.findFirst({
        where: {
          userId,
          type: 'SEPA',
          details: { path: ['type'], equals: 'SEPA' },
        },
      });
      if (!paymentMethod) {
        paymentMethod = await prisma.paymentMethod.create({
          data: {
            userId,
            type: 'SEPA',
            details: encryptedDetails as object,
            isVerified: true,
          },
        });
      } else {
        // Mettre à jour avec IBAN chiffré (même utilisateur, on écrase le moyen SEPA existant)
        await prisma.paymentMethod.update({
          where: { id: paymentMethod.id },
          data: { details: encryptedDetails as object },
        });
      }
    }

    // Créer le payout en base
    const payout = await prisma.payout.create({
      data: {
        userId,
        tradeId: tradeId || null,
        status: 'PENDING',
        amountCents,
        paymentMethodId: paymentMethod.id,
        gateFiOrderId: reference, // Notre référence unique
        flexifyPayoutId: flexifyResponse.transaction.id, // ID Flexify de la transaction
        processingFeeCents: fees.processingFeeCents,
        networkFeeCents: fees.networkFeeCents,
      },
    });

    // Logger l'événement
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'FLEXIFY_PAYOUT_CREATED',
        details: {
          payoutId: payout.id,
          reference,
          method: 'SEPA',
          amountCents,
          fees,
          flexifyTransactionId: flexifyResponse.transaction.id,
          flexifyStatus: flexifyResponse.transaction.status,
        },
      },
    });

    LOG('DB_PAYOUT_CREATED_SEPA', { payoutId: payout.id });
    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        reference,
        status: payout.status,
        amountCents,
        fees,
        netCents: amountCents - fees.totalFeeCents,
        method: 'SEPA',
        flexifyTransactionId: flexifyResponse.transaction.id,
        flexifyStatus: flexifyResponse.transaction.status,
        estimatedArrival: '1-2 jours ouvrés',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la création du payout';
    if (error instanceof FlexifyApiError && error.response) {
      const code = (error.response.data as { error_code?: number; code?: number })?.error_code ?? (error.response.data as { code?: number })?.code;
      flexifyLog('PAYOUT_API_ERROR_FLEXIFY', {
        message: error.message,
        code,
        status: error.response.status,
        error_fields: error.errorFields,
        data: error.response.data,
      }, 'error');
      // 400 Invalid params : renvoyer les champs invalides pour le debug / UX
      const status = error.response.status === 400 ? 400 : 500;
      return NextResponse.json(
        {
          error: message,
          ...(error.errorFields?.length ? { error_fields: error.errorFields } : {}),
        },
        { status }
      );
    }
    flexifyLog('PAYOUT_API_ERROR', {
      message,
      name: error instanceof Error ? error.name : undefined,
    }, 'error');
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - Récupérer les payouts de l'utilisateur
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    LOG('GET_START', {});
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      LOG('GET_AUTH_FAIL', {});
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    LOG('GET_SESSION_OK', { userId });
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = { userId };
    if (status) {
      where.status = status;
    }

    const [payoutsRaw, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: {
          paymentMethod: true,
          trade: {
            select: {
              id: true,
              ticketId: true,
              grossCents: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.payout.count({ where }),
    ]);

    // Ne jamais exposer IBAN/BIC en clair : ne renvoyer que les détails masqués
    const payouts = payoutsRaw.map((p) => {
      const pm = p.paymentMethod;
      const details = pm?.details as SepaDetailsStored | null;
      const publicDetails = details && details.type === 'SEPA'
        ? getPublicSepaDetails(details)
        : (pm?.details ? { type: pm.type, maskedIban: null, maskedBic: null } : null);
      return {
        ...p,
        paymentMethod: pm
          ? { id: pm.id, type: pm.type, isVerified: pm.isVerified, details: publicDetails }
          : null,
      };
    });

    LOG('GET_SUCCESS', { total, limit, offset });
    return NextResponse.json({
      payouts,
      total,
      limit,
      offset,
    });
  } catch (error) {
    flexifyLog('PAYOUT_API_GET_ERROR', { error: String(error) }, 'error');
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des payouts' },
      { status: 500 }
    );
  }
}

