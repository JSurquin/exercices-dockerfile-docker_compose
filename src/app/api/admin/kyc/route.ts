import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { KycStatus } from '@prisma/client';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

/**
 * GET /api/admin/kyc
 *
 * Retourne UN utilisateur par ligne (pas un document par ligne).
 * Le statut affiché est User.kycStatus — la source de vérité.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    // Filtrer par kycStatus (source de vérité : User.kycStatus)
    if (status) {
      const s = status.toUpperCase();
      if (s === 'PENDING') {
        where.kycStatus = { in: [KycStatus.PENDING, KycStatus.KYCAID_PENDING, KycStatus.IN_PROGRESS] };
      } else if (s === 'VERIFIED' || s === 'APPROVED') {
        where.kycStatus = { in: [KycStatus.VERIFIED, KycStatus.KYCAID_VERIFIED] };
      } else if (s === 'REJECTED') {
        where.kycStatus = { in: [KycStatus.REJECTED, KycStatus.KYCAID_REJECTED] };
      }
    } else {
      // Par défaut : uniquement les users qui ont au moins soumis un KYC
      where.OR = [
        { kycaidApplicantId: { not: null } },
        { kycDocuments: { some: {} } },
        { kycVerifications: { some: {} } },
        { kycStatus: { not: KycStatus.PENDING } },
      ];
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { steamUsername: { contains: search, mode: 'insensitive' } },
            { steamId: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          steamId: true,
          steamUsername: true,
          steamAvatar: true,
          kycStatus: true,
          kycaidApplicantId: true,
          createdAt: true,
          kycVerifications: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              kycaidVerificationId: true,
              status: true,
              verified: true,
              createdAt: true,
              completedAt: true,
              declineReasons: true,
            },
          },
          kycDocuments: {
            orderBy: { uploadedAt: 'desc' },
            take: 1,
            select: {
              id: true,
              type: true,
              status: true,
              uploadedAt: true,
              reviewedAt: true,
              rejectionReason: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const result = users.map((u) => ({
      userId: u.id,
      steamUsername: u.steamUsername,
      steamId: u.steamId,
      steamAvatar: u.steamAvatar,
      name: u.name,
      email: u.email,
      kycStatus: u.kycStatus,           // ← source de vérité
      kycaidApplicantId: u.kycaidApplicantId,
      createdAt: u.createdAt,
      latestVerification: u.kycVerifications[0] ?? null,
      latestDocument: u.kycDocuments[0] ?? null,
    }));

    return NextResponse.json({ users: result, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('[admin/kyc GET]', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
