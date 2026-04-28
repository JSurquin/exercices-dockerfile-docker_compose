import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/cron-auth';

/**
 * CRON Job pour effectuer automatiquement le tirage des giveaways expirés
 * 
 * Configuration Vercel Cron:
 * - Path: /api/cron/giveaway-draw
 * - Schedule: chaque 15 minutes
 * 
 * Sécurité: Bearer CRON_SECRET (obligatoire en production, voir cron-auth)
 */
export async function GET(request: NextRequest) {
  try {
    const cron = requireCronSecret(request);
    if (!cron.ok) {
      return NextResponse.json(
        { error: cron.message },
        { status: cron.status }
      );
    }

    console.log('[CRON] Démarrage du tirage automatique des giveaways...');

    // SÉCURITÉ: Passer le CRON_SECRET à l'API auto-draw pour authentification
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET non configuré' },
        { status: 500 }
      );
    }

    // Appeler l'API auto-draw avec authentification Bearer
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/giveaways/auto-draw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cronSecret}`
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Erreur lors du tirage: ${result.error || 'Inconnu'}`);
    }

    console.log(`[CRON] Tirage terminé: ${result.processedCount} giveaways traités`);
    console.log(`[CRON] Résultats:`, JSON.stringify(result.results, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Tirage automatique effectué',
      ...result
    });

  } catch (error) {
    console.error('[CRON] Erreur lors du tirage automatique:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      },
      { status: 500 }
    );
  }
}

// Support POST également pour les tests manuels
export async function POST(request: NextRequest) {
  return GET(request);
}

