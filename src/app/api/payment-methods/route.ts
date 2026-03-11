import { NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '~/prisma/prisma';
import { getPublicSepaDetails } from '@/lib/payment-method-sepa';
import type { SepaDetailsStored } from '@/lib/payment-method-sepa';

function maskWalletAddress(address: string): string {
  if (!address || address.length < 12) return '••••';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * GET /api/payment-methods
 * Liste les moyens de paiement de l'utilisateur (détails masqués uniquement).
 * Retourne SEPA (maskedIban, maskedBic), FLEXIFY_CARD (last4, holderName), WHITEPAY_CRYPTO (maskedAddress, network, targetCurrency).
 */
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const methods = await prisma.paymentMethod.findMany({
    where: { userId: session.user.id, isVerified: true },
    orderBy: { updatedAt: 'desc' },
  });

  const publicList = methods.map((m) => {
    const details = m.details as Record<string, unknown> | null;
    if (m.type === 'SEPA' || m.type === 'FLEXIFY_SEPA') {
      const sepaDetails = m.details as SepaDetailsStored | null;
      const publicDetails =
        sepaDetails?.type === 'SEPA' ? getPublicSepaDetails(sepaDetails) : null;
      return {
        id: m.id,
        type: m.type,
        isVerified: m.isVerified,
        isDefault: m.isDefault,
        maskedIban: publicDetails?.maskedIban ?? null,
        maskedBic: publicDetails?.maskedBic ?? null,
        last4: null,
        holderName: null,
        maskedAddress: null,
        address: null,
        network: null,
        targetCurrency: null,
        memo: null,
      };
    }
    if (m.type === 'FLEXIFY_CARD' || m.type === 'CARD') {
      const last4 = typeof details?.last4 === 'string' ? details.last4 : null;
      const holderName = typeof details?.holderName === 'string' ? details.holderName : null;
      return {
        id: m.id,
        type: m.type,
        isVerified: m.isVerified,
        isDefault: m.isDefault,
        maskedIban: null,
        maskedBic: null,
        last4,
        holderName,
        maskedAddress: null,
        address: null,
        network: null,
        targetCurrency: null,
        memo: null,
      };
    }
    if (m.type === 'WHITEPAY_CRYPTO' || m.type === 'CRYPTO') {
      const address = typeof details?.address === 'string' ? details.address : '';
      const network = typeof details?.network === 'string' ? details.network : null;
      const targetCurrency = typeof details?.targetCurrency === 'string' ? details.targetCurrency : null;
      const memo = typeof details?.memo === 'string' ? details.memo : null;
      return {
        id: m.id,
        type: m.type,
        isVerified: m.isVerified,
        isDefault: m.isDefault,
        maskedIban: null,
        maskedBic: null,
        last4: null,
        holderName: null,
        maskedAddress: maskWalletAddress(address),
        address,
        network,
        targetCurrency,
        memo,
      };
    }
    return {
      id: m.id,
      type: m.type,
      isVerified: m.isVerified,
      isDefault: m.isDefault,
      maskedIban: null,
      maskedBic: null,
      last4: null,
      holderName: null,
      maskedAddress: null,
      address: null,
      network: null,
      targetCurrency: null,
      memo: null,
    };
  });

  return NextResponse.json({ paymentMethods: publicList });
}
