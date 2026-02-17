import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { getRequestContext, logUnauthorizedAccess } from '@/lib/security/audit-helpers';
import { prisma } from '~/prisma/prisma';
import { createApplicant } from '@/lib/kycaid';

/**
 * POST /api/admin/kyc/reset-applicant/[userId]
 *
 * Crée un nouvel applicant KYCAID pour l'utilisateur, met à jour User.kycaidApplicantId,
 * supprime les documents/vérifications/adresses liés à l'ancien applicant en BDD.
 * Permet de contourner la limite "un seul document identité par applicant" côté KYCAID
 * quand on ne peut pas réinitialiser l'applicant côté KYCAID.
 *
 * Body (optionnel): { firstName?, lastName?, dob?, residenceCountry? }
 * Si absent : firstName/lastName dérivés de User.name, country depuis dernière KycAddress ou "FR", dob "1990-01-01".
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const context = getRequestContext(request);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user || session.user.role !== 'ADMIN') {
    await logUnauthorizedAccess(context, '/api/admin/kyc/reset-applicant/[userId]', 'Admin required');
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: 'userId requis' }, { status: 400 });
  }

  let body: { firstName?: string; lastName?: string; dob?: string; residenceCountry?: string } = {};
  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = (await request.json()) as typeof body;
    }
  } catch {
    // body reste {}
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        kycaidApplicantId: true,
        kycStatus: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const oldApplicantId = user.kycaidApplicantId;

    // Dériver first/last name depuis User.name si non fournis
    let firstName = body.firstName;
    let lastName = body.lastName;
    if ((!firstName || !lastName) && user.name?.trim()) {
      const parts = user.name.trim().split(/\s+/);
      if (parts.length >= 2) {
        firstName = firstName ?? parts[0]!;
        lastName = lastName ?? parts.slice(1).join(' ');
      } else {
        firstName = firstName ?? parts[0] ?? 'User';
        lastName = lastName ?? 'Unknown';
      }
    }
    firstName = firstName ?? 'User';
    lastName = lastName ?? 'Unknown';

    let residenceCountry = body.residenceCountry;
    if (!residenceCountry && oldApplicantId) {
      const lastAddress = await prisma.kycAddress.findFirst({
        where: { applicantId: oldApplicantId },
        orderBy: { id: 'desc' },
        select: { country: true },
      });
      if (lastAddress?.country) residenceCountry = lastAddress.country;
    }
    residenceCountry = residenceCountry ?? 'FR';

    const dob = body.dob ?? '1990-01-01';

    const newApplicant = await createApplicant({
      userId: user.id,
      email: user.email,
      firstName,
      lastName,
      dob,
      residenceCountry,
    });
    const newApplicantId = newApplicant.applicant_id;

    // Supprimer les données liées à l'ancien applicant (avant de mettre à jour l'user)
    if (oldApplicantId) {
      await prisma.kycAddress.deleteMany({ where: { applicantId: oldApplicantId } });
    }
    await prisma.kycDocument.deleteMany({ where: { userId: user.id } });
    await prisma.kycVerification.deleteMany({ where: { userId: user.id } });

    await prisma.user.update({
      where: { id: userId },
      data: {
        kycaidApplicantId: newApplicantId,
        kycStatus: 'PENDING',
      },
    });

    console.log(
      `[KYC RESET] User ${userId}: old applicant ${oldApplicantId ?? 'none'} -> new applicant ${newApplicantId}`
    );

    return NextResponse.json({
      success: true,
      previousApplicantId: oldApplicantId ?? null,
      newApplicantId,
      message: "Applicant réinitialisé ; l'utilisateur peut repasser le KYC.",
    });
  } catch (err) {
    console.error('[admin/kyc/reset-applicant]', err);
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
