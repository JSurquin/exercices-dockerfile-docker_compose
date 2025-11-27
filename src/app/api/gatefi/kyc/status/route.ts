import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { isUserKycVerified, getOrCreateSumsubToken } from '@/lib/gatefi-kyc';

/**
 * GET /api/gatefi/kyc/status
 * Récupère le statut KYC de l'utilisateur connecté
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Récupérer le statut KYC depuis la base de données
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        kycStatus: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isVerified = await isUserKycVerified(userId);

    return NextResponse.json({
      success: true,
      kycStatus: user.kycStatus,
      isVerified,
      canMakePayout: isVerified,
    });
  } catch (error) {
    console.error('[KYC Status] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get KYC status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gatefi/kyc/status
 * Génère un token Sumsub pour l'utilisateur
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Générer ou récupérer le token Sumsub
    const token = await getOrCreateSumsubToken(userId);

    return NextResponse.json({
      success: true,
      token,
      message: 'Sumsub token generated',
    });
  } catch (error) {
    console.error('[KYC Token] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate KYC token',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

