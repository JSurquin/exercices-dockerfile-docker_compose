'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Info, Euro } from 'lucide-react';
import { useLocale } from '@/components/providers/locale-provider';

interface SepaPaymentFormProps {
  payoutId: string;
  amountCents: number;
  onSuccess: (redirectUrl: string) => void;
  onError: (error: string) => void;
}

export function SepaPaymentForm({
  payoutId,
  amountCents,
  onSuccess,
  onError,
}: SepaPaymentFormProps) {
  const { messages } = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  // Récupérer le devis
  const fetchQuote = async () => {
    setIsLoadingQuote(true);
    try {
      const response = await fetch('/api/gatefi/offramp/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fiatAmount: amountCents,
          crypto: 'USDC', // Par défaut USDC
          region: 'FR', // À récupérer depuis le profil utilisateur
        }),
      });

      if (!response.ok) {
        throw new Error(messages.paymentComponents.errors.quoteError);
      }

      const data = await response.json();
      setQuote(data.quote);
    } catch (error) {
      console.error('Erreur devis:', error);
      onError(error instanceof Error ? error.message : messages.paymentComponents.errors.unknownError);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  // Initier le paiement SEPA
  const handleInitiatePayment = async () => {
    if (!quote) {
      onError(messages.paymentComponents.errors.quoteRequired);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/gatefi/offramp/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutId,
          amountCents,
          cryptoAmount: quote.amountIn, // Montant crypto depuis le devis
          crypto: 'USDC',
          region: 'FR',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || messages.paymentComponents.errors.paymentError);
      }

      const data = await response.json();
      onSuccess(data.redirectUrl);
    } catch (error) {
      console.error('Erreur paiement:', error);
      onError(error instanceof Error ? error.message : messages.paymentComponents.errors.unknownError);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  const t = messages.paymentComponents.sepaForm;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>
          {t.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informations sur le montant */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">{t.amountToReceive}</span>
            <span className="text-xl font-bold">{formatCurrency(amountCents)}</span>
          </div>
        </div>

        {/* Devis */}
        {!quote && (
          <Button
            onClick={fetchQuote}
            disabled={isLoadingQuote}
            className="w-full"
            variant="outline"
          >
            {isLoadingQuote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.getQuote}
          </Button>
        )}

        {quote && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">{t.quoteDetails}</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.grossAmount}</span>
                  <span>{formatCurrency(amountCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.processingFees}</span>
                  <span>-{parseFloat(quote.processingFee).toFixed(2)} €</span>
                </div>
                {quote.networkFee && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.networkFees}</span>
                    <span>-{parseFloat(quote.networkFee).toFixed(2)} €</span>
                  </div>
                )}
                <div className="border-t pt-1 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>{t.netAmount}</span>
                    <span>{quote.amountOut} €</span>
                  </div>
                </div>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {t.redirectInfo}
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleInitiatePayment}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.continuePayment}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

