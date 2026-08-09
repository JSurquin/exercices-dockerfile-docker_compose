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
  convertFlexifyStatus,
  isTransactionCompleted,
  FlexifyApiError,
  flexifyLog,
} from '@/lib/flexify';
import { isFrenchIban } from '@/lib/iban-sepa';
import { canUserMakePayout } from '@/lib/kycaid';
import crypto from 'crypto';
import {
  buildEncryptedSepaDetails,
  getDecryptedSepaPayload,
  getPublicSepaDetails,
  migrateToEncryptedDetails,
  type SepaDetailsStored,
} from '@/lib/payment-method-sepa';
import { getPayoutAutoApproveSettings } from '@/lib/payout-settings';
import { encrypt, decrypt } from '@/lib/encryption';
import { assertTradeOwnership } from '@/lib/trade-ownership';
import { checkWithdrawalLimit } from '@/lib/balance-service';
import { validateAmountCents } from '@/lib/amount-validation';
import { safeParseJson } from '@/lib/validation/helpers';
import { flexifyPayoutBodySchema } from '@/lib/validation/schemas/integrations';
import { PayoutLifecycle } from '@/lib/payout-lifecycle';
import { notifyAdminsPayoutPendingApproval } from '@/lib/admin-notification-hooks';
import { RateLimiter, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';

const payoutRateLimiter = new RateLimiter('PAYOUT_FLEXIFY', RATE_LIMIT_CONFIGS.PAYOUT_REQUEST);

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

    const rateCheck = await payoutRateLimiter.checkLimit(request, userId);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Trop de requêtes. Réessayez plus tard.' },
        { status: 429 }
      );
    }

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

    const raw = await request.json();
    const parsed = safeParseJson(raw, flexifyPayoutBodySchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const body = parsed.data as Record<string, any>;
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

    // Validation stricte du montant (entier positif uniquement)
    const validatedAmount = validateAmountCents(amountCents);
    if (validatedAmount === null) {
      LOG('AMOUNT_INVALID', { amountCents });
      return NextResponse.json(
        { error: 'Montant invalide (doit être un entier positif en centimes)' },
        { status: 400 }
      );
    }
    
    // SÉCURITÉ: Vérifier que le trade appartient bien à l'utilisateur
    if (tradeId) {
      const ownsTrade = await assertTradeOwnership(tradeId, userId);
      if (!ownsTrade) {
        LOG('TRADE_OWNERSHIP_VIOLATION', { tradeId, userId });
        return NextResponse.json(
          { error: 'Trade non trouvé ou accès non autorisé' },
          { status: 403 }
        );
      }
    }

    const limits = getPayoutLimits(methodNorm === 'card' ? 'card' : 'sepa');
    if (validatedAmount < limits.minCents) {
      return NextResponse.json(
        { error: `Montant minimum: ${centsToEur(limits.minCents)}€` },
        { status: 400 }
      );
    }
    if (validatedAmount > limits.maxCents) {
      return NextResponse.json(
        { error: `Montant maximum: ${centsToEur(limits.maxCents)}€` },
        { status: 400 }
      );
    }

    // SÉCURITÉ: Vérifier solde disponible et compte non gelé
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        email: true, 
        name: true,
        balanceCents: true,
        frozenBalanceCents: true,
        accountFrozen: true
      },
    });

    if (!user?.email) {
      LOG('USER_EMAIL_MISSING', {});
      return NextResponse.json(
        { error: 'Email utilisateur requis' },
        { status: 400 }
      );
    }
    
    if (user.accountFrozen) {
      LOG('ACCOUNT_FROZEN', { userId });
      return NextResponse.json(
        { error: 'Compte suspendu' },
        { status: 403 }
      );
    }
    
    const availableCents = Math.max(0, user.balanceCents - user.frozenBalanceCents);
    if (availableCents < validatedAmount) {
      LOG('INSUFFICIENT_BALANCE', { availableCents, requestedAmount: validatedAmount });
      return NextResponse.json(
        { error: `Solde insuffisant (disponible : ${centsToEur(availableCents)}€)` },
        { status: 400 }
      );
    }
    
    const withdrawalCheck = await checkWithdrawalLimit(userId, validatedAmount);
    if (!withdrawalCheck.allowed && !withdrawalCheck.requiresManualVerification) {
      LOG('WITHDRAWAL_LIMIT_EXCEEDED', { usedCents: withdrawalCheck.usedCents, limitCents: withdrawalCheck.limitCents });
      return NextResponse.json(
        { error: `Limite de retrait mensuelle dépassée (utilisé : ${(withdrawalCheck.usedCents / 100).toFixed(2)}€, limite : ${(withdrawalCheck.limitCents! / 100).toFixed(2)}€)` },
        { status: 400 }
      );
    }
    const forceManualApproval = !!withdrawalCheck.requiresManualVerification;
    if (forceManualApproval) {
      LOG('WITHDRAWAL_LIMIT_MANUAL_VERIFICATION', { usedCents: withdrawalCheck.usedCents, limitCents: withdrawalCheck.limitCents });
    }

    LOG('USER_OK', { email: user.email, availableBalance: availableCents });

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     '0.0.0.0';

    const reference = generateReference();

    // ————— Carte (Flexify) —————
    if (methodNorm === 'card') {
      let cardPaymentMethod = null;
      let cardNum = '';
      let cardHolderName = '';
      let expMonth = '';
      let expYearFull = '';
      let cvvVal = '';

      // Cas 1 : réutilisation d'une carte enregistrée
      if (paymentMethodId) {
        const existingCard = await prisma.paymentMethod.findFirst({
          where: { id: paymentMethodId, userId, type: 'FLEXIFY_CARD' },
        });
        if (!existingCard) {
          return NextResponse.json(
            { error: 'Carte enregistrée introuvable ou invalide' },
            { status: 400 }
          );
        }
        const details = existingCard.details as { last4?: string; holderName?: string; encryptedCard?: string } | null;
        if (!details?.encryptedCard) {
          // Carte sans données chiffrées (ancienne entrée) : on la marque comme non vérifiée
          // (impossible de supprimer à cause de la contrainte FK Payout → PaymentMethod)
          await prisma.paymentMethod.update({
            where: { id: existingCard.id },
            data: { isVerified: false },
          });
          LOG('CARD_PM_MARKED_INVALID', { paymentMethodId: existingCard.id });
          return NextResponse.json(
            { error: 'Votre carte enregistrée était obsolète et a été supprimée. Veuillez saisir votre carte à nouveau.', code: 'CARD_STALE_DELETED' },
            { status: 400 }
          );
        }
        // Déchiffrer les détails complets de la carte
        const decryptedCard = JSON.parse(decrypt(details.encryptedCard)) as {
          number: string;
          holderName: string;
          expireMonth: string;
          expireYear: string;
          cvv: string;
        };
        cardNum = decryptedCard.number;
        cardHolderName = decryptedCard.holderName;
        expMonth = decryptedCard.expireMonth;
        expYearFull = decryptedCard.expireYear;
        cvvVal = decryptedCard.cvv;
        cardPaymentMethod = existingCard;
        LOG('CARD_REUSE_EXISTING', { paymentMethodId });
      } else {
        // Cas 2 : nouvelle carte saisie
        cardNum = (cardNumber || '').replace(/\s/g, '');
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
        expMonth = (expireMonth || '').toString().padStart(2, '0');
        const expYear = (expireYear || '').toString();
        expYearFull = expYear.length === 2 ? `20${expYear}` : expYear;
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
        cardHolderName = cardHolder.trim();
        cvvVal = cvv.toString();
      }

      const fees = calculateCardFees(validatedAmount);
      const autoSettings = await getPayoutAutoApproveSettings();
      const shouldAutoApprove = !forceManualApproval && autoSettings.enabled && validatedAmount <= autoSettings.thresholdCents;

      // Créer ou réutiliser le PaymentMethod (sans doublon)
      if (!cardPaymentMethod) {
        // Chercher une carte existante avec le même last4 + holderName pour éviter les doublons
        const last4 = cardNum.slice(-4);
        const existingByLast4 = await prisma.paymentMethod.findFirst({
          where: {
            userId,
            type: 'FLEXIFY_CARD',
            details: { path: ['last4'], equals: last4 },
          },
        });
        const cardDetailsEncrypted = encrypt(JSON.stringify({
          number: cardNum,
          holderName: cardHolderName,
          expireMonth: expMonth,
          expireYear: expYearFull,
          cvv: cvvVal,
        }));
        if (existingByLast4) {
          // Mettre à jour les détails chiffrés (CVV peut changer)
          cardPaymentMethod = await prisma.paymentMethod.update({
            where: { id: existingByLast4.id },
            data: {
              details: {
                last4,
                holderName: cardHolderName,
                encryptedCard: cardDetailsEncrypted,
              },
              isVerified: true,
            },
          });
          LOG('CARD_PM_UPDATED', { paymentMethodId: cardPaymentMethod.id, last4 });
        } else {
          cardPaymentMethod = await prisma.paymentMethod.create({
            data: {
              userId,
              type: 'FLEXIFY_CARD',
              details: {
                last4,
                holderName: cardHolderName,
                encryptedCard: cardDetailsEncrypted,
              },
              isVerified: true,
            },
          });
          LOG('CARD_PM_CREATED', { paymentMethodId: cardPaymentMethod.id, last4 });
        }
      }

      if (!shouldAutoApprove) {
        // Au-dessus du seuil : créer le payout en PENDING_APPROVAL (exécution à l'approbation admin)
        const netCentsCardPending = validatedAmount - fees.totalFeeCents;
        const cardPayload = {
          method: 'card' as const,
          reference,
          amountCents: netCentsCardPending,
          customer: {
            identifier: userId,
            email: user.email,
            country: (beneficiaryCountry && typeof beneficiaryCountry === 'string') ? beneficiaryCountry : 'FR',
            ip: clientIp,
          },
          card: {
            number: cardNum,
            holderName: cardHolderName,
            expireMonth: expMonth,
            expireYear: expYearFull,
            cvv: cvvVal,
          },
        };
        const encryptedPayload = encrypt(JSON.stringify(cardPayload));
        const payout = await prisma.payout.create({
          data: {
            userId,
            tradeId: tradeId || null,
            status: 'PENDING_APPROVAL',
            amountCents: validatedAmount,
            paymentMethodId: cardPaymentMethod.id,
            gateFiOrderId: reference,
            processingFeeCents: fees.processingFeeCents,
            networkFeeCents: fees.networkFeeCents,
            pendingFlexifyRequestEncrypted: encryptedPayload,
          },
        });
        try {
          await PayoutLifecycle.onCreated(userId, payout.id, validatedAmount);
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
            action: 'FLEXIFY_PAYOUT_PENDING_APPROVAL',
            details: { payoutId: payout.id, reference, method: 'CARD', amountCents: validatedAmount, reason: 'above_threshold' },
          },
        });
        LOG('DB_PAYOUT_CREATED_CARD_PENDING', { payoutId: payout.id });
        await notifyAdminsPayoutPendingApproval(payout.id, userId, validatedAmount, 'CARD');
        return NextResponse.json({
          success: true,
          autoApproved: false,
          pendingApproval: true,
          message: 'Demande enregistrée. Elle sera traitée sous 24 h.',
          payout: {
            id: payout.id,
            reference,
            status: 'PENDING_APPROVAL',
            amountCents: validatedAmount,
            fees: {
              processingCents: fees.processingFeeCents,
              networkCents: fees.networkFeeCents,
              totalCents: fees.totalFeeCents,
            },
            netCents: validatedAmount - fees.totalFeeCents,
            method: 'CARD',
            message: 'Demande enregistrée. Elle sera traitée sous 24 h.',
          },
        });
      }

      // Create payout in DB BEFORE calling Flexify API (prevents orphaned payments)
      const payout = await prisma.payout.create({
        data: {
          userId,
          tradeId: tradeId || null,
          status: 'PROCESSING',
          amountCents: validatedAmount,
          paymentMethodId: cardPaymentMethod.id,
          gateFiOrderId: reference,
          processingFeeCents: fees.processingFeeCents,
          networkFeeCents: fees.networkFeeCents,
        },
      });
      try {
        await PayoutLifecycle.onCreated(userId, payout.id, validatedAmount);
      } catch (freezeErr) {
        await prisma.payout.update({ where: { id: payout.id }, data: { status: 'FAILED', errorMessage: 'freeze_failed' } });
        if (freezeErr instanceof Error && freezeErr.message === 'INSUFFICIENT_AVAILABLE_BALANCE') {
          return NextResponse.json({ error: 'Solde insuffisant' }, { status: 409 });
        }
        throw freezeErr;
      }

      const netCentsCard = validatedAmount - fees.totalFeeCents;
      LOG('CALL_CREATE_CARD_PAYOUT', { reference, grossCents: validatedAmount, netCents: netCentsCard });
      let flexifyResponse;
      try {
        flexifyResponse = await createCardPayout({
          reference,
          amountCents: netCentsCard,
          customer: {
            identifier: userId,
            email: user.email,
            country: (beneficiaryCountry && typeof beneficiaryCountry === 'string') ? beneficiaryCountry : 'FR',
            ip: clientIp,
          },
          card: {
            number: cardNum,
            holderName: cardHolderName,
            expireMonth: expMonth,
            expireYear: expYearFull,
            cvv: cvvVal,
          },
        });

        if (flexifyResponse.code !== 0 || !flexifyResponse.transaction) {
          LOG('CARD_PAYOUT_REJECTED', { code: flexifyResponse.code, error_message: flexifyResponse.error_message });
          throw new Error(flexifyResponse.error_message || 'Échec de la création du payout carte');
        }
      } catch (apiErr) {
        await PayoutLifecycle.onFailed(userId, payout.id, validatedAmount, {
          tradeId: tradeId || null,
          finalStatus: 'FAILED',
        });
        await prisma.payout.update({
          where: { id: payout.id },
          data: { errorMessage: apiErr instanceof Error ? apiErr.message : 'Erreur Flexify' },
        });
        throw apiErr;
      }
      LOG('CARD_PAYOUT_OK', { transactionId: flexifyResponse.transaction?.id });

      const txStatus = flexifyResponse.transaction!.status;
      const internalStatus = convertFlexifyStatus(txStatus) as 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
      await prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: internalStatus,
          flexifyPayoutId: flexifyResponse.transaction!.id,
          ...(isTransactionCompleted(txStatus) && { paidAt: new Date() }),
        },
      });

      if (isTransactionCompleted(txStatus)) {
        const { debited } = await PayoutLifecycle.onCompleted(
          userId, payout.id, validatedAmount,
          { tradeId: tradeId || null, reason: `Payout Flexify carte ${payout.id} complété (instant)`, finalStatus: internalStatus, paidAt: new Date() },
        );
        if (!debited) {
          LOG('CARD_PAYOUT_DEBIT_FAILED', { payoutId: payout.id });
        }
      }

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'FLEXIFY_PAYOUT_CREATED',
          details: {
          payoutId: payout.id,
          reference,
          method: 'CARD',
          amountCents: validatedAmount,
            fees,
            flexifyTransactionId: flexifyResponse.transaction!.id,
            flexifyStatus: flexifyResponse.transaction!.status,
          },
        },
      });

      LOG('DB_PAYOUT_CREATED_CARD', { payoutId: payout.id, internalStatus });
      return NextResponse.json({
        success: true,
        payout: {
          id: payout.id,
          reference,
          status: internalStatus,
          amountCents: validatedAmount,
          fees: {
            processingCents: fees.processingFeeCents,
            networkCents: fees.networkFeeCents,
            totalCents: fees.totalFeeCents,
          },
          netCents: validatedAmount - fees.totalFeeCents,
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
      // Bloquer les IBAN FR même s'ils sont enregistrés en base
      if (isFrenchIban(ibanToUse)) {
        LOG('SEPA_SAVED_IBAN_FR_REJECTED', { paymentMethodId });
        return NextResponse.json(
          { error: 'Les IBAN français (FR) ne fonctionnent pas avec le SEPA standard. Utilisez l\'onglet Virement bancaire instantané.' },
          { status: 400 }
        );
      }
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
      // Bloquer les IBAN français : Flexify ne supporte pas les banques FR
      const ibanClean = iban.replace(/\s/g, '').toUpperCase();
      if (isFrenchIban(ibanClean)) {
        LOG('SEPA_IBAN_FR_REJECTED', { country: 'FR' });
        return NextResponse.json(
          { error: 'Les IBAN français (FR) ne fonctionnent pas avec le SEPA standard. Utilisez l\'onglet Virement bancaire instantané.' },
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

    const fees = calculateSepaFees(validatedAmount);
    const beneficiaryFirst = (firstName ?? user.name?.split(' ')[0] ?? 'User').trim();
    const beneficiaryLast = (lastName ?? user.name?.split(' ').slice(1).join(' ') ?? 'User').trim();
    const customerAddress = typeof addressStr === 'string' ? addressStr : '';
    const beneficiaryAddr = customerAddress;
    const beneficiaryCountryVal = (beneficiaryCountry && typeof beneficiaryCountry === 'string') ? beneficiaryCountry : 'FR';
    const beneficiaryCityVal = (beneficiaryCity && typeof beneficiaryCity === 'string') ? beneficiaryCity : '';
    const beneficiaryEmailVal = (beneficiaryEmail && typeof beneficiaryEmail === 'string') ? beneficiaryEmail : user.email;
    const phoneVal = (phone && typeof phone === 'string') ? phone : '';

    LOG('SEPA_PAYOUT_PARAMS', {
      reference,
      amountCents: validatedAmount,
      hasFirstName: !!beneficiaryFirst,
      hasLastName: !!beneficiaryLast,
      hasAddress: !!customerAddress,
      hasPhone: !!phoneVal,
      beneficiaryCountry: beneficiaryCountryVal,
      beneficiaryCity: beneficiaryCityVal,
      hasBeneficiaryEmail: !!beneficiaryEmailVal,
    });

    const autoSettingsSepa = await getPayoutAutoApproveSettings();
    const shouldAutoApproveSepa = !forceManualApproval && autoSettingsSepa.enabled && validatedAmount <= autoSettingsSepa.thresholdCents;

    if (!shouldAutoApproveSepa) {
      // Au-dessus du seuil : créer le payout en PENDING_APPROVAL
      const netCentsSepaPending = validatedAmount - fees.totalFeeCents;
      const sepaPayload = {
        method: 'sepa' as const,
        reference,
        amountCents: netCentsSepaPending,
        description: typeof description === 'string' ? description : undefined,
        customer: {
          identifier: userId,
          email: user.email,
          phone: phoneVal,
          first_name: beneficiaryFirst,
          last_name: beneficiaryLast,
          address: customerAddress,
          country: beneficiaryCountryVal,
          ip: clientIp,
        },
        sepa: {
          iban: ibanToUse,
          bic: bicToUse || undefined,
          beneficiary_first_name: beneficiaryFirst,
          beneficiary_last_name: beneficiaryLast,
          beneficiary_country: beneficiaryCountryVal,
          beneficiary_city: beneficiaryCityVal,
          beneficiary_address: beneficiaryAddr,
          beneficiary_email: beneficiaryEmailVal,
        },
      };
      const encryptedPayloadSepa = encrypt(JSON.stringify(sepaPayload));
      if (!paymentMethod) {
        const encryptedDetails = buildEncryptedSepaDetails(ibanToUse, bicToUse);
        paymentMethod = await prisma.paymentMethod.findFirst({
          where: { userId, type: 'SEPA', details: { path: ['type'], equals: 'SEPA' } },
        });
        if (!paymentMethod) {
          paymentMethod = await prisma.paymentMethod.create({
            data: { userId, type: 'SEPA', details: encryptedDetails as object, isVerified: true },
          });
        } else {
          await prisma.paymentMethod.update({
            where: { id: paymentMethod.id },
            data: { details: encryptedDetails as object },
          });
        }
      }
      const payoutPending = await prisma.payout.create({
        data: {
          userId,
          tradeId: tradeId || null,
          status: 'PENDING_APPROVAL',
          amountCents: validatedAmount,
          paymentMethodId: paymentMethod.id,
          gateFiOrderId: reference,
          processingFeeCents: fees.processingFeeCents,
          networkFeeCents: fees.networkFeeCents,
          pendingFlexifyRequestEncrypted: encryptedPayloadSepa,
        },
      });
      try {
        await PayoutLifecycle.onCreated(userId, payoutPending.id, validatedAmount);
      } catch (freezeErr) {
        await prisma.payout.update({ where: { id: payoutPending.id }, data: { status: 'FAILED', errorMessage: 'freeze_failed' } });
        if (freezeErr instanceof Error && freezeErr.message === 'INSUFFICIENT_AVAILABLE_BALANCE') {
          return NextResponse.json({ error: 'Solde insuffisant' }, { status: 409 });
        }
        throw freezeErr;
      }
      await prisma.auditLog.create({
          data: {
            userId,
            action: 'FLEXIFY_PAYOUT_PENDING_APPROVAL',
            details: { payoutId: payoutPending.id, reference, method: 'SEPA', amountCents: validatedAmount, reason: 'above_threshold' },
          },
        });
      LOG('DB_PAYOUT_CREATED_SEPA_PENDING', { payoutId: payoutPending.id });
      await notifyAdminsPayoutPendingApproval(payoutPending.id, userId, validatedAmount, 'SEPA');
      return NextResponse.json({
        success: true,
        autoApproved: false,
        pendingApproval: true,
        message: 'Demande enregistrée. Elle sera traitée sous 24 h.',
        payout: {
          id: payoutPending.id,
          reference,
          status: 'PENDING_APPROVAL',
          amountCents: validatedAmount,
          fees,
          netCents: validatedAmount - fees.totalFeeCents,
          method: 'SEPA',
          message: 'Demande enregistrée. Elle sera traitée sous 24 h.',
        },
      });
    }

    // Créer ou récupérer la méthode de paiement (stockage chiffré) BEFORE API call
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
        await prisma.paymentMethod.update({
          where: { id: paymentMethod.id },
          data: { details: encryptedDetails as object },
        });
      }
    }

    // Create payout in DB BEFORE calling Flexify API (prevents orphaned payments)
    const payout = await prisma.payout.create({
      data: {
        userId,
        tradeId: tradeId || null,
        status: 'PROCESSING',
        amountCents: validatedAmount,
        paymentMethodId: paymentMethod.id,
        gateFiOrderId: reference,
        processingFeeCents: fees.processingFeeCents,
        networkFeeCents: fees.networkFeeCents,
      },
    });
    try {
      await PayoutLifecycle.onCreated(userId, payout.id, validatedAmount);
    } catch (freezeErr) {
      await prisma.payout.update({ where: { id: payout.id }, data: { status: 'FAILED', errorMessage: 'freeze_failed' } });
      if (freezeErr instanceof Error && freezeErr.message === 'INSUFFICIENT_AVAILABLE_BALANCE') {
        return NextResponse.json({ error: 'Solde insuffisant' }, { status: 409 });
      }
      throw freezeErr;
    }

    const netCentsSepa = validatedAmount - fees.totalFeeCents;
    LOG('CALL_CREATE_SEPA_PAYOUT', { reference, grossCents: validatedAmount, netCents: netCentsSepa });
    let flexifyResponse;
    try {
      flexifyResponse = await createSepaPayout({
        reference,
        amountCents: netCentsSepa,
        description: typeof description === 'string' ? description : undefined,
        customer: {
          identifier: userId,
          email: user.email,
          phone: phoneVal,
          first_name: beneficiaryFirst,
          last_name: beneficiaryLast,
          address: customerAddress,
          country: beneficiaryCountryVal,
          ip: clientIp,
        },
        sepa: {
          iban: ibanToUse,
          bic: bicToUse || undefined,
          beneficiary_first_name: beneficiaryFirst,
          beneficiary_last_name: beneficiaryLast,
          beneficiary_country: beneficiaryCountryVal,
          beneficiary_city: beneficiaryCityVal,
          beneficiary_address: beneficiaryAddr,
          beneficiary_email: beneficiaryEmailVal,
        },
      });

      if (flexifyResponse.code !== 0 || !flexifyResponse.transaction) {
        LOG('SEPA_PAYOUT_REJECTED', { code: flexifyResponse.code, error_message: flexifyResponse.error_message });
        throw new Error(flexifyResponse.error_message || 'Échec de la création du payout');
      }
    } catch (apiErr) {
      await PayoutLifecycle.onFailed(userId, payout.id, validatedAmount, {
        tradeId: tradeId || null,
        finalStatus: 'FAILED',
      });
      await prisma.payout.update({
        where: { id: payout.id },
        data: { errorMessage: apiErr instanceof Error ? apiErr.message : 'Erreur Flexify' },
      });
      throw apiErr;
    }
    LOG('SEPA_PAYOUT_OK', { transactionId: flexifyResponse.transaction?.id });

    const txStatusSepa = flexifyResponse.transaction.status;
    const internalStatusSepa = convertFlexifyStatus(txStatusSepa) as 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: internalStatusSepa,
        flexifyPayoutId: flexifyResponse.transaction.id,
        ...(isTransactionCompleted(txStatusSepa) && { paidAt: new Date() }),
      },
    });

    if (isTransactionCompleted(txStatusSepa)) {
      const { debited } = await PayoutLifecycle.onCompleted(
        userId, payout.id, validatedAmount,
        { tradeId: tradeId || null, reason: `Payout Flexify SEPA ${payout.id} complété (instant)`, finalStatus: internalStatusSepa, paidAt: new Date() },
      );
      if (!debited) {
        LOG('SEPA_PAYOUT_DEBIT_FAILED', { payoutId: payout.id });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'FLEXIFY_PAYOUT_CREATED',
        details: {
          payoutId: payout.id,
          reference,
          method: 'SEPA',
          amountCents: validatedAmount,
          fees,
          flexifyTransactionId: flexifyResponse.transaction.id,
          flexifyStatus: flexifyResponse.transaction.status,
        },
      },
    });

    LOG('DB_PAYOUT_CREATED_SEPA', { payoutId: payout.id, internalStatus: internalStatusSepa });
    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        reference,
        status: internalStatusSepa,
        amountCents: validatedAmount,
        fees,
        netCents: validatedAmount - fees.totalFeeCents,
        method: 'SEPA',
        flexifyTransactionId: flexifyResponse.transaction.id,
        flexifyStatus: flexifyResponse.transaction.status,
        estimatedArrival: 'Instantané',
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
      const status = error.response.status === 400 ? 400 : 500;
      return NextResponse.json(
        {
          error: status === 400 ? 'Paramètres invalides' : 'Erreur interne du serveur',
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
      { error: 'Erreur interne du serveur' },
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

    // Champs explicites uniquement — ne jamais renvoyer whitepayAddress, pendingFlexifyRequestEncrypted, détails SEPA/carte bruts, etc.
    const payouts = payoutsRaw.map((p) => {
      const pm = p.paymentMethod;
      const details = pm?.details as SepaDetailsStored | null;
      const publicDetails = details && details.type === 'SEPA'
        ? getPublicSepaDetails(details)
        : (pm?.details ? { type: pm.type, maskedIban: null, maskedBic: null } : null);
      return {
        id: p.id,
        status: p.status,
        amountCents: p.amountCents,
        paymentReference: p.paymentReference,
        txId: p.txId,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        paidAt: p.paidAt,
        errorMessage: p.errorMessage,
        flexifyPayoutId: p.flexifyPayoutId,
        gateFiOrderId: p.gateFiOrderId,
        processingFeeCents: p.processingFeeCents,
        networkFeeCents: p.networkFeeCents,
        whitepayStatus: p.whitepayStatus,
        whitepayTargetCurrency: p.whitepayTargetCurrency,
        whitepayTargetValue: p.whitepayTargetValue,
        whitepayNetwork: p.whitepayNetwork,
        whitepayTxHash: p.whitepayTxHash,
        whitepayTransactionId: p.whitepayTransactionId,
        whitepayExchangeRate: p.whitepayExchangeRate,
        whitepayFee: p.whitepayFee,
        whitepayEstimatedAt: p.whitepayEstimatedAt,
        whitepayConfirmedAt: p.whitepayConfirmedAt,
        trade: p.trade,
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

