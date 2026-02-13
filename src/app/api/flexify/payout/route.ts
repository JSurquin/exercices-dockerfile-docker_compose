import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '~/prisma/prisma';
import {
  createSepaPayout,
  calculateSepaFees,
  getPayoutLimits,
  validateIban,
  validateBic,
  centsToEur,
  type FlexifyPayoutResponse,
} from '@/lib/flexify';
import { canUserMakePayout } from '@/lib/kycaid';
import crypto from 'crypto';

// Helper to generate reference ID
const generateReference = () => `MOON-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

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
      method, // 'SEPA' (cette route ne gère que le SEPA — la crypto passe par /api/whitepay/withdrawal)
      amountCents,
      tradeId,
      // Données SEPA
      iban,
      bic,
      // Données communes
      firstName,
      lastName,
      address,
    } = body;

    // Cette route ne gère que le SEPA — la crypto passe par /api/whitepay/withdrawal
    if (method !== 'SEPA' && method !== 'sepa') {
      return NextResponse.json(
        { error: 'Cette route ne gère que les paiements SEPA. Utilisez /api/whitepay/withdrawal pour la crypto.' },
        { status: 400 }
      );
    }

    // Validation du montant
    if (!amountCents || amountCents <= 0) {
      return NextResponse.json(
        { error: 'Montant invalide' },
        { status: 400 }
      );
    }

    // Vérifier les limites
    const limits = getPayoutLimits('sepa');
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

    // Récupérer l'IP du client
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     '0.0.0.0';

    // Validation selon la méthode
    const reference = generateReference();

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

    const fees = calculateSepaFees(amountCents);
    const paymentMethodDetails: Record<string, unknown> = {
      type: 'SEPA',
      iban: iban.replace(/\s/g, '').toUpperCase(),
      bic: bic?.replace(/\s/g, '').toUpperCase(),
    };

    // Créer le payout SEPA selon la spec V1
    const holderName = `${firstName || user.name?.split(' ')[0] || 'User'} ${lastName || user.name?.split(' ').slice(1).join(' ') || 'User'}`.trim();
    
    const flexifyResponse = await createSepaPayout({
      reference,
      amountCents,
      customer: {
        identifier: userId,
        email: user.email,
        country: address?.country || 'FR', // Default FR si pas fourni
        ip: clientIp,
      },
      sepa: {
        iban: iban.replace(/\s/g, '').toUpperCase(),
        bic: bic?.replace(/\s/g, '').toUpperCase(),
        holderName,
      },
    });

    // Vérifier la réponse Flexify
    if (flexifyResponse.code !== 0 || !flexifyResponse.transaction) {
      throw new Error(flexifyResponse.error_message || 'Échec de la création du payout');
    }

    // Créer ou récupérer la méthode de paiement
    let paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        userId,
        type: 'SEPA',
        details: {
          path: ['type'],
          equals: 'SEPA',
        },
      },
    });

    if (!paymentMethod) {
      paymentMethod = await prisma.paymentMethod.create({
        data: {
          userId,
          type: 'SEPA',
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

