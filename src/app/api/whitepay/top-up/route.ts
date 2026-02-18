import { NextRequest, NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://moonskin.fun';

/**
 * GET /api/whitepay/top-up?amount=35
 *
 * Retourne l’URL de webhook à configurer chez WhitePay pour le test 35 USDC
 * et les infos pour envoyer le paiement test.
 *
 * Comment WhitePay nous contacte :
 * 1. Tu configures dans le dashboard WhitePay (ou à la création d’invoice) l’URL de callback.
 * 2. Quand un paiement (ex. 35 USDC) est reçu sur l’adresse/wallet fournie par WhitePay,
 *    WhitePay envoie une requête HTTP POST sur cette URL avec le payload signé.
 * 3. Notre webhook traite le callback (idempotence par transaction.id) et crédite le solde.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const amount = searchParams.get('amount') || '35';

  const webhookUrl = `${APP_URL.replace(/\/$/, '')}/api/whitepay/webhook`;

  return NextResponse.json({
    webhook_url: webhookUrl,
    message: 'Configure this URL as the callback in your WhitePay merchant dashboard. When you top up your WhitePay merchant account (e.g. 35 USDC), WhitePay will POST to this URL; we log it for audit only (no user balance credit — our balance comes from skin sales, WhitePay is for payouts).',
    test_amount_usdc: amount,
    how_it_works: [
      '1. Set the callback URL above in WhitePay (dashboard or API).',
      '2. Create a top-up invoice for the desired amount (e.g. 35 USDC) in WhitePay.',
      '3. Send the USDC to the wallet address provided by WhitePay.',
      '4. WhitePay will POST to the webhook URL when the payment is received (we log and return 200).',
    ],
  });
}
