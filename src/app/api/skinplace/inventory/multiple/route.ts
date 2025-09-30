import { NextRequest, NextResponse } from 'next/server';
import { skinplaceService, handleSkinplaceError } from '@/lib/skinplace';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { steam_ids } = body;

    if (!steam_ids || !Array.isArray(steam_ids) || steam_ids.length === 0) {
      return NextResponse.json(
        { error: 'steam_ids est requis et doit être un tableau non vide' },
        { status: 400 }
      );
    }

    // Limiter le nombre d'IDs pour éviter les abus
    if (steam_ids.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 steam_ids autorisés' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur demande son propre inventaire ou a les permissions
    const hasOwnSteamId = steam_ids.includes(session.user.steamId);
    if (!hasOwnSteamId) {
      // TODO: Vérifier les permissions admin
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const inventories = await skinplaceService.getMultipleInventory(steam_ids);

    return NextResponse.json(inventories);
  } catch (error) {
    console.error('Erreur lors de la récupération des inventaires multiples:', error);
    
    const skinplaceError = handleSkinplaceError(error);
    return NextResponse.json(skinplaceError, { status: 500 });
  }
}
