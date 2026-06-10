import { NextRequest, NextResponse } from 'next/server';
import { skinplaceService, handleSkinplaceError } from '@/lib/skinplace';
import { safeParseJson } from '@/lib/validation/helpers';
import { skinplaceInventoryMultipleSchema } from '@/lib/validation/schemas/integrations';
import { requireUserSession } from '@/lib/require-session-user';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await requireUserSession(request);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, skinplaceInventoryMultipleSchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const { steam_ids } = parsed.data;

    const adminSession = await requireAdminSessionWithDbCheck(request);
    if (!adminSession) {
      if (
        !session.user.steamId ||
        steam_ids.length !== 1 ||
        steam_ids[0] !== session.user.steamId
      ) {
        return NextResponse.json(
          { error: 'Accès non autorisé' },
          { status: 403 }
        );
      }
    }

    const inventories = await skinplaceService.getMultipleInventory(steam_ids);

    return NextResponse.json(inventories);
  } catch (error) {
    console.error('Erreur lors de la récupération des inventaires multiples:', error);
    
    const skinplaceError = handleSkinplaceError(error);
    return NextResponse.json(skinplaceError, { status: 500 });
  }
}
