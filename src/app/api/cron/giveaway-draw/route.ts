import { NextRequest, NextResponse } from 'next/server';

/**
 * CRON Job pour effectuer automatiquement le tirage des giveaways expirés
 * 
 * Configuration Vercel Cron:
 * - Path: /api/cron/giveaway-draw
 * - Schedule: chaque 15 minutes
 * 
 * Sécurité:
 * - Protégé par CRON_SECRET dans les variables d'environnement
 * - Seuls les appels avec le bon token Authorization sont autorisés
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier le secret CRON pour sécuriser l'endpoint
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET || 'default-secret-change-me'}`;
    
    if (authHeader !== expectedAuth) {
      console.error('[CRON] Tentative d\'accès non autorisée au cron giveaway-draw');
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    console.log('[CRON] Démarrage du tirage automatique des giveaways...');

    // Appeler l'API auto-draw
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/giveaways/auto-draw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-job': 'true'
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

