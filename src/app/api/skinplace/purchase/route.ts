import { NextRequest, NextResponse } from 'next/server';
import { skinplaceService, handleSkinplaceError } from '@/lib/skinplace';
import { auth } from '@/lib/auth';
import { SkinplacePurchaseRequest } from '@/lib/types';

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
    const { items, payment_method, trade_token } = body as SkinplacePurchaseRequest;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'items est requis et doit être un tableau non vide' },
        { status: 400 }
      );
    }

    if (!payment_method || !['balance', 'stripe', 'crypto'].includes(payment_method)) {
      return NextResponse.json(
        { error: 'payment_method doit être balance, stripe ou crypto' },
        { status: 400 }
      );
    }

    // Limiter le nombre d'items pour éviter les abus
    if (items.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 items autorisés' },
        { status: 400 }
      );
    }

    const purchase = await skinplaceService.purchaseItems({
      items,
      payment_method,
      trade_token,
    });

    return NextResponse.json(purchase);
  } catch (error) {
    console.error('Erreur lors de l\'achat d\'items:', error);
    
    const skinplaceError = handleSkinplaceError(error);
    return NextResponse.json(skinplaceError, { status: 500 });
  }
}
