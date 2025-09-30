import { NextRequest, NextResponse } from 'next/server';
import { getCustomerPaymentMethods, createCustomer } from '@/lib/stripe';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'card' | 'sepa_debit' || 'card';

    // TODO: Récupérer le customerId Stripe de l'utilisateur depuis la base de données
    // Pour l'instant, on simule avec un customerId fictif
    const customerId = `cus_${session.user.id}`;

    try {
      const paymentMethods = await getCustomerPaymentMethods(customerId, type);
      
      return NextResponse.json({
        paymentMethods: paymentMethods.map(pm => ({
          id: pm.id,
          type: pm.type,
          card: pm.card ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          } : undefined,
          sepa_debit: pm.sepa_debit ? {
            last4: pm.sepa_debit.last4,
            bank_code: pm.sepa_debit.bank_code,
            country: pm.sepa_debit.country,
          } : undefined,
          billing_details: pm.billing_details,
        })),
      });
    } catch (error: unknown) {
      const errorData = error as { code?: string };
      if (errorData.code === 'resource_missing') {
        // Le customer n'existe pas encore, on le crée
        const customer = await createCustomer(
          session.user.id,
          session.user.email,
          session.user.name
        );
        
        return NextResponse.json({
          paymentMethods: [],
          customerId: customer.id,
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des méthodes de paiement:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des méthodes de paiement' },
      { status: 500 }
    );
  }
}
