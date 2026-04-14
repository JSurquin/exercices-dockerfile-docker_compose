import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { decrypt } from '@/lib/encryption';
import { getPublicSepaDetails } from '@/lib/payment-method-sepa';
import type { SepaDetailsStored } from '@/lib/payment-method-sepa';

function maskIbanForAdmin(iban: string): string {
  if (!iban || iban.length < 8) return '****';
  return iban.slice(0, 4) + ' **** **** ' + iban.slice(-4);
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {
      // SEPA FR requests are PENDING_APPROVAL payouts with a gateFiOrderId starting with MOON-SEPA-FR
      gateFiOrderId: { startsWith: 'MOON-SEPA-FR' },
    };

    if (status && status !== 'all') {
      if (status === 'pending') where.status = 'PENDING_APPROVAL';
      else if (status === 'approved') where.status = 'PAID';
      else if (status === 'rejected') where.status = 'CANCELLED';
    }

    const [payoutsRaw, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, steamUsername: true, steamAvatar: true },
          },
          paymentMethod: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payout.count({ where }),
    ]);

    const requests = payoutsRaw.map((p) => {
      let beneficiaryInfo: {
        iban: string;
        bic: string;
        firstName: string;
        lastName: string;
        userEmail: string;
      } | null = null;

      if (p.pendingFlexifyRequestEncrypted) {
        try {
          beneficiaryInfo = JSON.parse(decrypt(p.pendingFlexifyRequestEncrypted));
        } catch {
          // ignore decrypt errors
        }
      }

      // Fallback: try payment method details
      if (!beneficiaryInfo) {
        const details = p.paymentMethod?.details as SepaDetailsStored | null;
        if (details) {
          const pub = getPublicSepaDetails(details);
          if (pub) {
            beneficiaryInfo = {
              iban: pub.maskedIban,
              bic: pub.maskedBic,
              firstName: '',
              lastName: '',
              userEmail: p.user?.email ?? '',
            };
          }
        }
      }

      return {
        id: p.id,
        reference: p.gateFiOrderId,
        status: p.status,
        amountCents: p.amountCents,
        netCents: p.amountCents - (p.processingFeeCents ?? 0) - (p.networkFeeCents ?? 0),
        createdAt: p.createdAt,
        paidAt: p.paidAt,
        errorMessage: p.errorMessage,
        user: p.user,
        beneficiary: beneficiaryInfo
          ? {
              maskedIban: maskIbanForAdmin(beneficiaryInfo.iban),
              fullIban: beneficiaryInfo.iban,
              bic: beneficiaryInfo.bic,
              firstName: beneficiaryInfo.firstName,
              lastName: beneficiaryInfo.lastName,
              email: beneficiaryInfo.userEmail,
            }
          : null,
      };
    });

    return NextResponse.json({ requests, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('[ADMIN SEPA FR] GET error', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
