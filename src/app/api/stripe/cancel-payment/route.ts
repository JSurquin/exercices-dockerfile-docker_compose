import { NextRequest, NextResponse } from 'next/server';
import { cancelPaymentIntent, retrievePaymentIntent } from '@/lib/stripe';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'paymentIntentId est requis' },
        { status: 400 }
      );
    }

    // Récupérer le PaymentIntent pour vérifier qu'il appartient à l'utilisateur
    const paymentIntent = await retrievePaymentIntent(paymentIntentId);
    
    if (paymentIntent.metadata.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé à ce PaymentIntent' },
        { status: 403 }
      );
    }

    // Vérifier que le paiement peut être annulé
    if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'canceled') {
      return NextResponse.json(
        { error: 'Ce paiement ne peut pas être annulé' },
        { status: 400 }
      );
    }

    // Annuler le paiement
    const canceledPaymentIntent = await cancelPaymentIntent(paymentIntentId);

    return NextResponse.json({
      status: canceledPaymentIntent.status,
      paymentIntentId: canceledPaymentIntent.id,
    });
  } catch (error) {
    console.error('Erreur lors de l\'annulation du paiement:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'annulation du paiement' },
      { status: 500 }
    );
  }
}
