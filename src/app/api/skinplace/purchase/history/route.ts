import { NextRequest, NextResponse } from 'next/server';
import { skinplaceService, handleSkinplaceError } from '@/lib/skinplace';
import { auth } from '~/lib/auth';

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const customId = searchParams.get('custom_id');

    // Valider les paramètres
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'page doit être >= 1 et limit entre 1 et 100' },
        { status: 400 }
      );
    }

    const history = await skinplaceService.getPurchaseHistory(page, limit, customId || undefined);

    return NextResponse.json(history);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique des achats:', error);
    
    const skinplaceError = handleSkinplaceError(error);
    return NextResponse.json(skinplaceError, { status: 500 });
  }
}
