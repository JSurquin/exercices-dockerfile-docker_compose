import { NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '~/prisma/prisma';
import { getPublicSepaDetails } from '@/lib/payment-method-sepa';
import type { SepaDetailsStored } from '@/lib/payment-method-sepa';

/**
 * GET /api/payment-methods
 * Liste les moyens de paiement de l'utilisateur (détails masqués uniquement).
 */
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const methods = await prisma.paymentMethod.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
  });

  const publicList = methods.map((m) => {
    const details = m.details as SepaDetailsStored | null;
    const publicDetails =
      details?.type === 'SEPA' ? getPublicSepaDetails(details) : null;
    return {
      id: m.id,
      type: m.type,
      isVerified: m.isVerified,
      isDefault: m.isDefault,
      maskedIban: publicDetails?.maskedIban ?? null,
      maskedBic: publicDetails?.maskedBic ?? null,
    };
  });

  return NextResponse.json({ paymentMethods: publicList });
}
