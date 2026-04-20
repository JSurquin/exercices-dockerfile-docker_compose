import { NextRequest, NextResponse } from 'next/server';
import { skinplaceService, handleSkinplaceError } from '@/lib/skinplace';
import { auth } from '~/lib/auth';

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
    const { steam_id, items, trade_url } = body;

    if (!steam_id || !items || !trade_url) {
      return NextResponse.json(
        { error: 'steam_id, items et trade_url sont requis' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'items doit être un tableau non vide' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur crée un trade pour son propre compte
    if (steam_id !== session.user.steamId) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Valider le format du trade URL Steam
    // Accepte avec ou sans / après "new" (Steam peut renvoyer les deux formats)
    const steamTradeUrlRegex = /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/?\?partner=\d+&token=[a-zA-Z0-9_-]+$/;
    if (!steamTradeUrlRegex.test(trade_url)) {
      return NextResponse.json(
        { error: 'Format de trade URL Steam invalide' },
        { status: 400 }
      );
    }

    const trade = await skinplaceService.createInstantTrade(steam_id, items, trade_url);

    return NextResponse.json(trade);
  } catch (error) {
    console.error('Erreur lors de la création du trade:', error);
    
    const skinplaceError = handleSkinplaceError(error);
    return NextResponse.json(skinplaceError, { status: 500 });
  }
}
