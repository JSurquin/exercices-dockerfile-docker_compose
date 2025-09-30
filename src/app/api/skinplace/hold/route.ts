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
    const type = searchParams.get('type') || 'orders';

    let holdData;

    switch (type) {
      case 'orders':
        holdData = await skinplaceService.getHoldOrders();
        break;
      case 'grouped':
        holdData = await skinplaceService.getHoldOrdersGrouped();
        break;
      case 'full':
        holdData = await skinplaceService.getHoldOrdersFull();
        break;
      default:
        return NextResponse.json(
          { error: 'Type invalide. Utilisez: orders, grouped, ou full' },
          { status: 400 }
        );
    }

    return NextResponse.json(holdData);
  } catch (error) {
    console.error('Erreur lors de la récupération des hold orders:', error);
    
    const skinplaceError = handleSkinplaceError(error);
    return NextResponse.json(skinplaceError, { status: 500 });
  }
}
