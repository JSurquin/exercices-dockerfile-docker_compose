import { NextRequest, NextResponse } from 'next/server';
import { confirmPaymentIntent, retrievePaymentIntent } from '@/lib/stripe';
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
    const { paymentIntentId, paymentMethodId } = body;

    if (!paymentIntentId || !paymentMethodId) {
      return NextResponse.json(
        { error: 'paymentIntentId et paymentMethodId sont requis' },
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

    // Confirmer le paiement
    const confirmedPaymentIntent = await confirmPaymentIntent(
      paymentIntentId,
      paymentMethodId
    );

    return NextResponse.json({
      status: confirmedPaymentIntent.status,
      paymentIntentId: confirmedPaymentIntent.id,
      tradeId: confirmedPaymentIntent.metadata.tradeId,
      ticketId: confirmedPaymentIntent.metadata.ticketId,
    });
  } catch (error) {
    console.error('Erreur lors de la confirmation du paiement:', error);
    
    if (error instanceof Error && error.message.includes('Your card was declined')) {
      return NextResponse.json(
        { error: 'Votre carte a été refusée' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la confirmation du paiement' },
      { status: 500 }
    );
  }
}
