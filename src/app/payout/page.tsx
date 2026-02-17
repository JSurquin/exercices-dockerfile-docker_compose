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
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { formatCentsToCurrency, toCents } from '@/lib/currency-converter';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PayoutMethod = 'sepa' | 'crypto';

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
  // Crypto
  walletAddress: string;
  selectedCrypto: string;
  selectedNetwork: string;
  memo: string;
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
    walletAddress: '',
    selectedCrypto: 'USDT',
    selectedNetwork: 'ERC20',
    memo: '',
  });
  const [payoutHistory, setPayoutHistory] = useState<Array<{
    id: string;
    amount: number;
    status: string;
    method: string;
    createdAt: string;
  }>>([]);
  const [availableBalanceCents, setAvailableBalanceCents] = useState<number | null>(null);

  // Traductions locales pour la page payout
  const text = messages.payoutPage;

  // Récupérer le solde disponible (API dédiée)
  const fetchBalance = useCallback(async () => {
    try {
      const response = await fetch('/api/user/balance');
      if (response.ok) {
        const data = await response.json();
        setAvailableBalanceCents(data.availableCents ?? 0);
      } else {
        setAvailableBalanceCents(0);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      setAvailableBalanceCents(0);
    }
  }, []);

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
      fetchBalance();
      fetchPayoutHistory();
    }
  }, [user, fetchBalance, fetchPayoutHistory]);

  // Pas de polling KYC sur la page payout : si le KYC est déjà validé, on ne touche plus à Kycaid.
  // Le retrait passe uniquement par Flexify (SEPA) ou Whitepay (crypto). Si le KYC n'est pas
  // validé, l'utilisateur voit le bloc "KYC requis" avec un lien vers /kyc.

  // Réseaux disponibles pour la crypto sélectionnée
  const availableNetworks = SUPPORTED_CRYPTOS.find((c) => c.ticker === formData.selectedCrypto)?.networks || [];
  const needsMemo = MEMO_REQUIRED_NETWORKS.includes(formData.selectedNetwork);

  // Obtenir un devis (Flexify pour SEPA, Whitepay pour Crypto)
  const getQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error(text.toast.amountTooLow);
      return;
    }

    const amountCents = toCents(parseFloat(amount));
    const balanceCents = availableBalanceCents ?? 0;

    if (amountCents > balanceCents) {
      toast.error(text.toast.insufficientBalance);
      return;
    }

    // Validation crypto
    if (payoutMethod === 'crypto') {
      if (!formData.walletAddress) {
        toast.error(text.request.cryptoWalletRequired || 'Adresse wallet requise');
        return;
      }
      if (needsMemo && !formData.memo) {
        toast.error(text.request.cryptoMemoRequired || 'Memo/Tag requis pour ce réseau');
        return;
      }
    }

    setIsLoadingQuote(true);
    try {
      // SEPA → Flexify  |  Crypto → Whitepay
      const quoteUrl = payoutMethod === 'sepa' ? '/api/flexify/quote' : '/api/whitepay/quote';
      const requestBody =
        payoutMethod === 'sepa'
          ? { amountCents, currency: 'EUR', method: 'SEPA' }
          : { amountCents, currency: 'EUR' };
      if (process.env.NODE_ENV === 'development') {
        console.log('[PAYOUT] getQuote request', { url: quoteUrl, method: payoutMethod, body: requestBody });
      }
      const response = await fetch(quoteUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage = typeof data?.error === 'string' ? data.error : data?.message ?? `HTTP ${response.status}`;
        if (process.env.NODE_ENV === 'development') {
          console.error('[PAYOUT] getQuote failed', { status: response.status, statusText: response.statusText, body: data });
        }
        throw new Error(errorMessage);
      }

      // L'API renvoie { quote, limits }; le front utilise la structure quote directement (avec quoteId si présent)
      const quotePayload = data.quote ? { ...data.quote, quoteId: data.quote.quoteId ?? `quote-${Date.now()}` } : data;
      setQuote(quotePayload);
      if (process.env.NODE_ENV === 'development') {
        console.log('[PAYOUT] getQuote success', quotePayload);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : text.toast.payoutError;
      console.error('[PAYOUT] getQuote error', error);
      toast.error(message);
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

    if (!user?.kycStatus || (user.kycStatus !== 'VERIFIED' && user.kycStatus !== 'KYCAID_VERIFIED')) {
      toast.error(text.kyc.required);
      return;
    }

    setIsLoading(true);
    try {
      const payload = payoutMethod === 'sepa' ? {
        quoteId: quote.quoteId,
        method: 'sepa',
        amountCents: quote.amountCents,
        iban: formData.iban.replace(/\s/g, ''),
        bic: formData.bic,
        accountHolder: formData.accountHolder,
      } : {
        quoteId: quote.quoteId,
        method: 'crypto',
        amountCents: quote.amountCents,
        walletAddress: formData.walletAddress,
        targetCurrency: formData.selectedCrypto,
        network: formData.selectedNetwork,
        memo: needsMemo ? formData.memo : undefined,
      };

      const apiUrl = payoutMethod === 'sepa' ? '/api/flexify/payout' : '/api/whitepay/withdrawal';

      if (process.env.NODE_ENV === 'development') {
        console.log('[PAYOUT] handleSubmit request', { url: apiUrl, payload });
      }
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        let errorMessage = typeof data?.error === 'string' ? data.error : data?.message ?? `HTTP ${response.status}`;
        if (data?.whitepayErrors) {
          console.error('[PAYOUT] Whitepay validation errors', data.whitepayErrors);
          if (process.env.NODE_ENV === 'development') {
            errorMessage += ` — Détails: ${JSON.stringify(data.whitepayErrors)}`;
          }
        }
        if (process.env.NODE_ENV === 'development') {
          console.error('[PAYOUT] handleSubmit failed', { status: response.status, statusText: response.statusText, body: data });
        }
        throw new Error(errorMessage);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[PAYOUT] handleSubmit success', data);
      }
      toast.success(text.toast.payoutCreated);
      setQuote(null);
      setAmount('');
      fetchBalance();
      fetchPayoutHistory();
    } catch (error) {
      const message = error instanceof Error ? error.message : text.toast.payoutError;
      console.error('[PAYOUT] handleSubmit error', error);
      toast.error(message);
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
  if (!user.kycStatus || (user.kycStatus !== 'VERIFIED' && user.kycStatus !== 'KYCAID_VERIFIED')) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-6 sm:p-8">
            <div className="relative">
              <ShieldCheckIcon className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
              {process.env.NODE_ENV === 'development' && (
                <ArrowPathIcon className="w-6 h-6 absolute top-0 right-1/3 text-blue-500 animate-spin" />
              )}
            </div>
            <h2 className="text-xl font-semibold mb-2">{text.kyc.required}</h2>
            <p className="text-muted-foreground mb-6">{text.kyc.description}</p>
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-blue-500 mb-4">
                🔄 Vérification automatique en cours... (polling toutes les 10s)
              </p>
            )}
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
                      {availableBalanceCents === null
                        ? '—'
                        : formatCentsToCurrency(availableBalanceCents, 'EUR')}
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
                    <TabsTrigger value="crypto" className="flex items-center gap-2">
                      <CurrencyDollarIcon className="w-4 h-4" />
                      Crypto
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

                  <TabsContent value="crypto" className="space-y-4 mt-4">
                    <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <InformationCircleIcon className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-purple-700 dark:text-purple-300">{text.request.security.cryptoInfo}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Sélection de la crypto-monnaie */}
                      <div className="space-y-2">
                        <Label htmlFor="crypto">{text.request.cryptoLabel}</Label>
                        <Select
                          value={formData.selectedCrypto}
                          onValueChange={(v) => {
                            const crypto = SUPPORTED_CRYPTOS.find((c) => c.ticker === v);
                            setFormData(prev => ({
                              ...prev,
                              selectedCrypto: v,
                              selectedNetwork: crypto?.networks[0] || 'ERC20',
                            }));
                            setQuote(null);
                          }}
                        >
                          <SelectTrigger id="crypto">
                            <SelectValue placeholder={text.request.cryptoPlaceholder} />
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPORTED_CRYPTOS.map((c) => (
                              <SelectItem key={c.ticker} value={c.ticker}>
                                <span className="flex items-center gap-2">
                                  {c.name}
                                  {c.is_stable && (
                                    <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">Stablecoin</span>
                                  )}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Sélection du réseau */}
                      <div className="space-y-2">
                        <Label htmlFor="network">{text.request.networkLabel}</Label>
                        <Select
                          value={formData.selectedNetwork}
                          onValueChange={(v) => {
                            setFormData(prev => ({ ...prev, selectedNetwork: v }));
                            setQuote(null);
                          }}
                        >
                          <SelectTrigger id="network">
                            <SelectValue placeholder={text.request.networkPlaceholder} />
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

                      {/* Adresse du wallet */}
                      <div className="space-y-2">
                        <Label htmlFor="walletAddress">{text.request.walletAddressLabel}</Label>
                        <Input
                          id="walletAddress"
                          value={formData.walletAddress}
                          onChange={(e) => setFormData(prev => ({ ...prev, walletAddress: e.target.value.trim() }))}
                          placeholder={getAddressPlaceholder(formData.selectedNetwork)}
                        />
                        <p className="text-xs text-muted-foreground">{text.request.walletAddressWarning}</p>
                      </div>

                      {/* Memo/Tag (si requis par le réseau) */}
                      {needsMemo && (
                        <div className="space-y-2">
                          <Label htmlFor="memo" className="flex items-center gap-2">
                            {text.request.memoLabel}
                            <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded font-medium">{text.request.memoRequired}</span>
                          </Label>
                          <Input
                            id="memo"
                            value={formData.memo}
                            onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
                            placeholder={text.request.memoPlaceholder}
                          />
                          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                            <p className="text-xs text-yellow-700 dark:text-yellow-300">{text.request.memoWarning}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Bouton Obtenir devis */}
                {!quote && (
                  <Button
                    onClick={getQuote}
                    disabled={isLoadingQuote || !amount || availableBalanceCents === null}
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
                            {payout.method === 'FLEXIFY_SEPA' ? 'SEPA' : payout.method === 'WHITEPAY_CRYPTO' ? 'Crypto' : payout.method}
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

