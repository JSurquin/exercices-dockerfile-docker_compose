import { NextRequest, NextResponse } from 'next/server';
import { skinplaceService, handleSkinplaceError } from '@/lib/skinplace';
import { assertPurchaseIdBelongsToCustomId } from '@/lib/skinplace-purchase-guard';
import { requireUserSession } from '@/lib/require-session-user';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await requireUserSession(request);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const purchaseId = searchParams.get('purchase_id');
    const detailed = searchParams.get('detailed') === 'true';

    if (!purchaseId) {
      return NextResponse.json(
        { error: 'purchase_id est requis' },
        { status: 400 }
      );
    }

    const adminSession = await requireAdminSessionWithDbCheck(request);
    if (!adminSession) {
      const ok = await assertPurchaseIdBelongsToCustomId(purchaseId, session.user.id);
      if (!ok) {
        return NextResponse.json(
          { error: 'Accès non autorisé' },
          { status: 403 }
        );
      }
    }

    const items = detailed
      ? await skinplaceService.getPurchaseItemsDetailed(purchaseId)
      : await skinplaceService.getPurchaseItems(purchaseId);

    return NextResponse.json(items);
  } catch (error) {
    console.error('Erreur lors de la récupération des items d\'achat:', error);
    
    const skinplaceError = handleSkinplaceError(error);
    return NextResponse.json(skinplaceError, { status: 500 });
  }
}
