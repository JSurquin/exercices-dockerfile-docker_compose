import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { createAddress } from '@/lib/kycaid';
import { prisma } from '~/prisma/prisma';
import { safeParseJson } from '@/lib/validation/helpers';
import { kycaidAddressBodySchema } from '@/lib/validation/schemas/integrations';
import { encrypt, decrypt } from '@/lib/encryption';

/**
 * POST /api/kycaid/address
 * Soumet l'adresse de l'utilisateur pour le KYC
 */
export async function POST(request: NextRequest) {
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
    const raw = await request.json();
    const parsed = safeParseJson(raw, kycaidAddressBodySchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const { country, city, postalCode, streetName, buildingNumber, unitNumber } = parsed.data;

    if (!country || !city || !postalCode || !streetName || !buildingNumber) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    // Récupérer l'applicantId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { kycaidApplicantId: true },
    });

    if (!user?.kycaidApplicantId) {
      return NextResponse.json(
        { error: 'Applicant KYCAID non trouvé. Initiez d\'abord le KYC.' },
        { status: 400 }
      );
    }

    // Créer l'adresse via KYCAID
    const address = await createAddress({
      applicant_id: user.kycaidApplicantId,
      type: 'REGISTERED',
      country,
      city,
      postal_code: postalCode,
      street_name: streetName,
      building_number: buildingNumber,
      unit_number: unitNumber,
    });

    // Sauvegarder en base (champs sensibles chiffrés)
    const savedAddress = await prisma.kycAddress.create({
      data: {
        applicantId: user.kycaidApplicantId,
        type: 'REGISTERED',
        country,
        city: encrypt(city),
        postalCode: encrypt(postalCode),
        streetName: encrypt(streetName),
        buildingNumber: encrypt(buildingNumber),
        unitNumber: unitNumber ? encrypt(unitNumber) : null,
        kycaidAddressId: address.address_id,
      },
    });

    return NextResponse.json({
      success: true,
      address: savedAddress,
    });
  } catch (error) {
    console.error('[KYCAID Address] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'adresse' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/kycaid/address
 * Récupère l'adresse de l'utilisateur
 */
export async function GET() {
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { kycaidApplicantId: true },
    });

    if (!user?.kycaidApplicantId) {
      return NextResponse.json({ address: null });
    }

    const address = await prisma.kycAddress.findFirst({
      where: {
        applicantId: user.kycaidApplicantId,
        type: 'REGISTERED',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!address) {
      return NextResponse.json({ address: null });
    }

    const safeDecrypt = (val: string | null) => {
      if (!val) return val;
      try { return decrypt(val); } catch { return val; }
    };

    return NextResponse.json({
      address: {
        ...address,
        city: safeDecrypt(address.city),
        postalCode: safeDecrypt(address.postalCode),
        streetName: safeDecrypt(address.streetName),
        buildingNumber: safeDecrypt(address.buildingNumber),
        unitNumber: safeDecrypt(address.unitNumber),
      },
    });
  } catch (error) {
    console.error('[KYCAID Address GET] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'adresse' },
      { status: 500 }
    );
  }
}
