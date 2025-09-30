import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, STRIPE_WEBHOOK_EVENTS } from '@/lib/stripe';
import { headers } from 'next/headers';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Signature Stripe manquante' },
        { status: 400 }
      );
    }

    // Vérifier la signature du webhook
    const event = verifyWebhookSignature(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log('Webhook Stripe reçu:', event.type);

    // Traiter les événements selon leur type
    switch (event.type) {
      case STRIPE_WEBHOOK_EVENTS.PAYMENT_INTENT_SUCCEEDED:
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case STRIPE_WEBHOOK_EVENTS.PAYMENT_INTENT_PAYMENT_FAILED:
        await handlePaymentIntentFailed(event.data.object);
        break;

      case STRIPE_WEBHOOK_EVENTS.PAYMENT_INTENT_CANCELED:
        await handlePaymentIntentCanceled(event.data.object);
        break;

      case STRIPE_WEBHOOK_EVENTS.SETUP_INTENT_SUCCEEDED:
        await handleSetupIntentSucceeded(event.data.object);
        break;

      default:
        console.log(`Événement non géré: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erreur lors du traitement du webhook Stripe:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement du webhook' },
      { status: 400 }
    );
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { tradeId, userId } = paymentIntent.metadata as { tradeId: string, userId: string, ticketId: string };
  
  console.log(`Paiement réussi pour le trade ${tradeId}, utilisateur ${userId}`);
  
  // TODO: Mettre à jour le statut du trade en base de données
  // - Changer le statut du trade à "paiement_en_cours"
  // - Enregistrer la référence de paiement Stripe
  // - Déclencher le processus de payout
  
  // Exemple de logique à implémenter :
  // await updateTradeStatus(tradeId, 'paiement_en_cours');
  // await createPayout(userId, paymentIntent.amount, 'stripe', paymentIntent.id);
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { tradeId, userId } = paymentIntent.metadata as { tradeId: string, userId: string, ticketId: string };
  
  console.log(`Paiement échoué pour le trade ${tradeId}, utilisateur ${userId}`);
  
  // TODO: Mettre à jour le statut du trade en base de données
  // - Changer le statut du trade à "échoué"
  // - Notifier l'utilisateur de l'échec du paiement
  
  // Exemple de logique à implémenter :
  // await updateTradeStatus(tradeId, 'échoué');
  // await notifyUser(userId, 'Paiement échoué', `Le paiement pour le trade ${ticketId} a échoué`);
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const { tradeId, userId } = paymentIntent.metadata as { tradeId: string, userId: string, ticketId: string };
  
  console.log(`Paiement annulé pour le trade ${tradeId}, utilisateur ${userId}`);
  
  // TODO: Mettre à jour le statut du trade en base de données
  // - Changer le statut du trade à "échoué"
  // - Libérer les items du trade hold
  
  // Exemple de logique à implémenter :
  // await updateTradeStatus(tradeId, 'échoué');
  // await releaseTradeItems(tradeId);
}

async function handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent) {
  const { customer } = setupIntent;
  
  console.log(`Méthode de paiement sauvegardée pour le customer ${customer}`);
  
  // TODO: Mettre à jour les méthodes de paiement de l'utilisateur
  // - Enregistrer la nouvelle méthode de paiement
  // - Notifier l'utilisateur de la sauvegarde réussie
  
  // Exemple de logique à implémenter :
  // await savePaymentMethod(customer, setupIntent.payment_method);
  // await notifyUser(userId, 'Méthode de paiement sauvegardée', 'Votre méthode de paiement a été sauvegardée avec succès');
}
