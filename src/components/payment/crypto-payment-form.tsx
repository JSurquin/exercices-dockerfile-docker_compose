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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fiatAmount: amountCents,
          crypto,
          region: 'FR',
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du devis');
      }

      const data = await response.json();
      setQuote(data.quote);
    } catch (error) {
      console.error('Erreur devis:', error);
      onError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setIsLoadingQuote(false);
    }
  };

  // Initier le paiement crypto
  const handleInitiatePayment = async () => {
    if (!walletAddress) {
      onError('Veuillez saisir une adresse de wallet valide');
      return;
    }

    if (!quote) {
      onError('Veuillez d\'abord obtenir un devis');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/gatefi/onramp/buy', {
        method: 'POST',
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
        throw new Error(errorData.error || 'Erreur lors de l\'initiation du paiement');
      }

      const data = await response.json();
      onSuccess(data.redirectUrl);
    } catch (error) {
      console.error('Erreur paiement:', error);
      onError(error instanceof Error ? error.message : 'Erreur inconnue');
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paiement Crypto</CardTitle>
        <CardDescription>
          Recevez votre paiement en crypto-monnaie sur votre wallet personnel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sélection de la crypto */}
        <div className="space-y-2">
          <Label htmlFor="crypto">Crypto-monnaie</Label>
          <Select value={crypto} onValueChange={setCrypto}>
            <SelectTrigger id="crypto">
              <SelectValue placeholder="Sélectionnez une crypto" />
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
          <Label htmlFor="wallet">Adresse de votre wallet</Label>
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
            Assurez-vous que l&apos;adresse est correcte. Les transactions crypto sont irréversibles.
          </p>
        </div>

        {/* Montant */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Montant équivalent</span>
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
            Obtenir un devis
          </Button>
        )}

        {/* Détails du devis */}
        {quote && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Détails du devis</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant en EUR</span>
                  <span>{formatCurrency(amountCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taux de change</span>
                  <span>{parseFloat(quote.rate).toFixed(6)}</span>
                </div>
                {quote.networkFee && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frais réseau</span>
                    <span>{quote.networkFee} {crypto}</span>
                  </div>
                )}
                <div className="border-t pt-1 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Vous recevrez</span>
                    <span>{quote.amountOut} {crypto}</span>
                  </div>
                </div>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Le transfert sera effectué sur votre wallet une fois le processus complété.
                Le délai peut varier selon la blockchain ({selectedCryptoInfo?.network}).
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleInitiatePayment}
              disabled={isLoading || !walletAddress}
              className="w-full"
              size="lg"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continuer vers le paiement
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

