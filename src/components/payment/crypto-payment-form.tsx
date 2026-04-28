'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Info, Wallet } from 'lucide-react';
import { useLocale } from '@/components/providers/locale-provider';

interface CryptoPaymentFormProps {
  payoutId: string;
  amountCents: number;
  onSuccess: (redirectUrl: string) => void;
  onError: (error: string) => void;
}

const SUPPORTED_CRYPTOS = [
  { value: 'USDT', label: 'Tether (USDT)', network: 'ERC-20' },
  { value: 'USDC', label: 'USD Coin (USDC)', network: 'ERC-20' },
  { value: 'ETH', label: 'Ethereum (ETH)', network: 'Ethereum' },
  { value: 'BTC', label: 'Bitcoin (BTC)', network: 'Bitcoin' },
];

export function CryptoPaymentForm({
  payoutId,
  amountCents,
  onSuccess,
  onError,
}: CryptoPaymentFormProps) {
  const { messages } = useLocale();
  const [crypto, setCrypto] = useState('USDT');
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  // Récupérer le devis
  const fetchQuote = async () => {
    setIsLoadingQuote(true);
    try {
      const response = await fetch('/api/gatefi/onramp/quote', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fiatAmount: amountCents,
          crypto,
          region: 'FR',
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

  // Initier le paiement crypto
  const handleInitiatePayment = async () => {
    if (!walletAddress) {
      onError(messages.paymentComponents.errors.walletRequired);
      return;
    }

    if (!quote) {
      onError(messages.paymentComponents.errors.quoteRequired);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/gatefi/onramp/buy', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutId,
          amountCents,
          crypto,
          region: 'FR',
          walletAddress,
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

  const selectedCryptoInfo = SUPPORTED_CRYPTOS.find((c) => c.value === crypto);

  const t = messages.paymentComponents.cryptoForm;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>
          {t.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sélection de la crypto */}
        <div className="space-y-2">
          <Label htmlFor="crypto">{t.selectCrypto}</Label>
          <Select value={crypto} onValueChange={setCrypto}>
            <SelectTrigger id="crypto">
              <SelectValue placeholder={t.selectCryptoPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_CRYPTOS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label} ({c.network})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Adresse du wallet */}
        <div className="space-y-2">
          <Label htmlFor="wallet">{t.walletAddress}</Label>
          <div className="relative">
            <Wallet className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="wallet"
              type="text"
              placeholder={
                crypto === 'BTC'
                  ? 'bc1...'
                  : '0x...'
              }
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t.walletWarning}
          </p>
        </div>

        {/* Montant */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">{t.equivalentAmount}</span>
            <span className="text-xl font-bold">{formatCurrency(amountCents)}</span>
          </div>
        </div>

        {/* Obtenir un devis */}
        {!quote && (
          <Button
            onClick={fetchQuote}
            disabled={isLoadingQuote || !crypto}
            className="w-full"
            variant="outline"
          >
            {isLoadingQuote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.getQuote}
          </Button>
        )}

        {/* Détails du devis */}
        {quote && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">{t.quoteDetails}</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.amountEur}</span>
                  <span>{formatCurrency(amountCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.exchangeRate}</span>
                  <span>{parseFloat(quote.rate).toFixed(6)}</span>
                </div>
                {quote.networkFee && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.networkFees}</span>
                    <span>{quote.networkFee} {crypto}</span>
                  </div>
                )}
                <div className="border-t pt-1 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>{t.youWillReceive}</span>
                    <span>{quote.amountOut} {crypto}</span>
                  </div>
                </div>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {t.transferInfo} ({selectedCryptoInfo?.network}).
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleInitiatePayment}
              disabled={isLoading || !walletAddress}
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

