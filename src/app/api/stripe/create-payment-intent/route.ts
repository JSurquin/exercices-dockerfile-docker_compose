import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/stripe';
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
    const { tradeId, ticketId, amount } = body;

    if (!tradeId || !ticketId || !amount) {
      return NextResponse.json(
        { error: 'tradeId, ticketId et amount sont requis' },
        { status: 400 }
      );
    }

    // Validation du montant (doit être positif et en centimes)
    if (amount <= 0 || !Number.isInteger(amount)) {
      return NextResponse.json(
        { error: 'Le montant doit être un entier positif en centimes' },
        { status: 400 }
      );
    }

    // Créer le PaymentIntent
    const paymentIntent = await createPaymentIntent(
      tradeId,
      session.user.id,
      ticketId,
      amount
    );

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    });
  } catch (error) {
    console.error('Erreur lors de la création du PaymentIntent:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
