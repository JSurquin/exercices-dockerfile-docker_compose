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
  validateCardNumber,
  centsToEur,
  type FlexifyPayoutResponse,
} from '@/lib/flexify';
import { canUserMakePayout } from '@/lib/kycaid';
import crypto from 'crypto';

// Helper to generate UUID
const generateUUID = () => crypto.randomUUID();

// =============================================================================
// POST - Créer un nouveau payout
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Vérifier le KYC
    const kycCheck = await canUserMakePayout(userId);
    if (!kycCheck.allowed) {
      return NextResponse.json(
        { error: kycCheck.reason, code: 'KYC_REQUIRED' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      method, // 'SEPA' | 'CARD'
      amountCents,
      tradeId,
      // Données SEPA
      iban,
      bic,
      // Données Carte
      cardNumber,
      cardHolderName,
      expiryMonth,
      expiryYear,
      // Données communes
      firstName,
      lastName,
      address,
    } = body;

    // Validation du montant
    if (!amountCents || amountCents <= 0) {
      return NextResponse.json(
        { error: 'Montant invalide' },
        { status: 400 }
      );
    }

    // Vérifier les limites
    const limits = getPayoutLimits(method);
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

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user?.email) {
      return NextResponse.json(
        { error: 'Email utilisateur requis' },
        { status: 400 }
      );
    }

    // Validation selon la méthode
    let flexifyResponse: FlexifyPayoutResponse;
    const orderId = `PAYOUT-${generateUUID()}`;
    let paymentMethodDetails: Record<string, unknown>;
    let fees: { processingFeeCents: number; networkFeeCents: number; totalFeeCents: number };

    if (method === 'SEPA') {
      // Validation IBAN
      if (!iban) {
        return NextResponse.json(
          { error: 'IBAN requis pour un paiement SEPA' },
          { status: 400 }
        );
      }

      const ibanValidation = validateIban(iban);
      if (!ibanValidation.isValid) {
        return NextResponse.json(
          { error: ibanValidation.error },
          { status: 400 }
        );
      }

      // Validation BIC (optionnel mais recommandé)
      if (bic) {
        const bicValidation = validateBic(bic);
        if (!bicValidation.isValid) {
          return NextResponse.json(
            { error: bicValidation.error },
            { status: 400 }
          );
        }
      }

      fees = calculateSepaFees(amountCents);
      paymentMethodDetails = {
        type: 'SEPA',
        iban: iban.replace(/\s/g, '').toUpperCase(),
        bic: bic?.replace(/\s/g, '').toUpperCase(),
      };

      // Créer le payout SEPA
      flexifyResponse = await createSepaPayout({
        orderId,
        amountCents,
        beneficiary: {
          firstName: firstName || user.name?.split(' ')[0] || 'User',
          lastName: lastName || user.name?.split(' ').slice(1).join(' ') || 'User',
          email: user.email,
          iban: iban.replace(/\s/g, '').toUpperCase(),
          bic: bic?.replace(/\s/g, '').toUpperCase(),
          address,
        },
        metadata: {
          userId,
          tradeId: tradeId || '',
        },
      });
    } else if (method === 'CARD') {
      // Validation carte
      if (!cardNumber || !cardHolderName || !expiryMonth || !expiryYear) {
        return NextResponse.json(
          { error: 'Informations de carte incomplètes' },
          { status: 400 }
        );
      }

      const cardValidation = validateCardNumber(cardNumber);
      if (!cardValidation.isValid) {
        return NextResponse.json(
          { error: cardValidation.error },
          { status: 400 }
        );
      }

      fees = calculateCardFees(amountCents);
      paymentMethodDetails = {
        type: 'CARD',
        lastFourDigits: cardNumber.slice(-4),
        cardHolderName,
      };

      // Créer le payout Carte
      flexifyResponse = await createCardPayout({
        orderId,
        amountCents,
        beneficiary: {
          firstName: firstName || user.name?.split(' ')[0] || 'User',
          lastName: lastName || user.name?.split(' ').slice(1).join(' ') || 'User',
          email: user.email,
          cardNumber: cardNumber.replace(/\s|-/g, ''),
          cardHolderName,
          expiryMonth,
          expiryYear,
        },
        metadata: {
          userId,
          tradeId: tradeId || '',
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Méthode de paiement non supportée' },
        { status: 400 }
      );
    }

    // Créer ou récupérer la méthode de paiement
    let paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        userId,
        type: method,
        details: {
          path: ['type'],
          equals: method,
        },
      },
    });

    if (!paymentMethod) {
      paymentMethod = await prisma.paymentMethod.create({
        data: {
          userId,
          type: method,
          details: paymentMethodDetails as object,
          isVerified: true, // Vérifié car le payout a été accepté
        },
      });
    }

    // Créer le payout en base
    const payout = await prisma.payout.create({
      data: {
        userId,
        tradeId: tradeId || null,
        status: 'PENDING',
        amountCents,
        paymentMethodId: paymentMethod.id,
        gateFiOrderId: orderId, // Réutilisation du champ pour Flexify
      },
    });

    // Logger l'événement
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PAYOUT_CREATED',
        details: {
          payoutId: payout.id,
          orderId,
          method,
          amountCents,
          fees,
          flexifyId: flexifyResponse.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        orderId,
        status: payout.status,
        amountCents,
        fees,
        netCents: amountCents - fees.totalFeeCents,
        method,
        flexifyId: flexifyResponse.id,
        estimatedArrival: flexifyResponse.estimatedArrival,
      },
    });
  } catch (error) {
    console.error('[Flexify Payout] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du payout' },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - Récupérer les payouts de l'utilisateur
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = { userId };
    if (status) {
      where.status = status;
    }

    const [payouts, total] = await Promise.all([
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

    return NextResponse.json({
      payouts,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[Flexify Payout] Error fetching payouts:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des payouts' },
      { status: 500 }
    );
  }
}

