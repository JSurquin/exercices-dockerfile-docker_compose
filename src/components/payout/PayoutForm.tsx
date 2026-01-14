'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CreditCard, Building2, AlertCircle, CheckCircle, Euro, Clock, Shield } from 'lucide-react';

interface PayoutFormProps {
  availableAmountCents: number;
  tradeId?: string;
  onSuccess?: (payout: unknown) => void;
  onError?: (error: string) => void;
}

interface QuoteData {
  method: string;
  amountCents: number;
  fees: {
    processingCents: number;
    networkCents: number;
    totalCents: number;
  };
  netCents: number;
  estimatedDelivery: string;
}

export function PayoutForm({ availableAmountCents, tradeId, onSuccess, onError }: PayoutFormProps) {
  // Simple translation fallback
  const t = (key: string) => key;
  const [method, setMethod] = useState<'SEPA' | 'CARD'>('SEPA');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // SEPA fields
  const [iban, setIban] = useState('');
  const [bic, setBic] = useState('');

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');

  // Common fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const formatCents = (cents: number) => {
    return (cents / 100).toFixed(2) + ' €';
  };

  const formatIban = (value: string) => {
    const cleaned = value.replace(/\s/g, '').toUpperCase();
    return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
  };

  // Fetch quote when amount or method changes
  useEffect(() => {
    const fetchQuote = async () => {
      if (availableAmountCents <= 0) return;

      setQuoteLoading(true);
      try {
        const response = await fetch('/api/flexify/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method,
            amountCents: availableAmountCents,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors du calcul du devis');
        }

        setQuote(data.quote);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setQuoteLoading(false);
      }
    };

    fetchQuote();
  }, [method, availableAmountCents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        method,
        amountCents: availableAmountCents,
        tradeId,
        firstName,
        lastName,
      };

      if (method === 'SEPA') {
        payload.iban = iban;
        payload.bic = bic;
      } else {
        payload.cardNumber = cardNumber;
        payload.cardHolderName = cardHolderName;
        payload.expiryMonth = expiryMonth;
        payload.expiryYear = expiryYear;
      }

      const response = await fetch('/api/flexify/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'KYC_REQUIRED') {
          setError('Veuillez vérifier votre identité avant de demander un paiement.');
          onError?.('KYC_REQUIRED');
          return;
        }
        throw new Error(data.error || 'Erreur lors de la création du paiement');
      }

      setSuccess(true);
      onSuccess?.(data.payout);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-green-500/50 bg-green-500/10">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <h3 className="text-xl font-bold text-green-500">
              {t('payout.success.title') || 'Paiement initié avec succès !'}
            </h3>
            <p className="text-muted-foreground">
              {method === 'SEPA'
                ? t('payout.success.sepa') || 'Votre virement sera traité dans 1-2 jours ouvrés.'
                : t('payout.success.card') || 'Votre paiement sera traité dans les 24h.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Euro className="w-5 h-5" />
          {t('payout.title') || 'Demander un paiement'}
        </CardTitle>
        <CardDescription>
          {t('payout.description') || 'Choisissez votre méthode de paiement préférée'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('common.error') || 'Erreur'}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={method} onValueChange={(v) => setMethod(v as 'SEPA' | 'CARD')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="SEPA" className="gap-2">
              <Building2 className="w-4 h-4" />
              {t('payout.sepa.title') || 'Virement SEPA'}
            </TabsTrigger>
            <TabsTrigger value="CARD" className="gap-2">
              <CreditCard className="w-4 h-4" />
              {t('payout.card.title') || 'Carte bancaire'}
            </TabsTrigger>
          </TabsList>

          {/* Quote Summary */}
          {quote && !quoteLoading && (
            <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('payout.amount') || 'Montant brut'}</span>
                <span className="font-medium">{formatCents(quote.amountCents)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('payout.fees.processing') || 'Frais de traitement'}</span>
                <span className="text-destructive">-{formatCents(quote.fees.processingCents)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('payout.fees.network') || 'Frais réseau'}</span>
                <span className="text-destructive">-{formatCents(quote.fees.networkCents)}</span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between font-bold">
                <span>{t('payout.netAmount') || 'Montant net'}</span>
                <span className="text-green-500">{formatCents(quote.netCents)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Clock className="w-4 h-4" />
                <span>{quote.estimatedDelivery}</span>
              </div>
            </div>
          )}

          {quoteLoading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('payout.firstName') || 'Prénom'}</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jean"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('payout.lastName') || 'Nom'}</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Dupont"
                  required
                />
              </div>
            </div>

            <TabsContent value="SEPA" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="iban">{t('payout.sepa.iban') || 'IBAN'}</Label>
                <Input
                  id="iban"
                  value={formatIban(iban)}
                  onChange={(e) => setIban(e.target.value.replace(/\s/g, ''))}
                  placeholder="FR76 3000 6000 0112 3456 7890 189"
                  required={method === 'SEPA'}
                  maxLength={34 + 8} // IBAN max + spaces
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bic">{t('payout.sepa.bic') || 'BIC/SWIFT (optionnel)'}</Label>
                <Input
                  id="bic"
                  value={bic}
                  onChange={(e) => setBic(e.target.value.toUpperCase())}
                  placeholder="BNPAFRPP"
                  maxLength={11}
                />
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  {t('payout.sepa.info') || 'Les virements SEPA sont sécurisés et arrivent sous 1-2 jours ouvrés.'}
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="CARD" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">{t('payout.card.number') || 'Numéro de carte'}</Label>
                <Input
                  id="cardNumber"
                  value={formatCardNumber(cardNumber)}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="4242 4242 4242 4242"
                  required={method === 'CARD'}
                  maxLength={19}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardHolderName">{t('payout.card.holder') || 'Nom sur la carte'}</Label>
                <Input
                  id="cardHolderName"
                  value={cardHolderName}
                  onChange={(e) => setCardHolderName(e.target.value.toUpperCase())}
                  placeholder="JEAN DUPONT"
                  required={method === 'CARD'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryMonth">{t('payout.card.expiryMonth') || 'Mois'}</Label>
                  <Input
                    id="expiryMonth"
                    value={expiryMonth}
                    onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    placeholder="MM"
                    required={method === 'CARD'}
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryYear">{t('payout.card.expiryYear') || 'Année'}</Label>
                  <Input
                    id="expiryYear"
                    value={expiryYear}
                    onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    placeholder="YY"
                    required={method === 'CARD'}
                    maxLength={2}
                  />
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  {t('payout.card.info') || 'Les paiements par carte sont traités instantanément ou sous 24h.'}
                </AlertDescription>
              </Alert>
            </TabsContent>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || quoteLoading || !quote}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.loading') || 'Chargement...'}
                </>
              ) : (
                <>
                  {method === 'SEPA' ? (
                    <Building2 className="w-4 h-4 mr-2" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  {t('payout.submit') || 'Recevoir'} {quote && formatCents(quote.netCents)}
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              {t('payout.terms') || 'En confirmant, vous acceptez nos conditions de paiement.'}
            </p>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}

