import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { decrypt } from '@/lib/encryption';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { MERCHANT_WITHDRAW_PREFIX, type MerchantWithdrawDetails } from '@/lib/merchant-withdraw';

function maskIbanForAdmin(iban: string): string {
  if (!iban || iban.length < 8) return '****';
  return iban.slice(0, 4) + ' **** **** ' + iban.slice(-4);
}

function maskAddressForAdmin(address: string): string {
  if (address.length <= 12) return '****';
  return address.slice(0, 6) + '...' + address.slice(-4);
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const subtype = searchParams.get('subtype') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {
      gateFiOrderId: { startsWith: MERCHANT_WITHDRAW_PREFIX },
    };

    if (status && status !== 'all') {
      if (status === 'pending') where.status = 'PENDING_APPROVAL';
      else if (status === 'processing') where.status = 'PROCESSING';
      else if (status === 'paid') where.status = 'PAID';
      else if (status === 'rejected') where.status = 'CANCELLED';
    }

    const [payoutsRaw, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, steamUsername: true, steamAvatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payout.count({ where }),
    ]);

    const requests = payoutsRaw
      .map((p) => {
        let details: MerchantWithdrawDetails | null = null;
        if (p.pendingFlexifyRequestEncrypted) {
          try {
            details = JSON.parse(decrypt(p.pendingFlexifyRequestEncrypted)) as MerchantWithdrawDetails;
          } catch {
            // ignore
          }
        }

        if (subtype && details?.subtype !== subtype) {
          return null;
        }

        const processingFeeCents = p.processingFeeCents ?? 0;
        const networkFeeCents = p.networkFeeCents ?? 0;

        return {
          id: p.id,
          reference: p.gateFiOrderId,
          status: p.status,
          amountCents: p.amountCents,
          processingFeeCents,
          networkFeeCents,
          netCents: p.amountCents - processingFeeCents - networkFeeCents,
          createdAt: p.createdAt,
          paidAt: p.paidAt,
          errorMessage: p.errorMessage,
          paymentReference: p.paymentReference,
          user: p.user,
          subtype: details?.subtype ?? null,
          coordinates:
            details?.subtype === 'bank'
              ? {
                  subtype: 'bank' as const,
                  accountHolder: details.accountHolder,
                  fullIban: details.iban,
                  maskedIban: maskIbanForAdmin(details.iban),
                  bic: details.bic,
                  country: details.country,
                }
              : details?.subtype === 'crypto'
                ? {
                    subtype: 'crypto' as const,
                    asset: details.asset,
                    network: details.network,
                    fullAddress: details.address,
                    maskedAddress: maskAddressForAdmin(details.address),
                    memo: details.memo ?? null,
                  }
                : null,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      requests,
      total: subtype ? requests.length : total,
      page,
      limit,
      totalPages: Math.ceil((subtype ? requests.length : total) / limit),
    });
  } catch (error) {
    console.error('[ADMIN MERCHANT WITHDRAW] GET error', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
