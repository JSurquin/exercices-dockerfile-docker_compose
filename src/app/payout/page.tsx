'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { CurrencyDollarIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { formatCentsToCurrency, toCents } from '@/lib/currency-converter';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PayoutMethod = 'card' | 'sepa' | 'crypto';

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

// Minimum retrait crypto (Whitepay) : 21,20 €
const CRYPTO_MIN_CENTS = 2120;

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
  // Card (Flexify)
  cardNumber: string;
  cardHolder: string;
  expireMonth: string;
  expireYear: string;
  cvv: string;
  // SEPA — prénom / nom séparés (requis Flexify)
  iban: string;
  bic: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  beneficiaryCity: string;
  beneficiaryCountry: string;
  beneficiaryEmail: string;
  // Crypto
  walletAddress: string;
  selectedCrypto: string;
  selectedNetwork: string;
  memo: string;
}

export default function PayoutPage() {
  const { user } = useAuth();
  const { messages, locale } = useLocale();
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>('card');
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [formData, setFormData] = useState<PayoutFormData>({
    cardNumber: '',
    cardHolder: '',
    expireMonth: '',
    expireYear: '',
    cvv: '',
    iban: '',
    bic: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    beneficiaryCity: '',
    beneficiaryCountry: 'FR',
    beneficiaryEmail: '',
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
  const [savedSepaMethods, setSavedSepaMethods] = useState<Array<{ id: string; maskedIban: string | null; maskedBic: string | null }>>([]);
  const [useSavedIban, setUseSavedIban] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [savedCardMethods, setSavedCardMethods] = useState<Array<{ id: string; last4: string | null; holderName: string | null }>>([]);
  const [useSavedCard, setUseSavedCard] = useState(false);
  const [selectedCardMethodId, setSelectedCardMethodId] = useState<string | null>(null);
  const [savedCryptoMethods, setSavedCryptoMethods] = useState<Array<{
    id: string;
    maskedAddress: string | null;
    address: string;
    network: string | null;
    targetCurrency: string | null;
    memo: string | null;
  }>>([]);
  const [useSavedWallet, setUseSavedWallet] = useState(false);
  const [selectedCryptoMethodId, setSelectedCryptoMethodId] = useState<string | null>(null);

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

  // Moyens de paiement enregistrés (IBAN / carte / wallet)
  const fetchPaymentMethods = useCallback(async () => {
    try {
      const response = await fetch('/api/payment-methods');
      if (response.ok) {
        const data = await response.json();
        const all = data.paymentMethods || [];
        const sepa = all.filter((m: { type: string }) => m.type === 'SEPA' || m.type === 'FLEXIFY_SEPA');
        const card = all.filter((m: { type: string }) => m.type === 'FLEXIFY_CARD' || m.type === 'CARD');
        const crypto = all.filter((m: { type: string }) => m.type === 'WHITEPAY_CRYPTO' || m.type === 'CRYPTO');
        setSavedSepaMethods(sepa);
        setSavedCardMethods(card.map((m: { id: string; last4: string | null; holderName: string | null }) => ({ id: m.id, last4: m.last4 ?? null, holderName: m.holderName ?? null })));
        setSavedCryptoMethods(crypto.map((m: { id: string; maskedAddress: string | null; address?: string; network: string | null; targetCurrency: string | null; memo: string | null }) => ({
          id: m.id,
          maskedAddress: m.maskedAddress ?? null,
          address: m.address ?? '',
          network: m.network ?? null,
          targetCurrency: m.targetCurrency ?? null,
          memo: m.memo ?? null,
        })));
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchBalance();
      fetchPayoutHistory();
      fetchPaymentMethods();
    }
  }, [user, fetchBalance, fetchPayoutHistory, fetchPaymentMethods]);

  // Pré-sélectionner les moyens enregistrés au premier chargement
  const hasSetSepaDefault = useRef(false);
  const hasSetCardDefault = useRef(false);
  const hasSetCryptoDefault = useRef(false);
  useEffect(() => {
    if (savedSepaMethods.length > 0 && !hasSetSepaDefault.current) {
      hasSetSepaDefault.current = true;
      setUseSavedIban(true);
      setSelectedPaymentMethodId(savedSepaMethods[0].id);
    }
  }, [savedSepaMethods]);
  useEffect(() => {
    if (savedCardMethods.length > 0 && !hasSetCardDefault.current) {
      hasSetCardDefault.current = true;
      setUseSavedCard(true);
      setSelectedCardMethodId(savedCardMethods[0].id);
      setFormData(prev => ({ ...prev, cardHolder: savedCardMethods[0].holderName ?? '' }));
    }
  }, [savedCardMethods]);
  useEffect(() => {
    if (savedCryptoMethods.length > 0 && !hasSetCryptoDefault.current) {
      hasSetCryptoDefault.current = true;
      const first = savedCryptoMethods[0];
      setUseSavedWallet(true);
      setSelectedCryptoMethodId(first.id);
      setFormData(prev => ({
        ...prev,
        walletAddress: first.address,
        selectedCrypto: first.targetCurrency ?? prev.selectedCrypto,
        selectedNetwork: first.network ?? prev.selectedNetwork,
        memo: first.memo ?? '',
      }));
    }
  }, [savedCryptoMethods]);

  // Synchroniser le formulaire quand on change de carte ou wallet enregistré
  useEffect(() => {
    if (useSavedCard && selectedCardMethodId) {
      const card = savedCardMethods.find((c) => c.id === selectedCardMethodId);
      if (card) setFormData(prev => ({ ...prev, cardHolder: card.holderName ?? '' }));
    }
  }, [useSavedCard, selectedCardMethodId, savedCardMethods]);
  useEffect(() => {
    if (useSavedWallet && selectedCryptoMethodId) {
      const w = savedCryptoMethods.find((c) => c.id === selectedCryptoMethodId);
      if (w) {
        setFormData(prev => ({
          ...prev,
          walletAddress: w.address,
          selectedCrypto: w.targetCurrency ?? prev.selectedCrypto,
          selectedNetwork: w.network ?? prev.selectedNetwork,
          memo: w.memo ?? '',
        }));
      }
    }
  }, [useSavedWallet, selectedCryptoMethodId, savedCryptoMethods]);

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

    // Validation crypto : minimum 21,20 € (exigence API Whitepay)
    if (payoutMethod === 'crypto') {
      if (amountCents < CRYPTO_MIN_CENTS) {
        toast.error(text.request.cryptoMinAmount ?? `Montant minimum pour la crypto : 21,20 €`);
        return;
      }
    }

    // Validation crypto (wallet, memo)
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
      // Card & SEPA → Flexify  |  Crypto → Whitepay
      const quoteUrl = payoutMethod === 'crypto' ? '/api/whitepay/quote' : '/api/flexify/quote';
      const requestBody =
        payoutMethod === 'crypto'
          ? { amountCents, currency: 'EUR' }
          : { amountCents, currency: 'EUR', method: payoutMethod === 'card' ? 'CARD' : 'SEPA' };
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

    if (payoutMethod === 'card') {
      const cardNum = formData.cardNumber.replace(/\s/g, '');
      if (!cardNum || cardNum.length < 13) {
        toast.error(text.request.cardNumberRequired ?? 'Numéro de carte requis');
        return;
      }
      if (!formData.cardHolder.trim()) {
        toast.error(text.request.cardHolderRequired ?? 'Titulaire de la carte requis');
        return;
      }
      if (!formData.expireMonth || !formData.expireYear) {
        toast.error(text.request.cardExpiryRequired ?? 'Date d\'expiration requise');
        return;
      }
      if (!formData.cvv || formData.cvv.length < 3) {
        toast.error(text.request.cardCvvRequired ?? 'CVV requis');
        return;
      }
    }
    if (payoutMethod === 'sepa') {
      if (!formData.firstName?.trim()) {
        toast.error(text.request.firstNameLabel ? `${text.request.firstNameLabel} requis` : 'Prénom requis');
        return;
      }
      if (!formData.lastName?.trim()) {
        toast.error(text.request.lastNameLabel ? `${text.request.lastNameLabel} requis` : 'Nom requis');
        return;
      }
      if (useSavedIban && selectedPaymentMethodId) {
        // OK : on envoie paymentMethodId, l'API déchiffre l'IBAN côté serveur
      } else if (!formData.iban.replace(/\s/g, '')) {
        toast.error(text.request.ibanLabel ? `${text.request.ibanLabel} requis` : 'IBAN requis');
        return;
      }
    }

    setIsLoading(true);
    try {
      const firstName = formData.firstName.trim();
      const lastName = formData.lastName.trim();
      let payload: Record<string, unknown>;
      let apiUrl: string;
      if (payoutMethod === 'card') {
        apiUrl = '/api/flexify/payout';
        payload = {
          quoteId: quote.quoteId,
          method: 'card',
          amountCents: quote.amountCents,
          cardNumber: formData.cardNumber.replace(/\s/g, ''),
          cardHolder: formData.cardHolder.trim(),
          expireMonth: formData.expireMonth.padStart(2, '0'),
          expireYear: formData.expireYear.length === 2 ? `20${formData.expireYear}` : formData.expireYear,
          cvv: formData.cvv,
          firstName,
          lastName,
        };
      } else if (payoutMethod === 'sepa') {
        apiUrl = '/api/flexify/payout';
        payload = {
          quoteId: quote.quoteId,
          method: 'sepa',
          amountCents: quote.amountCents,
          firstName,
          lastName,
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          beneficiaryCity: formData.beneficiaryCity.trim(),
          beneficiaryCountry: formData.beneficiaryCountry || 'FR',
          beneficiaryEmail: formData.beneficiaryEmail.trim(),
          ...(useSavedIban && selectedPaymentMethodId
            ? { paymentMethodId: selectedPaymentMethodId }
            : {
                iban: formData.iban.replace(/\s/g, ''),
                bic: formData.bic,
              }),
        };
      } else {
        apiUrl = '/api/whitepay/withdrawal';
        payload = {
          quoteId: quote.quoteId,
          method: 'crypto',
          amountCents: quote.amountCents,
          walletAddress: formData.walletAddress,
          targetCurrency: formData.selectedCrypto,
          network: formData.selectedNetwork,
          memo: needsMemo ? formData.memo : undefined,
        };
      }

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
      fetchPaymentMethods();
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

                {/* Méthode de paiement — SEPA masqué (non dispo France Flexify), décommenter pour réactiver */}
                <Tabs value={payoutMethod} onValueChange={(v) => {
                  setPayoutMethod(v as PayoutMethod);
                  setQuote(null);
                }}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="card" className="flex items-center gap-2">
                      <CreditCardIcon className="w-4 h-4" />
                      {text.request.cardLabel ?? 'Carte'}
                    </TabsTrigger>
                    {/* SEPA masqué — Flexify non dispo en France
                    <TabsTrigger value="sepa" className="flex items-center gap-2">
                      <BanknotesIcon className="w-4 h-4" />
                      SEPA
                    </TabsTrigger>
                    */}
                    <TabsTrigger value="crypto" className="flex items-center gap-2">
                      <CurrencyDollarIcon className="w-4 h-4" />
                      Crypto
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="card" className="space-y-4 mt-4">
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <InformationCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-emerald-700 dark:text-emerald-300">{text.request.security.cardInfo ?? 'Retrait vers votre carte bancaire (Flexify). Généralement crédité sous 24h.'}</p>
                      </div>
                    </div>
                    {savedCardMethods.length > 0 && (
                      <div className="space-y-2">
                        <Label>{text.request.savedCardLabel ?? 'Carte'}</Label>
                        <div className="flex flex-col gap-2">
                          {savedCardMethods.map((pm) => (
                            <label key={pm.id} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
                              <input
                                type="radio"
                                name="card-source"
                                checked={useSavedCard && selectedCardMethodId === pm.id}
                                onChange={() => {
                                  setUseSavedCard(true);
                                  setSelectedCardMethodId(pm.id);
                                }}
                                className="h-4 w-4"
                              />
                              <span className="text-sm">
                                {text.request.useSavedCard ?? 'Utiliser la carte enregistrée'}: **** {pm.last4 ?? '••••'}
                                {pm.holderName ? ` — ${pm.holderName}` : ''}
                              </span>
                            </label>
                          ))}
                          <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
                            <input
                              type="radio"
                              name="card-source"
                              checked={!useSavedCard}
                              onChange={() => {
                                setUseSavedCard(false);
                                setSelectedCardMethodId(null);
                              }}
                              className="h-4 w-4"
                            />
                            <span className="text-sm">{text.request.enterNewCard ?? 'Saisir une nouvelle carte'}</span>
                          </label>
                        </div>
                        <p className="text-xs text-muted-foreground">{text.request.savedCardHint ?? 'Le titulaire sera pré-rempli ; saisissez le numéro de carte pour ce retrait.'}</p>
                      </div>
                    )}
                    {(!useSavedCard || savedCardMethods.length === 0) && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">{text.request.cardNumberLabel ?? 'Numéro de carte'}</Label>
                        <Input
                          id="cardNumber"
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-number"
                          placeholder="1234 5678 9012 3456"
                          value={formData.cardNumber}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '').slice(0, 19);
                            setFormData(prev => ({ ...prev, cardNumber: v.replace(/(\d{4})/g, '$1 ').trim() }));
                            setQuote(null);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardHolder">{text.request.cardHolderLabel ?? 'Titulaire de la carte'}</Label>
                        <Input
                          id="cardHolder"
                          autoComplete="cc-name"
                          placeholder="Jean Dupont"
                          value={formData.cardHolder}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, cardHolder: e.target.value }));
                            setQuote(null);
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expireMonth">{text.request.cardExpireMonthLabel ?? 'Mois'}</Label>
                          <Select
                            value={formData.expireMonth}
                            onValueChange={(v) => {
                              setFormData(prev => ({ ...prev, expireMonth: v }));
                              setQuote(null);
                            }}
                          >
                            <SelectTrigger id="expireMonth">
                              <SelectValue placeholder="MM" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map((m) => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expireYear">{text.request.cardExpireYearLabel ?? 'Année'}</Label>
                          <Input
                            id="expireYear"
                            placeholder="AA"
                            maxLength={4}
                            value={formData.expireYear}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                              setFormData(prev => ({ ...prev, expireYear: v }));
                              setQuote(null);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">{text.request.cardCvvLabel ?? 'CVV'}</Label>
                          <Input
                            id="cvv"
                            type="password"
                            inputMode="numeric"
                            autoComplete="cc-csc"
                            placeholder="•••"
                            maxLength={4}
                            value={formData.cvv}
                            onChange={(e) => {
                              setFormData(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }));
                              setQuote(null);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    )}
                    {(!useSavedCard || savedCardMethods.length === 0) && (
                      <p className="text-xs text-muted-foreground">{text.request.saveCardHint ?? 'Cette carte sera enregistrée après ce retrait pour vos prochains retraits.'}</p>
                    )}
                  </TabsContent>

                  {/* SEPA (masqué — Flexify non dispo France) : décommenter le TabsTrigger ci‑dessus + ce bloc depuis l’historique git si besoin
                  <TabsContent value="sepa" className="space-y-4 mt-4">...</TabsContent>
                  */}

                  <TabsContent value="crypto" className="space-y-4 mt-4">
                    <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <InformationCircleIcon className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-purple-700 dark:text-purple-300">{text.request.security.cryptoInfo}</p>
                      </div>
                    </div>

                    {savedCryptoMethods.length > 0 && (
                      <div className="space-y-2">
                        <Label>{text.request.savedWalletLabel ?? 'Wallet'}</Label>
                        <div className="flex flex-col gap-2">
                          {savedCryptoMethods.map((pm) => (
                            <label key={pm.id} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
                              <input
                                type="radio"
                                name="crypto-source"
                                checked={useSavedWallet && selectedCryptoMethodId === pm.id}
                                onChange={() => {
                                  setUseSavedWallet(true);
                                  setSelectedCryptoMethodId(pm.id);
                                }}
                                className="h-4 w-4"
                              />
                              <span className="text-sm">
                                {text.request.useSavedWallet ?? 'Utiliser le wallet enregistré'}: <strong>{pm.maskedAddress ?? '••••'}</strong>
                                {pm.network ? ` (${pm.network})` : ''} {pm.targetCurrency ? ` — ${pm.targetCurrency}` : ''}
                              </span>
                            </label>
                          ))}
                          <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
                            <input
                              type="radio"
                              name="crypto-source"
                              checked={!useSavedWallet}
                              onChange={() => {
                                setUseSavedWallet(false);
                                setSelectedCryptoMethodId(null);
                              }}
                              className="h-4 w-4"
                            />
                            <span className="text-sm">{text.request.enterNewWallet ?? 'Saisir un nouveau wallet'}</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {(!useSavedWallet || savedCryptoMethods.length === 0) && (
                    <>
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
                    <p className="text-xs text-muted-foreground">{text.request.saveWalletHint ?? 'Ce wallet sera enregistré après ce retrait pour vos prochains retraits.'}</p>
                    </>
                    )}
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

