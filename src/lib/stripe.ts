import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

export const STRIPE_CONFIG = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  webhookEndpointSecret: process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET!,
  currency: 'eur',
  applicationFeeAmount: 0, // Pas de frais d'application pour l'instant
};

// Utilitaires pour les montants
export const formatAmountForStripe = (amount: number): number => {
  // Convertir les centimes en centimes Stripe (EUR utilise les centimes)
  return Math.round(amount);
};

export const formatAmountFromStripe = (amount: number): number => {
  // Convertir les centimes Stripe en centimes de l'application
  return amount;
};

// Créer un PaymentIntent pour un trade
export const createPaymentIntent = async (
  tradeId: string,
  userId: string,
  ticketId: string,
  amount: number,
  currency: string = 'eur'
): Promise<Stripe.PaymentIntent> => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: formatAmountForStripe(amount),
    currency,
    metadata: {
      tradeId,
      userId,
      ticketId,
    },
    automatic_payment_methods: {
      enabled: true,
    },
    payment_method_types: ['card', 'sepa_debit'],
  });

  return paymentIntent;
};

// Récupérer un PaymentIntent
export const retrievePaymentIntent = async (paymentIntentId: string): Promise<Stripe.PaymentIntent> => {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
};

// Confirmer un PaymentIntent
export const confirmPaymentIntent = async (
  paymentIntentId: string,
  paymentMethodId: string
): Promise<Stripe.PaymentIntent> => {
  return await stripe.paymentIntents.confirm(paymentIntentId, {
    payment_method: paymentMethodId,
  });
};

// Annuler un PaymentIntent
export const cancelPaymentIntent = async (paymentIntentId: string): Promise<Stripe.PaymentIntent> => {
  return await stripe.paymentIntents.cancel(paymentIntentId);
};

// Créer un Customer Stripe
export const createCustomer = async (
  userId: string,
  email?: string,
  name?: string
): Promise<Stripe.Customer> => {
  return await stripe.customers.create({
    metadata: {
      userId,
    },
    email,
    name,
  });
};

// Récupérer les méthodes de paiement d'un customer
export const getCustomerPaymentMethods = async (
  customerId: string,
  type: 'card' | 'sepa_debit' = 'card'
): Promise<Stripe.PaymentMethod[]> => {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type,
  });

  return paymentMethods.data;
};

// Créer un SetupIntent pour sauvegarder une méthode de paiement
export const createSetupIntent = async (
  customerId: string,
  paymentMethodId?: string
): Promise<Stripe.SetupIntent> => {
  return await stripe.setupIntents.create({
    customer: customerId,
    payment_method: paymentMethodId,
    usage: 'off_session',
  });
};

// Webhook signature verification
export const verifyWebhookSignature = (
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event => {
  return stripe.webhooks.constructEvent(payload, signature, secret);
};

// Types d'événements Stripe que nous gérons
export const STRIPE_WEBHOOK_EVENTS = {
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_PAYMENT_FAILED: 'payment_intent.payment_failed',
  PAYMENT_INTENT_CANCELED: 'payment_intent.canceled',
  PAYMENT_METHOD_ATTACHED: 'payment_method.attached',
  CUSTOMER_CREATED: 'customer.created',
  SETUP_INTENT_SUCCEEDED: 'setup_intent.succeeded',
} as const;
