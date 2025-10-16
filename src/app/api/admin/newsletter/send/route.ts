import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { newsletterService } from '@/lib/newsletter-service';
import { z } from 'zod';

const sendCampaignSchema = z.object({
  campaignId: z.string().min(1, 'ID de campagne requis'),
});

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Accès non autorisé.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { campaignId } = sendCampaignSchema.parse(body);

    // Envoyer la campagne
    const result = await newsletterService.sendCampaign(campaignId);

    console.log(`Campagne ${campaignId} envoyée par ${session.user.email}: ${result.totalSent}/${result.totalSubscribers} emails envoyés`);

    return NextResponse.json({
      success: true,
      message: 'Campagne envoyée avec succès',
      stats: {
        totalSent: result.totalSent,
        totalErrors: result.totalErrors,
        totalSubscribers: result.totalSubscribers,
      },
    });

  } catch (error) {
    console.error('Send newsletter campaign error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Une erreur interne est survenue.' },
      { status: 500 }
    );
  }
}