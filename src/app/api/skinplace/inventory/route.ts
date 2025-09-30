import { NextRequest, NextResponse } from 'next/server';
import { skinplaceService, handleSkinplaceError } from '@/lib/skinplace';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const steamId = searchParams.get('steam_id');

    if (!steamId) {
      return NextResponse.json(
        { error: 'steam_id est requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur demande son propre inventaire ou a les permissions
    if (steamId !== session.user.steamId) {
      // TODO: Vérifier les permissions admin
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const inventory = await skinplaceService.getInventory(steamId);

    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'inventaire:', error);
    
    const skinplaceError = handleSkinplaceError(error);
    return NextResponse.json(skinplaceError, { status: 500 });
  }
}
