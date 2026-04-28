import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { headers } from 'next/headers';
import { AffiliateService } from '@/lib/affiliate-service';
import { AuditLogger, AuditAction } from '@/lib/security/audit-logger';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { safeParseJson } from '@/lib/validation/helpers';
import { adminPromoteAffiliateBodySchema } from '@/lib/validation/schemas/admin-bodies';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { userId } = await params;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId requis' },
        { status: 400 }
      );
    }

    const raw = await request.json().catch(() => ({}));
    const parsed = safeParseJson(raw, adminPromoteAffiliateBodySchema, { errorStyle: 'successFalse' });
    if (!parsed.ok) {
      return parsed.response;
    }
    const { commissionRate = 2, code } = parsed.data;

    const commissionRateDecimal = commissionRate / 100;
    if (commissionRateDecimal < 0 || commissionRateDecimal > 1) {
      return NextResponse.json(
        { success: false, error: 'Le taux de commission doit être entre 0 et 100%' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { affiliateStats: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    if (user.affiliateStats) {
      return NextResponse.json(
        { success: false, error: 'Cet utilisateur est déjà affilié' },
        { status: 409 }
      );
    }

    if (code) {
      const existingCode = await prisma.affiliateStats.findUnique({ where: { code } });
      if (existingCode) {
        return NextResponse.json(
          { success: false, error: 'Ce code d\'affiliation est déjà utilisé' },
          { status: 409 }
        );
      }

      await prisma.affiliateStats.create({
        data: {
          userId,
          code,
          commissionRate: commissionRateDecimal,
          isActive: true,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { role: 'AFFILIATE' },
      });
    } else {
      await AffiliateService.createAffiliateAccount(userId, commissionRateDecimal);
    }

    const updatedAffiliate = await prisma.affiliateStats.findUnique({
      where: { userId },
    });

    const headersList = await headers();
    const ipAddress =
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      'unknown';

    await AuditLogger.log({
      userId: session.user.id,
      ipAddress,
      action: AuditAction.AFFILIATE_CREATED_BY_ADMIN,
      details: {
        promotedUserId: userId,
        promotedUserEmail: user.email,
        affiliateCode: updatedAffiliate?.code,
        commissionRate: commissionRateDecimal,
        adminId: session.user.id,
        adminEmail: session.user.email,
      },
      severity: 'high',
    });

    return NextResponse.json({
      success: true,
      data: {
        userId,
        affiliateCode: updatedAffiliate?.code,
        commissionRate: commissionRateDecimal,
      },
    });
  } catch (error) {
    console.error('Error promoting user to affiliate:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
