import { NextRequest, NextResponse } from 'next/server';
import { skinplaceService, handleSkinplaceError } from '@/lib/skinplace';
import { auth } from '~/lib/auth';
import { safeParseJson } from '@/lib/validation/helpers';
import { skinplaceTradeInstantSchema } from '@/lib/validation/schemas/integrations';

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

    const raw = await request.json();
    const parsed = safeParseJson(raw, skinplaceTradeInstantSchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const { steam_id, items, trade_url } = parsed.data;

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
