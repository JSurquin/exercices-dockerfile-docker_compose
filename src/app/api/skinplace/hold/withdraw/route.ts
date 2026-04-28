import { NextRequest, NextResponse } from 'next/server';
import { skinplaceService, handleSkinplaceError } from '@/lib/skinplace';
import { auth } from '~/lib/auth';
import { safeParseJson } from '@/lib/validation/helpers';
import { skinplaceHoldWithdrawSchema } from '@/lib/validation/schemas/integrations';

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
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, skinplaceHoldWithdrawSchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const { order_id } = parsed.data;

    const result = await skinplaceService.withdrawFromHold(order_id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur lors du retrait du hold:', error);
    
    const skinplaceError = handleSkinplaceError(error);
    return NextResponse.json(skinplaceError, { status: 500 });
  }
}
