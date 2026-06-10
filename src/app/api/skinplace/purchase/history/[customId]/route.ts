import { NextRequest, NextResponse } from 'next/server';
import { skinplaceService, handleSkinplaceError } from '@/lib/skinplace';
import { requireUserSession } from '@/lib/require-session-user';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customId: string }> }
) {
  try {
    // Vérifier l'authentification
    const session = await requireUserSession(request);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { customId } = await params;
    const adminSession = await requireAdminSessionWithDbCheck(request);
    if (!adminSession && customId !== session.user.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Valider les paramètres
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'page doit être >= 1 et limit entre 1 et 100' },
        { status: 400 }
      );
    }

    if (!customId) {
      return NextResponse.json(
        { error: 'customId est requis' },
        { status: 400 }
      );
    }

    const history = await skinplaceService.getPurchaseHistory(page, limit, customId);

    return NextResponse.json(history);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique des achats:', error);
    
    const skinplaceError = handleSkinplaceError(error);
    return NextResponse.json(skinplaceError, { status: 500 });
  }
}
