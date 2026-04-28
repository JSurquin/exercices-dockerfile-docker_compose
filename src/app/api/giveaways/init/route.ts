import { NextRequest, NextResponse } from 'next/server';
import { createInitialGiveaway } from '@/lib/init-giveaway';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

export async function POST(request: NextRequest) {
  try {
    // SÉCURITÉ: Seuls les admins peuvent initialiser des giveaways
    // Revalidation depuis DB pour éviter les sessions obsolètes
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Accès refusé — admin requis' },
        { status: 403 }
      );
    }
    
    const giveaway = await createInitialGiveaway();
    
    return NextResponse.json({
      success: true,
      giveaway
    });
  } catch (error) {
    console.error('Error initializing giveaway:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'initialisation du giveaway' },
      { status: 500 }
    );
  }
}