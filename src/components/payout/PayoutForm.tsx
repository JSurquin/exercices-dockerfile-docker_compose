'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Wallet, Building2, AlertCircle, CheckCircle, Euro, Clock, Shield } from 'lucide-react';
import { useLocale } from '@/components/providers/locale-provider';

// Cryptos supportées par Whitepay
const SUPPORTED_CRYPTOS = [
  { ticker: 'USDT', name: 'Tether (USDT)', networks: ['ERC20', 'TRC20', 'BEP20', 'TON', 'SOL'], is_stable: true },
  { ticker: 'USDC', name: 'USD Coin (USDC)', networks: ['ERC20', 'TRC20', 'BEP20', 'SOL'], is_stable: true },
  { ticker: 'BTC', name: 'Bitcoin (BTC)', networks: ['BTC'], is_stable: false },
  { ticker: 'ETH', name: 'Ethereum (ETH)', networks: ['ERC20'], is_stable: false },
  { ticker: 'SOL', name: 'Solana (SOL)', networks: ['SOL'], is_stable: false },
  { ticker: 'TON', name: 'Toncoin (TON)', networks: ['TON'], is_stable: false },
  { ticker: 'BNB', name: 'BNB (BNB)', networks: ['BEP20'], is_stable: false },
];

const MEMO_REQUIRED_NETWORKS = ['TON', 'STELLAR', 'XLM', 'COSMOS', 'ATOM'];

function getAddressPlaceholder(network: string): string {
  switch (network) {
    case 'BTC': return 'bc1q...';
    case 'ERC20':
    case 'BEP20': return '0x...';
    case 'TRC20': return 'T...';
    case 'SOL': return 'So1...';
    case 'TON': return 'EQ...';
    default: return '0x...';
  }
}

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
  const { messages } = useLocale();
  const t = messages.payoutComponents.form;
  const [method, setMethod] = useState<'SEPA' | 'CRYPTO'>('SEPA');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // SEPA fields
  const [iban, setIban] = useState('');
  const [bic, setBic] = useState('');

  // Crypto fields
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState('USDT');
  const [selectedNetwork, setSelectedNetwork] = useState('ERC20');
  const [memo, setMemo] = useState('');

  // Common fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Réseaux disponibles pour la crypto sélectionnée
  const availableNetworks = SUPPORTED_CRYPTOS.find((c) => c.ticker === selectedCrypto)?.networks || [];
  const needsMemo = MEMO_REQUIRED_NETWORKS.includes(selectedNetwork);

  const formatCents = (cents: number) => {
    return (cents / 100).toFixed(2) + ' €';
  };

  const formatIban = (value: string) => {
    const cleaned = value.replace(/\s/g, '').toUpperCase();
    return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
  };

  // Quand on change de crypto, reset le réseau
  useEffect(() => {
    const crypto = SUPPORTED_CRYPTOS.find((c) => c.ticker === selectedCrypto);
    if (crypto && crypto.networks.length > 0) {
      setSelectedNetwork(crypto.networks[0]);
    }
  }, [selectedCrypto]);

  const { data: quoteData, isLoading: quoteLoading, error: quoteError } = useQuery({
    queryKey: queryKeys.flexifyQuote({ method, amountCents: availableAmountCents }),
    queryFn: async () => {
      const response = await fetch('/api/flexify/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: method === 'SEPA' ? 'sepa' : 'crypto',
          amountCents: availableAmountCents,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t.quoteError);
      return data.quote as QuoteData;
    },
    enabled: availableAmountCents > 0,
  });

  const quote = quoteData ?? null;
  const error = submitError ?? (quoteError instanceof Error ? quoteError.message : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError(null);

    try {
      let apiUrl: string;
      let payload: Record<string, unknown>;

      if (method === 'SEPA') {
        apiUrl = '/api/flexify/payout';
        payload = {
          method: 'SEPA',
          amountCents: availableAmountCents,
          tradeId,
          firstName,
          lastName,
          iban,
          bic,
        };
      } else {
        apiUrl = '/api/whitepay/withdrawal';
        payload = {
          method: 'CRYPTO',
          amountCents: availableAmountCents,
          tradeId,
          firstName,
          lastName,
          walletAddress,
          targetCurrency: selectedCrypto,
          network: selectedNetwork,
          memo: needsMemo ? memo : undefined,
        };
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'KYC_REQUIRED') {
          setSubmitError(t.kycRequired);
          onError?.('KYC_REQUIRED');
          return;
        }
        throw new Error(data.error || t.paymentError);
      }

      setSuccess(true);
      onSuccess?.(data.payout);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.unknownError;
      setSubmitError(message);
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
              {t.successTitle}
            </h3>
            <p className="text-muted-foreground">
              {method === 'SEPA' ? t.successSepa : t.successCrypto}
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
          {t.title}
        </CardTitle>
        <CardDescription>
          {t.description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t.errorLabel}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={method} onValueChange={(v) => setMethod(v as 'SEPA' | 'CRYPTO')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="SEPA" className="gap-2">
              <Building2 className="w-4 h-4" />
              {t.sepaTitle}
            </TabsTrigger>
            <TabsTrigger value="CRYPTO" className="gap-2">
              <Wallet className="w-4 h-4" />
              {t.crypto}
            </TabsTrigger>
          </TabsList>

          {/* Quote Summary */}
          {quote && !quoteLoading && (
            <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.grossAmount}</span>
                <span className="font-medium">{formatCents(quote.amountCents)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.processingFees}</span>
                <span className="text-destructive">-{formatCents(quote.fees.processingCents)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.networkFees}</span>
                <span className="text-destructive">-{formatCents(quote.fees.networkCents)}</span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between font-bold">
                <span>{t.netAmount}</span>
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
                <Label htmlFor="firstName">{t.firstName}</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t.firstNamePlaceholder}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t.lastName}</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t.lastNamePlaceholder}
                  required
                />
              </div>
            </div>

            <TabsContent value="SEPA" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="iban">{t.iban}</Label>
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
                <Label htmlFor="bic">{t.bicSwift}</Label>
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
                  {t.sepaInfo}
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="CRYPTO" className="space-y-4 mt-0">
              {/* Sélection de la crypto */}
              <div className="space-y-2">
                <Label htmlFor="crypto-select">{t.cryptoCurrency}</Label>
                <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                  <SelectTrigger id="crypto-select">
                    <SelectValue placeholder={t.chooseCrypto} />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CRYPTOS.map((c) => (
                      <SelectItem key={c.ticker} value={c.ticker}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sélection du réseau */}
              <div className="space-y-2">
                <Label htmlFor="network-select">{t.blockchainNetwork}</Label>
                <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                  <SelectTrigger id="network-select">
                    <SelectValue placeholder={t.chooseNetwork} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableNetworks.map((net) => (
                      <SelectItem key={net} value={net}>
                        {net}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Adresse wallet */}
              <div className="space-y-2">
                <Label htmlFor="walletAddress">{t.walletAddress}</Label>
                <Input
                  id="walletAddress"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value.trim())}
                  placeholder={getAddressPlaceholder(selectedNetwork)}
                  required={method === 'CRYPTO'}
                />
                <p className="text-xs text-muted-foreground">
                  {t.walletAddressWarning}
                </p>
              </div>

              {/* Memo/Tag si requis */}
              {needsMemo && (
                <div className="space-y-2">
                  <Label htmlFor="memo" className="flex items-center gap-2">
                    {t.memoTag}
                    <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded font-medium">{t.memoRequired}</span>
                  </Label>
                  <Input
                    id="memo"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder={t.memoPlaceholder}
                    required
                  />
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    {t.memoWarning}
                  </p>
                </div>
              )}

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  {t.cryptoInfo}
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
                  {t.loading}
                </>
              ) : (
                <>
                  {method === 'SEPA' ? (
                    <Building2 className="w-4 h-4 mr-2" />
                  ) : (
                    <Wallet className="w-4 h-4 mr-2" />
                  )}
                  {t.submit} {quote && formatCents(quote.netCents)}
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              {t.terms}
            </p>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}

