'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/components/providers/auth-provider';
import { useLocale } from '@/components/providers/locale-provider';
import {
  BanknotesIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { formatCentsToCurrency, toCents } from '@/lib/currency-converter';

type PayoutMethod = 'sepa' | 'card';

// Type for the quote response from our API
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
  currency: string;
  expiresAt: string;
  quoteId?: string;
}

interface PayoutFormData {
  // SEPA
  iban: string;
  bic: string;
  accountHolder: string;
  // Card
  cardNumber: string;
  cardExpiry: string;
  cardHolder: string;
}

export default function PayoutPage() {
  const { user } = useAuth();
  const { messages, locale } = useLocale();
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>('sepa');
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [formData, setFormData] = useState<PayoutFormData>({
    iban: '',
    bic: '',
    accountHolder: '',
    cardNumber: '',
    cardExpiry: '',
    cardHolder: '',
  });
  const [payoutHistory, setPayoutHistory] = useState<Array<{
    id: string;
    amount: number;
    status: string;
    method: string;
    createdAt: string;
  }>>([]);

  // Traductions locales pour la page payout
  const text = messages.payoutPage;

  // Récupérer l'historique des payouts
  const fetchPayoutHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/payouts/history');
      if (response.ok) {
        const data = await response.json();
        setPayoutHistory(data.payouts || []);
      }
    } catch (error) {
      console.error('Error fetching payout history:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchPayoutHistory();
    }
  }, [user, fetchPayoutHistory]);

  // Obtenir un devis Flexify
  const getQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error(text.toast.amountTooLow);
      return;
    }

    const amountCents = toCents(parseFloat(amount));
    const balance = (user?.totalVolume || 0);

    if (amountCents > balance) {
      toast.error(text.toast.insufficientBalance);
      return;
    }

    setIsLoadingQuote(true);
    try {
      const response = await fetch('/api/flexify/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountCents,
          currency: 'EUR',
          method: payoutMethod,
        }),
      });

      if (!response.ok) {
        throw new Error('Quote request failed');
      }

      const data = await response.json();
      setQuote(data);
    } catch (error) {
      console.error('Error getting quote:', error);
      toast.error(text.toast.payoutError);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  // Soumettre le payout
  const handleSubmit = async () => {
    if (!quote) {
      toast.error(text.toast.payoutError);
      return;
    }

    if (!user?.kycStatus || user.kycStatus !== 'verified') {
      toast.error(text.kyc.required);
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        quoteId: quote.quoteId,
        method: payoutMethod,
        ...(payoutMethod === 'sepa' ? {
          iban: formData.iban.replace(/\s/g, ''),
          bic: formData.bic,
          accountHolder: formData.accountHolder,
        } : {
          cardNumber: formData.cardNumber.replace(/\s/g, ''),
          cardExpiry: formData.cardExpiry,
          cardHolder: formData.cardHolder,
        }),
      };

      const response = await fetch('/api/flexify/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Payout request failed');
      }

      toast.success(text.toast.payoutCreated);
      setQuote(null);
      setAmount('');
      fetchPayoutHistory();
    } catch (error) {
      console.error('Error submitting payout:', error);
      toast.error(text.toast.payoutError);
    } finally {
      setIsLoading(false);
    }
  };

  // Pas connecté
  if (!user) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-6 sm:p-8">
            <BanknotesIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">{text.loginRequired.title}</h2>
            <p className="text-muted-foreground mb-6">{text.loginRequired.description}</p>
            <Button onClick={() => window.location.href = '/'}>
              {text.loginRequired.login}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // KYC non vérifié
  if (!user.kycStatus || user.kycStatus !== 'verified') {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-6 sm:p-8">
            <ShieldCheckIcon className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-xl font-semibold mb-2">{text.kyc.required}</h2>
            <p className="text-muted-foreground mb-6">{text.kyc.description}</p>
            <Button 
              onClick={() => window.location.href = '/kyc'}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
            >
              {text.kyc.startKyc}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'flexify_paid':
        return <Badge className="bg-green-500">{text.history.status.paid}</Badge>;
      case 'processing':
      case 'flexify_processing':
        return <Badge className="bg-blue-500">{text.history.status.paid}</Badge>;
      case 'failed':
      case 'flexify_failed':
        return <Badge className="bg-red-500">{text.history.status.failed}</Badge>;
      default:
        return <Badge className="bg-yellow-500">{text.history.status.pending}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">{text.title}</h1>
          <p className="text-muted-foreground">{text.subtitle}</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Formulaire principal */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{text.title}</CardTitle>
                    <CardDescription>{text.subtitle}</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{text.request.availableBalance}</p>
                    <p className="text-2xl font-bold text-green-500">
                      {formatCentsToCurrency(user.totalVolume || 0, 'EUR')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Montant */}
                <div className="space-y-2">
                  <Label htmlFor="amount">{text.request.amountLabel}</Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      min="10"
                      max="10000"
                      step="0.01"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setQuote(null);
                      }}
                      placeholder={text.request.amountPlaceholder}
                      className="pl-8"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{text.request.minAmount}</span>
                    <span>{text.request.maxAmount}</span>
                  </div>
                </div>

                {/* Méthode de paiement */}
                <Tabs value={payoutMethod} onValueChange={(v) => {
                  setPayoutMethod(v as PayoutMethod);
                  setQuote(null);
                }}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="sepa" className="flex items-center gap-2">
                      <BanknotesIcon className="w-4 h-4" />
                      SEPA
                    </TabsTrigger>
                    <TabsTrigger value="card" className="flex items-center gap-2">
                      <CreditCardIcon className="w-4 h-4" />
                      Carte
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="sepa" className="space-y-4 mt-4">
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-700 dark:text-blue-300">{text.request.security.sepaInfo}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="iban">{text.request.ibanLabel}</Label>
                        <Input
                          id="iban"
                          value={formData.iban}
                          onChange={(e) => setFormData(prev => ({ ...prev, iban: e.target.value }))}
                          placeholder={text.request.ibanPlaceholder}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bic">{text.request.bicLabel}</Label>
                        <Input
                          id="bic"
                          value={formData.bic}
                          onChange={(e) => setFormData(prev => ({ ...prev, bic: e.target.value }))}
                          placeholder={text.request.bicPlaceholder}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountHolder">{text.request.accountHolderLabel}</Label>
                        <Input
                          id="accountHolder"
                          value={formData.accountHolder}
                          onChange={(e) => setFormData(prev => ({ ...prev, accountHolder: e.target.value }))}
                          placeholder={text.request.accountHolderPlaceholder}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="card" className="space-y-4 mt-4">
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <InformationCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-green-700 dark:text-green-300">{text.request.security.cryptoInfo}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">{text.request.cardNumberLabel}</Label>
                        <Input
                          id="cardNumber"
                          value={formData.cardNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, cardNumber: e.target.value }))}
                          placeholder={text.request.cardNumberPlaceholder}
                          maxLength={19}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cardExpiry">{text.request.expiryDateLabel}</Label>
                          <Input
                            id="cardExpiry"
                            value={formData.cardExpiry}
                            onChange={(e) => setFormData(prev => ({ ...prev, cardExpiry: e.target.value }))}
                            placeholder={text.request.expiryDatePlaceholder}
                            maxLength={5}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cardHolder">{text.request.cardHolderLabel}</Label>
                          <Input
                            id="cardHolder"
                            value={formData.cardHolder}
                            onChange={(e) => setFormData(prev => ({ ...prev, cardHolder: e.target.value }))}
                            placeholder={text.request.cardHolderPlaceholder}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Bouton Obtenir devis */}
                {!quote && (
                  <Button
                    onClick={getQuote}
                    disabled={isLoadingQuote || !amount}
                    className="w-full"
                    variant="outline"
                  >
                    {isLoadingQuote ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                        {text.request.submitting}
                      </>
                    ) : (
                      text.request.getQuoteButton
                    )}
                  </Button>
                )}

                {/* Récapitulatif du devis */}
                {quote && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-muted/50 rounded-lg p-4 space-y-3"
                  >
                    <h3 className="font-semibold flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      Récapitulatif
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{text.request.grossAmount}</span>
                        <span>{formatCentsToCurrency(quote.amountCents, 'EUR')}</span>
                      </div>
                      <div className="flex justify-between text-orange-500">
                        <span>{text.request.feesInfo}</span>
                        <span>-{formatCentsToCurrency(quote.fees.totalCents, 'EUR')}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>{text.request.youReceive}</span>
                        <span className="text-green-500">{formatCentsToCurrency(quote.netCents, 'EUR')}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>{text.request.estimatedDelay}</span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          {quote.estimatedDelivery}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                    >
                      {isLoading ? (
                        <>
                          <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                          {text.request.submitting}
                        </>
                      ) : (
                        text.request.submitButton
                      )}
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar - Historique */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{text.history.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {payoutHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <BanknotesIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{text.history.noPayoutDesc}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payoutHistory.slice(0, 5).map((payout) => (
                      <div 
                        key={payout.id} 
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{formatCentsToCurrency(payout.amount, 'EUR')}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payout.createdAt).toLocaleDateString(locale)}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(payout.status)}
                          <p className="text-xs text-muted-foreground mt-1">
                            {payout.method === 'FLEXIFY_SEPA' ? 'SEPA' : 'Carte'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informations de sécurité */}
            <Card className="mt-4">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <ShieldCheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">{text.request.security.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Tous les paiements sont traités de manière sécurisée
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">{text.request.ibanVerificationTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        Un changement d&apos;IBAN peut nécessiter une vérification supplémentaire
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

