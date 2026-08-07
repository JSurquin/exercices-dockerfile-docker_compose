'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/components/providers/auth-provider';
import { useLocale } from '@/components/providers/locale-provider';
import {
  BanknotesIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { CurrencyDollarIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { Snowflake } from 'lucide-react';
import { toast } from 'sonner';
import { formatCentsToCurrency, toCents } from '@/lib/currency-converter';
import { LoginRequiredBlock } from '@/components/auth/require-auth';
import { PageLoading } from '@/components/ui/page-loading';
import { FeePreview, computeFees } from '@/components/payout/FeePreview';
import { NetReceivePreview } from '@/components/payout/NetReceivePreview';
import { SepaFrPremiumHint } from '@/components/payout/SepaFrPremiumHint';
import {
  WHITEPAY_SUPPORTED_CRYPTOS,
  MEMO_REQUIRED_NETWORKS,
  getWhitepayAddressPlaceholder,
  formatWhitepayNetworkFeeLabel,
} from '@/lib/whitepay';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { validateSepaIban, isFrenchIban } from '@/lib/iban-sepa';

type PayoutMethod = 'card' | 'sepa' | 'crypto' | 'sepa_fr';

const CRYPTO_MIN_CENTS = 2120;

/** Neutral SEPA zone examples — not tied to a single country (SEPA Premium accepts all zone IBANs). */
const SEPA_ZONE_IBAN_PLACEHOLDER = 'DE89 3704 0044 0532 0130 00';
const SEPA_ZONE_BIC_PLACEHOLDER = 'COBADEFFXXX';

/** Returns SEPA Premium delay label for closed card display. */
function formatSepaPremiumDelayLabel(delay?: string): string | undefined {
  return delay;
}

type SecondaryPayoutMethod = 'card' | 'sepa' | 'crypto';

function isSecondaryPayoutMethod(method: PayoutMethod | null): method is SecondaryPayoutMethod {
  return method === 'card' || method === 'sepa' || method === 'crypto';
}

const PAYOUT_SUBMIT_BTN_CLASS =
  'w-full h-11 text-base font-semibold bg-theme-accent text-white border border-theme-accent shadow-[0_4px_16px_color-mix(in_srgb,var(--theme-accent)_40%,transparent)] hover:brightness-110 hover:shadow-[0_6px_24px_color-mix(in_srgb,var(--theme-accent)_50%,transparent)] focus-visible:ring-theme-accent/40 disabled:bg-muted/50 disabled:text-muted-foreground disabled:border-border/60 disabled:shadow-none disabled:opacity-100 disabled:brightness-100 disabled:hover:brightness-100';

/** Flexify envoie processingFeeCents / Whitepay processingCents, évite NaN dans le récap */
function normalizeWithdrawalFeesCents(fees: unknown): { processingCents: number; networkCents: number } {
  if (!fees || typeof fees !== 'object') return { processingCents: 0, networkCents: 0 };
  const o = fees as Record<string, unknown>;
  const processing =
    typeof o.processingFeeCents === 'number'
      ? o.processingFeeCents
      : typeof o.processingCents === 'number'
        ? o.processingCents
        : 0;
  const network =
    typeof o.networkFeeCents === 'number'
      ? o.networkFeeCents
      : typeof o.networkCents === 'number'
        ? o.networkCents
        : 0;
  return { processingCents: processing, networkCents: network };
}

/** amount API = brut déduit du solde ; netAmount = montant effectivement viré */
function netReceivedFromHistoryRow(payout: {
  amount: number;
  fees?: number;
  netAmount?: number;
}): { grossCents: number; netCents: number } {
  const grossCents = Number(payout.amount) || 0;
  const feesTotal = typeof payout.fees === 'number' ? payout.fees : 0;
  let netCents =
    typeof payout.netAmount === 'number' && !Number.isNaN(payout.netAmount)
      ? payout.netAmount
      : grossCents - feesTotal;
  if (netCents < 0) netCents = 0;
  return { grossCents, netCents };
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
  // SEPA, prénom / nom séparés (requis Flexify)
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
  const { user, isLoading: authLoading } = useAuth();
  const { messages, locale } = useLocale();
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>('sepa_fr');
  const [expandedMethod, setExpandedMethod] = useState<PayoutMethod | null>(null);
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
    selectedNetwork: 'TRC20',
    memo: '',
  });
  const [useSavedIban, setUseSavedIban] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [useSavedCard, setUseSavedCard] = useState(false);
  const [selectedCardMethodId, setSelectedCardMethodId] = useState<string | null>(null);
  const [useSavedWallet, setUseSavedWallet] = useState(false);
  const [selectedCryptoMethodId, setSelectedCryptoMethodId] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expandedMethodRef = useRef<HTMLDivElement | null>(null);

  // SEPA France form state
  const [sepaFrForm, setSepaFrForm] = useState({
    iban: '',
    bic: '',
    firstName: '',
    lastName: '',
  });
  const [sepaFrLoading, setSepaFrLoading] = useState(false);
  const [sepaFrResult, setSepaFrResult] = useState<{ reference: string; amountCents: number } | null>(null);

  const [payoutResult, setPayoutResult] = useState<{
    id: string;
    reference: string;
    status: string;
    amountCents: number;
    fees?: unknown;
    netCents?: number;
    method: string;
    pendingApproval?: boolean;
  } | null>(null);

  // Traductions locales pour la page payout
  const text = messages.payoutPage;
  const feeLabels = messages.payoutComponents.fees;
  const howItWorks = text.howItWorks;

  const secondaryMethodsMeta = useMemo(
    () =>
      [
        {
          id: 'card' as const,
          icon: CreditCardIcon,
          label: text.request.cardLabel,
          fee: feeLabels.cardLabel,
          delay: feeLabels.cardDelay,
          iconColor: 'text-emerald-500',
        },
        {
          id: 'sepa' as const,
          icon: BanknotesIcon,
          label: 'SEPA',
          fee: feeLabels.sepaLabel,
          delay: feeLabels.sepaDelay,
          iconColor: 'text-blue-500',
        },
        {
          id: 'crypto' as const,
          icon: CurrencyDollarIcon,
          label: 'Crypto',
          fee: feeLabels.cryptoLabel,
          delay: undefined as string | undefined,
          iconColor: 'text-purple-500',
        },
      ] as const,
    [text.request.cardLabel, feeLabels.cardLabel, feeLabels.cardDelay, feeLabels.sepaLabel, feeLabels.sepaDelay, feeLabels.cryptoLabel],
  );

  const isSecondaryExpanded = isSecondaryPayoutMethod(expandedMethod);
  const orderedSecondaryMethods = useMemo(() => {
    if (!isSecondaryExpanded || !expandedMethod) return [...secondaryMethodsMeta];
    const active = secondaryMethodsMeta.find((m) => m.id === expandedMethod);
    const rest = secondaryMethodsMeta.filter((m) => m.id !== expandedMethod);
    return active ? [active, ...rest] : [...secondaryMethodsMeta];
  }, [secondaryMethodsMeta, isSecondaryExpanded, expandedMethod]);

  const queryClient = useQueryClient();

  const { data: balanceData } = useQuery({
    queryKey: queryKeys.userBalance,
    queryFn: async () => {
      const response = await fetch('/api/user/balance');
      if (!response.ok) return { availableCents: 0, frozenBalanceCents: 0 };
      return response.json();
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
  });
  const availableBalanceCents = balanceData?.availableCents ?? null;
  const frozenBalanceCents = balanceData?.frozenBalanceCents ?? null;

  const sepaFrSubmitReady = useMemo(() => {
    if (!amount || availableBalanceCents === null) return false;
    const parsed = parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) return false;
    const amountCents = toCents(parsed);
    if (amountCents < 1000 || amountCents > availableBalanceCents) return false;
    if (!sepaFrForm.firstName.trim() || !sepaFrForm.lastName.trim()) return false;
    const ibanClean = sepaFrForm.iban.replace(/\s/g, '').toUpperCase();
    return validateSepaIban(ibanClean).isValid;
  }, [amount, availableBalanceCents, sepaFrForm]);

  const { data: historyData } = useQuery({
    queryKey: queryKeys.payoutHistory,
    queryFn: async () => {
      const response = await fetch('/api/payouts/history');
      if (!response.ok) return { payouts: [] };
      return response.json();
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
  });
  const payoutHistory = useMemo(
    () =>
      (historyData?.payouts ?? []) as Array<{
        id: string;
        amount: number;
        fees?: number;
        netAmount?: number;
        status: string;
        method: string;
        createdAt: string;
        paidAt?: string | null;
        balanceDebitedAt?: string | null;
      }>,
    [historyData],
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Polling actif : on déclenche la réconciliation côté serveur dès qu'on arrive
  // sur la page, puis toutes les 15 secondes tant qu'il reste un payout non-final.
  // Le serveur interroge directement Flexify/Whitepay (filet de sécurité si le
  // webhook a été manqué).
  // ───────────────────────────────────────────────────────────────────────────
  const FINAL_STATUSES_UPPER = useMemo(
    () => new Set([
      'PAID', 'FLEXIFY_PAID', 'WHITEPAY_COMPLETE',
      'FAILED', 'FLEXIFY_FAILED', 'WHITEPAY_DECLINED',
      'CANCELLED',
    ]),
    [],
  );
  /** Échecs explicites, balanceDebitedAt peut être non-null (verrou onFailed), sans aucun paiement réussi */
  const TERMINAL_FAILURE_UPPER = useMemo(
    () => new Set(['FAILED', 'FLEXIFY_FAILED', 'WHITEPAY_DECLINED', 'CANCELLED']),
    [],
  );
  const hasNonFinalPayout = useMemo(
    () =>
      payoutHistory.some((p) => {
        const u = p.status.toUpperCase();
        if (FINAL_STATUSES_UPPER.has(u)) return false;
        // paidAt n’est posé qu’en succès ; ne pas couper le polling si statut = échec
        if (p.paidAt && !TERMINAL_FAILURE_UPPER.has(u)) return false;
        return true;
      }),
    [payoutHistory, FINAL_STATUSES_UPPER, TERMINAL_FAILURE_UPPER],
  );

  const isManualReconcileRef = useRef(false);

  const { isFetching: isReconciling, refetch: triggerReconcile } = useQuery({
    queryKey: ['payout-reconcile-page'],
    queryFn: async () => {
      const url = isManualReconcileRef.current
        ? '/api/user/payouts/reconcile?manual=true'
        : '/api/user/payouts/reconcile';
      isManualReconcileRef.current = false;
      const r = await fetch(url);
      if (!r.ok) return { results: [] };
      const data = await r.json();
      // Si quelque chose a bougé, on rafraîchit l'historique et la balance
      if (Array.isArray(data?.results) && data.results.some((x: { action: string }) => x.action === 'debited' || x.action === 'failed')) {
        queryClient.invalidateQueries({ queryKey: queryKeys.payoutHistory });
        queryClient.invalidateQueries({ queryKey: queryKeys.userBalance });
      }
      return data;
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    refetchInterval: hasNonFinalPayout ? 15_000 : false,
    staleTime: 0,
    retry: false,
  });

  const { data: paymentMethodsData } = useQuery({
    queryKey: queryKeys.paymentMethods,
    queryFn: async () => {
      const response = await fetch('/api/payment-methods');
      if (!response.ok) return { paymentMethods: [] };
      return response.json();
    },
    enabled: !!user,
  });

  const allPaymentMethods = paymentMethodsData?.paymentMethods ?? [];
  const savedSepaMethods = useMemo(
    () => allPaymentMethods.filter((m: { type: string }) => m.type === 'SEPA' || m.type === 'FLEXIFY_SEPA'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paymentMethodsData]
  );
  const savedCardMethods = useMemo(
    () => allPaymentMethods
      .filter((m: { type: string }) => m.type === 'FLEXIFY_CARD' || m.type === 'CARD')
      .map((m: { id: string; last4: string | null; holderName: string | null }) => ({ id: m.id, last4: m.last4 ?? null, holderName: m.holderName ?? null })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paymentMethodsData]
  );
  const savedCryptoMethods = useMemo(
    () => allPaymentMethods
      .filter((m: { type: string }) => m.type === 'WHITEPAY_CRYPTO' || m.type === 'CRYPTO')
      .map((m: { id: string; maskedAddress: string | null; network: string | null; targetCurrency: string | null; memo: string | null }) => ({
        id: m.id,
        maskedAddress: m.maskedAddress ?? null,
        network: m.network ?? null,
        targetCurrency: m.targetCurrency ?? null,
        memo: m.memo ?? null,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paymentMethodsData]
  );

  // Cleanup du polling au démontage
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, []);

  // Évite que le contenu d'une carte ouverte ne passe sous la navbar sticky
  useEffect(() => {
    if (!expandedMethod) return;
    const el = expandedMethodRef.current;
    if (!el) return;
    const headerOffset = 80;
    const rect = el.getBoundingClientRect();
    if (rect.top < headerOffset) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollBy({
        top: rect.top - headerOffset,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    }
  }, [expandedMethod]);

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
        walletAddress: '',
        selectedCrypto: first.targetCurrency ?? prev.selectedCrypto,
        selectedNetwork: first.network ?? prev.selectedNetwork,
        memo: first.memo ?? '',
      }));
    }
  }, [savedCryptoMethods]);

  // Refs stables pour éviter les boucles de re-render dans les useEffect de synchro
  const savedCardMethodsRef = useRef(savedCardMethods);
  savedCardMethodsRef.current = savedCardMethods;
  const savedCryptoMethodsRef = useRef(savedCryptoMethods);
  savedCryptoMethodsRef.current = savedCryptoMethods;

  // Synchroniser le formulaire quand on change de carte ou wallet enregistré
  useEffect(() => {
    if (useSavedCard && selectedCardMethodId) {
      const card = savedCardMethodsRef.current.find((c: { id: string }) => c.id === selectedCardMethodId) as { id: string; last4: string | null; holderName: string | null } | undefined;
      if (card) setFormData(prev => ({ ...prev, cardHolder: card.holderName ?? '' }));
    }
  }, [useSavedCard, selectedCardMethodId]);
  useEffect(() => {
    if (useSavedWallet && selectedCryptoMethodId) {
      const w = savedCryptoMethodsRef.current.find((c: { id: string }) => c.id === selectedCryptoMethodId) as
        { id: string; maskedAddress: string | null; network: string | null; targetCurrency: string | null; memo: string | null } | undefined;
      if (w) {
        setFormData(prev => ({
          ...prev,
          walletAddress: '',
          selectedCrypto: w.targetCurrency ?? prev.selectedCrypto,
          selectedNetwork: w.network ?? prev.selectedNetwork,
          memo: w.memo ?? '',
        }));
      }
    }
  }, [useSavedWallet, selectedCryptoMethodId]);

  // Pas de polling KYC sur la page payout : si le KYC est déjà validé, on ne touche plus à Kycaid.
  // Le retrait passe uniquement par Flexify (SEPA) ou Whitepay (crypto). Si le KYC n'est pas
  // validé, l'utilisateur voit le bloc "KYC requis" avec un lien vers /kyc.

  // Réseaux disponibles pour la crypto sélectionnée
  const availableNetworks = WHITEPAY_SUPPORTED_CRYPTOS.find((c) => c.ticker === formData.selectedCrypto)?.networks || [];
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
        toast.error(text.request.cryptoMinAmount);
        return;
      }
    }

    if (payoutMethod === 'sepa' && (!useSavedIban || !selectedPaymentMethodId)) {
      const ibanClean = formData.iban.replace(/\s/g, '').toUpperCase();
      if (isFrenchIban(ibanClean)) {
        toast.error(text.request.ibanFrWarningToast);
        return;
      }
    }

    // Validation crypto (wallet, memo), wallet chargé côté serveur si moyen enregistré
    if (payoutMethod === 'crypto') {
      const useRegisteredWallet = useSavedWallet && selectedCryptoMethodId;
      if (!useRegisteredWallet && !formData.walletAddress) {
        toast.error(text.request.cryptoWalletRequired);
        return;
      }
      if (needsMemo && !formData.memo) {
        toast.error(text.request.cryptoMemoRequired);
        return;
      }
    }

    setIsLoadingQuote(true);
    try {
      // Card & SEPA → Flexify  |  Crypto → Whitepay
      const quoteUrl = payoutMethod === 'crypto' ? '/api/whitepay/quote' : '/api/flexify/quote';
      const requestBody =
        payoutMethod === 'crypto'
          ? {
              amountCents,
              currency: 'EUR',
              targetCurrency: formData.selectedCrypto,
              network: formData.selectedNetwork,
            }
          : { amountCents, currency: 'EUR', method: payoutMethod === 'card' ? 'CARD' : 'SEPA' };
      const response = await fetch(quoteUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage = typeof data?.error === 'string' ? data.error : data?.message ?? `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      // L'API renvoie { quote, limits }; le front utilise la structure quote directement (avec quoteId si présent)
      const quotePayload = data.quote ? { ...data.quote, quoteId: data.quote.quoteId ?? `quote-${Date.now()}` } : data;
      setQuote(quotePayload);
    } catch (error) {
      const message = error instanceof Error ? error.message : text.toast.payoutError;
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
      if (!useSavedCard || !selectedCardMethodId) {
        const cardNum = formData.cardNumber.replace(/\s/g, '');
        if (!cardNum || cardNum.length < 13) {
          toast.error(text.request.cardNumberRequired);
          return;
        }
        if (!formData.cardHolder.trim()) {
          toast.error(text.request.cardHolderRequired);
          return;
        }
        if (!formData.expireMonth || !formData.expireYear) {
          toast.error(text.request.cardExpiryRequired);
          return;
        }
        if (!formData.cvv || formData.cvv.length < 3) {
          toast.error(text.request.cardCvvRequired);
          return;
        }
      }
    }
    if (payoutMethod === 'sepa') {
      if (!formData.firstName?.trim()) {
        toast.error(text.request.firstLastNameRequired);
        return;
      }
      if (!formData.lastName?.trim()) {
        toast.error(text.request.firstLastNameRequired);
        return;
      }
      if (useSavedIban && selectedPaymentMethodId) {
        // OK : on envoie paymentMethodId, l'API déchiffre l'IBAN côté serveur
      } else {
        const ibanClean = formData.iban.replace(/\s/g, '').toUpperCase();
        if (!ibanClean) {
          toast.error(`${text.request.ibanLabel} required`);
          return;
        }
        if (isFrenchIban(ibanClean)) {
          toast.error(text.request.ibanFrWarningToast);
          return;
        }
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
          firstName,
          lastName,
          ...(useSavedCard && selectedCardMethodId
            ? { paymentMethodId: selectedCardMethodId }
            : {
                cardNumber: formData.cardNumber.replace(/\s/g, ''),
                cardHolder: formData.cardHolder.trim(),
                expireMonth: formData.expireMonth.padStart(2, '0'),
                expireYear: formData.expireYear.length === 2 ? `20${formData.expireYear}` : formData.expireYear,
                cvv: formData.cvv,
              }),
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
        apiUrl = '/api/whitepay/payout-request';
        const useRegisteredWallet = useSavedWallet && selectedCryptoMethodId;
        payload = useRegisteredWallet
          ? {
              quoteId: quote.quoteId,
              method: 'crypto',
              amountCents: quote.amountCents,
              paymentMethodId: selectedCryptoMethodId,
              targetCurrency: formData.selectedCrypto,
              network: formData.selectedNetwork,
              memo: needsMemo ? formData.memo : undefined,
            }
          : {
              quoteId: quote.quoteId,
              method: 'crypto',
              amountCents: quote.amountCents,
              walletAddress: formData.walletAddress,
              targetCurrency: formData.selectedCrypto,
              network: formData.selectedNetwork,
              memo: needsMemo ? formData.memo : undefined,
            };
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        let errorMessage = typeof data?.error === 'string' ? data.error : data?.message ?? `HTTP ${response.status}`;
        if (data?.whitepayErrors && process.env.NODE_ENV === 'development') {
          errorMessage += `, Details: ${JSON.stringify(data.whitepayErrors)}`;
        }
        // Carte obsolète supprimée côté serveur : on rafraîchit les méthodes et on bascule en saisie manuelle
        if (data?.code === 'CARD_STALE_DELETED') {
          queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods });
          setUseSavedCard(false);
          setSelectedCardMethodId(null);
        }
        throw new Error(errorMessage);
      }

      const successMessage = data?.pendingApproval && data?.message
        ? data.message
        : text.toast.payoutCreated;
      toast.success(successMessage);

      if (data?.payout) {
        setPayoutResult({
          ...data.payout,
          pendingApproval: !!data.pendingApproval,
        });
      }

      setQuote(null);
      setAmount('');
      queryClient.invalidateQueries({ queryKey: queryKeys.payoutHistory });
      queryClient.invalidateQueries({ queryKey: queryKeys.userBalance });
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods });

      // Polling pendant 2 minutes pour détecter le webhook Flexify (statut PAID)
      if (!data?.pendingApproval) {
        let attempts = 0;
        const maxAttempts = 24; // 24 × 5s = 2 min
        const poll = () => {
          attempts++;
          queryClient.invalidateQueries({ queryKey: queryKeys.payoutHistory });
          queryClient.invalidateQueries({ queryKey: queryKeys.userBalance });
          if (attempts < maxAttempts) {
            pollingRef.current = setTimeout(poll, 5000);
          }
        };
        if (pollingRef.current) clearTimeout(pollingRef.current);
        pollingRef.current = setTimeout(poll, 5000);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : text.toast.payoutError;
      console.error('[PAYOUT] handleSubmit error', error);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <PageLoading variant="compact" message={messages.common.loading} className="min-h-[50vh]" />
    );
  }

  // Pas connecté
  if (!user) {
    return (
      <LoginRequiredBlock
        icon={<BanknotesIcon className="w-16 h-16" />}
        title={text.loginRequired.title}
        description={text.loginRequired.description}
        buttonLabel={text.loginRequired.login}
      />
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
              <p className="text-xs text-blue-500 mb-4 flex items-center justify-center gap-1">
                <ArrowPathIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {text.request.autoVerification}
              </p>
            )}
            <Button 
              onClick={() => window.location.href = '/kyc'}
              className="bg-cta-gradient hover:brightness-110"
            >
              {text.kyc.startKyc}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /** Ne jamais déduire « Payé » de balanceDebitedAt : onFailed() le pose aussi (verrou sans débit utilisateur). */
  const displayPayoutStatus = (row: { status: string; paidAt?: string | null }) => {
    const u = row.status.toUpperCase();
    if (TERMINAL_FAILURE_UPPER.has(u)) return row.status;
    const successLike = new Set(['PAID', 'FLEXIFY_PAID', 'WHITEPAY_COMPLETE']);
    if (successLike.has(u)) return row.status;
    if (row.paidAt) return 'PAID';
    return row.status;
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'paid':
      case 'completed':
      case 'flexify_paid':
      case 'whitepay_complete':
        return <Badge className="bg-green-500">{text.history.status.paid}</Badge>;
      case 'processing':
      case 'scheduled':
      case 'flexify_pending':
      case 'flexify_processing':
      case 'whitepay_pending_withdrawal':
      case 'whitepay_processing_withdrawal':
        return <Badge className="bg-blue-500">{text.history.status.processing}</Badge>;
      case 'whitepay_waiting_confirmation':
      case 'verification_required':
      case 'verified':
        return <Badge className="bg-yellow-500">{text.history.status.verificationRequired}</Badge>;
      case 'failed':
      case 'flexify_failed':
      case 'whitepay_declined':
        return <Badge className="bg-red-500">{text.history.status.failed}</Badge>;
      case 'cancelled':
        return <Badge className="bg-slate-500">{text.history.status.cancelled}</Badge>;
      case 'pending_approval':
        return <Badge className="bg-theme-stat">{text.history.status.pendingApproval}</Badge>;
      default:
        return <Badge className="bg-yellow-500">{text.history.status.pending}</Badge>;
    }
  };

  const selectPayoutMethod = (method: PayoutMethod) => {
    setPayoutResult(null);
    setPayoutMethod(method);
    setExpandedMethod(method);
    setQuote(null);
    setSepaFrResult(null);
  };

  const renderFlexifyMethodActions = () => (
    <>
      {!payoutResult && amount && parseFloat(amount) > 0 && (
        <FeePreview
          method={payoutMethod as 'card' | 'sepa' | 'crypto'}
          amountCents={toCents(parseFloat(amount))}
          targetCurrency={payoutMethod === 'crypto' ? formData.selectedCrypto : undefined}
          network={payoutMethod === 'crypto' ? formData.selectedNetwork : undefined}
          labels={{
            feesPreview: text.request.feesPreview,
            grossAmount: text.request.grossAmount,
            youReceive: text.request.youReceive,
          }}
        />
      )}

      {!quote && !payoutResult && (
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
            text.request.submitButton
          )}
        </Button>
      )}

      {quote && !payoutResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/50 rounded-lg p-4 space-y-3"
        >
          <h3 className="font-semibold flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
            {text.request.confirmTitle}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{text.request.grossAmount}</span>
              <span>{formatCentsToCurrency(quote.amountCents, 'EUR')}</span>
            </div>
            <div className="flex justify-between text-theme-accent">
              <span>{text.request.processingFee}</span>
              <span>-{formatCentsToCurrency(quote.fees.processingCents, 'EUR')}</span>
            </div>
            <div className="flex justify-between text-theme-accent">
              <span>{text.request.networkFee}</span>
              <span>-{formatCentsToCurrency(quote.fees.networkCents, 'EUR')}</span>
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
            className="w-full bg-cta-gradient hover:brightness-110"
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
    </>
  );

  return (
    <div className="relative z-0 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">{text.title}</h1>
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
                <div className="flex flex-wrap gap-6 justify-start">
                  <div>
                    <p className="text-sm text-muted-foreground">{text.request.availableBalance}</p>
                    <p className="text-2xl font-bold text-green-500">
                      {availableBalanceCents === null
                        ? '-'
                        : formatCentsToCurrency(availableBalanceCents, 'EUR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Snowflake className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {text.request.frozenBalance}
                    </p>
                    <p className="text-2xl font-semibold text-muted-foreground">
                      {frozenBalanceCents === null
                        ? '-'
                        : formatCentsToCurrency(frozenBalanceCents, 'EUR')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {!payoutResult && (
                <>
                {/* Guide en 3 étapes */}
                <div className="rounded-lg border border-border/40 bg-muted/20 px-4 py-4 sm:px-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
                    {howItWorks.title}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-3">
                    {[
                      { num: '01', title: howItWorks.step1Title, desc: howItWorks.step1Desc },
                      { num: '02', title: howItWorks.step2Title, desc: howItWorks.step2Desc },
                      { num: '03', title: howItWorks.step3Title, desc: howItWorks.step3Desc },
                    ].map((step) => (
                      <div key={step.num} className="flex gap-3 sm:flex-col sm:gap-1.5">
                        <span className="text-sm font-semibold text-theme-accent tabular-nums shrink-0">{step.num}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground leading-snug">{step.title}</p>
                          <p className="text-xs text-muted-foreground leading-snug mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

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
                  <NetReceivePreview
                    method={payoutMethod}
                    amount={amount}
                    youReceiveLabel={text.request.youReceive}
                    targetCurrency={payoutMethod === 'crypto' ? formData.selectedCrypto : undefined}
                    network={payoutMethod === 'crypto' ? formData.selectedNetwork : undefined}
                  />
                </div>

                {/* Méthode de paiement */}
                <Tabs value={expandedMethod ?? '__closed__'} onValueChange={(v) => {
                  if (v !== '__closed__') selectPayoutMethod(v as PayoutMethod);
                }}>
                  <div className="relative z-0 isolate space-y-3">
                    <div
                      ref={expandedMethod === 'sepa_fr' ? expandedMethodRef : undefined}
                      className={cn(
                        'relative z-0 payout-premium-card rounded-xl border-2 border-theme-accent bg-muted/45 ring-1 ring-theme-accent/40'
                      )}
                    >
                      <span className="absolute -top-2.5 -right-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-theme-accent px-2.5 py-1 text-xs font-semibold text-white shadow-[0_2px_8px_color-mix(in_srgb,var(--theme-accent)_45%,transparent)]">
                        <CheckCircleIcon className="w-3.5 h-3.5 shrink-0" aria-hidden />
                        {text.sepaFr?.recommendedBadge}
                      </span>
                      <button
                        type="button"
                        aria-expanded={expandedMethod === 'sepa_fr'}
                        onClick={() => selectPayoutMethod('sepa_fr')}
                        className="w-full p-4 sm:p-5 text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent/40"
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-3 pr-16">
                          <BanknotesIcon className="w-5 h-5 shrink-0 text-theme-accent" />
                          <span className="font-semibold text-base sm:text-lg text-foreground">{text.sepaFr?.tabLabel}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 sm:items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                          <span className="flex items-start gap-1.5">
                            <CheckCircleIcon className="w-3.5 h-3.5 shrink-0 text-theme-accent mt-0.5" aria-hidden />
                            <span className="leading-snug">{text.sepaFr?.compareFees}</span>
                          </span>
                          <span className="flex items-start gap-1.5">
                            <ClockIcon className="w-3.5 h-3.5 shrink-0 text-theme-accent mt-0.5" aria-hidden />
                            <span className="leading-snug">{formatSepaPremiumDelayLabel(text.sepaFr?.compareDelay)}</span>
                          </span>
                          <span className="flex items-start gap-1.5">
                            <ShieldCheckIcon className="w-3.5 h-3.5 shrink-0 text-theme-accent mt-0.5" aria-hidden />
                            <span className="leading-snug">{text.sepaFr?.compareCoverage}</span>
                          </span>
                        </div>
                      </button>

                      <div
                        className={cn(
                          'grid transition-[grid-template-rows] duration-[225ms] ease-out',
                          expandedMethod === 'sepa_fr' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                        )}
                      >
                        <div className="overflow-hidden">
                          <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 border-t border-border/50">
                          <TabsContent value="sepa_fr" className="space-y-4 mt-4">
                            {amount && parseFloat(amount) > 0 && (() => {
                              const gross = toCents(parseFloat(amount));
                              const { netCents: net, processingCents: fee } = computeFees('sepa_fr', gross);
                              return (
                                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    {text.request.feesPreview}
                                  </p>
                                  <div className="flex justify-between text-muted-foreground">
                                    <span>{text.request.grossAmount}</span>
                                    <span>{formatCentsToCurrency(gross, 'EUR')}</span>
                                  </div>
                                  <div className="flex justify-between text-muted-foreground">
                                    <span>{text.request.sepaFrFeeLabel}</span>
                                    <span>-{formatCentsToCurrency(fee, 'EUR')}</span>
                                  </div>
                                  <Separator />
                                  <div className="flex justify-between font-semibold">
                                    <span>{text.request.youReceive}</span>
                                    <span className="text-green-500">{formatCentsToCurrency(net, 'EUR')}</span>
                                  </div>
                                </div>
                              );
                            })()}

                            {sepaFrResult ? (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-lg border border-green-500/40 bg-green-500/5 p-4 space-y-3"
                              >
                                <h3 className="font-semibold flex items-center gap-2 text-green-600 dark:text-green-400">
                                  <CheckCircleIcon className="w-5 h-5" />
                                  {text.sepaFr?.successTitle}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {text.sepaFr?.successDesc}
                                </p>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">{text.sepaFr?.reference}</span>
                                  <span className="font-mono text-xs">{sepaFrResult.reference}</span>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => { setSepaFrResult(null); setSepaFrForm({ iban: '', bic: '', firstName: '', lastName: '' }); }}
                                >
                                  {text.sepaFr?.newRequest}
                                </Button>
                              </motion.div>
                            ) : (
                              <>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="sepaFrFirstName">{text.sepaFr?.firstNameLabel}</Label>
                                    <Input
                                      id="sepaFrFirstName"
                                      placeholder={text.sepaFr?.firstNamePlaceholder}
                                      value={sepaFrForm.firstName}
                                      onChange={(e) => setSepaFrForm((p) => ({ ...p, firstName: e.target.value }))}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="sepaFrLastName">{text.sepaFr?.lastNameLabel}</Label>
                                    <Input
                                      id="sepaFrLastName"
                                      placeholder={text.sepaFr?.lastNamePlaceholder}
                                      value={sepaFrForm.lastName}
                                      onChange={(e) => setSepaFrForm((p) => ({ ...p, lastName: e.target.value }))}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="sepaFrIban">{text.sepaFr?.ibanLabel}</Label>
                                  <Input
                                    id="sepaFrIban"
                                    placeholder={SEPA_ZONE_IBAN_PLACEHOLDER}
                                    value={sepaFrForm.iban}
                                    onChange={(e) => {
                                      const raw = e.target.value.replace(/\s/g, '').toUpperCase();
                                      const formatted = raw.match(/.{1,4}/g)?.join(' ') ?? raw;
                                      setSepaFrForm((p) => ({ ...p, iban: formatted }));
                                    }}
                                    maxLength={42}
                                  />
                                  {(() => {
                                    const ibanClean = sepaFrForm.iban.replace(/\s/g, '').toUpperCase();
                                    if (ibanClean.length < 15) return null;
                                    const validation = validateSepaIban(ibanClean);
                                    if (validation.isValid) return null;
                                    return <p className="text-xs text-destructive">{text.sepaFr?.ibanError}</p>;
                                  })()}
                                  <p className="text-xs text-muted-foreground">{text.sepaFr?.ibanSepaHint}</p>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="sepaFrBic">{text.sepaFr?.bicLabel}</Label>
                                  <Input
                                    id="sepaFrBic"
                                    placeholder={SEPA_ZONE_BIC_PLACEHOLDER}
                                    value={sepaFrForm.bic}
                                    onChange={(e) => setSepaFrForm((p) => ({ ...p, bic: e.target.value.toUpperCase() }))}
                                    maxLength={11}
                                  />
                                </div>

                                {quote && payoutMethod === 'sepa_fr' && (
                                  <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">{text.request.grossAmount}</span>
                                      <span>{formatCentsToCurrency(quote.amountCents, 'EUR')}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-semibold">
                                      <span>{text.request.youReceive}</span>
                                      <span>{formatCentsToCurrency(quote.netCents, 'EUR')}</span>
                                    </div>
                                  </div>
                                )}

                                <p className="text-sm text-muted-foreground">{text.sepaFr?.submitHint}</p>

                                <Button
                                  onClick={async () => {
                                    if (!amount || parseFloat(amount) <= 0) {
                                      toast.error(text.toast.amountTooLow);
                                      return;
                                    }
                                    const amountCents = toCents(parseFloat(amount));
                                    if (amountCents < 1000) {
                                      toast.error(text.request.minAmount);
                                      return;
                                    }
                                    if (amountCents > (availableBalanceCents ?? 0)) {
                                      toast.error(text.toast.insufficientBalance);
                                      return;
                                    }
                                    const ibanClean = sepaFrForm.iban.replace(/\s/g, '').toUpperCase();
                                    const ibanValidation = validateSepaIban(ibanClean);
                                    if (!ibanValidation.isValid) {
                                      toast.error(text.sepaFr?.ibanError);
                                      return;
                                    }
                                    if (!sepaFrForm.firstName.trim() || !sepaFrForm.lastName.trim()) {
                                      toast.error(text.request.firstLastNameRequired);
                                      return;
                                    }
                                    setSepaFrLoading(true);
                                    try {
                                      const bicClean = sepaFrForm.bic.replace(/\s/g, '').toUpperCase();
                                      const res = await fetch('/api/payouts/sepa-fr', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          amountCents,
                                          iban: ibanClean,
                                          ...(bicClean ? { bic: bicClean } : {}),
                                          firstName: sepaFrForm.firstName.trim(),
                                          lastName: sepaFrForm.lastName.trim(),
                                        }),
                                      });
                                      const data = await res.json();
                                      if (!res.ok) throw new Error(data.error ?? 'Error');
                                      toast.success(text.sepaFr?.successTitle);
                                      setSepaFrResult({ reference: data.payout.reference, amountCents });
                                      setAmount('');
                                      queryClient.invalidateQueries({ queryKey: queryKeys.payoutHistory });
                                      queryClient.invalidateQueries({ queryKey: queryKeys.userBalance });
                                    } catch (err) {
                                      toast.error(err instanceof Error ? err.message : text.toast.payoutError);
                                    } finally {
                                      setSepaFrLoading(false);
                                    }
                                  }}
                                  disabled={sepaFrLoading || !sepaFrSubmitReady}
                                  className={PAYOUT_SUBMIT_BTN_CLASS}
                                >
                                  {sepaFrLoading ? (
                                    <>
                                      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                                      {text.sepaFr?.submitting}
                                    </>
                                  ) : (
                                    text.sepaFr?.submitButton
                                  )}
                                </Button>

                                {text.sepaFr?.deliveryDisclaimer && (
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {text.sepaFr.deliveryDisclaimer}
                                  </p>
                                )}
                              </>
                            )}
                          </TabsContent>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-6 gap-2">
                      {orderedSecondaryMethods.map(({ id, icon: Icon, label, fee, delay, iconColor }) => {
                        const isExpanded = expandedMethod === id;
                        return (
                        <div
                          key={id}
                          ref={isExpanded ? expandedMethodRef : undefined}
                          className={cn(
                            'relative z-0 rounded-lg border transition-all duration-[275ms] ease-out overflow-hidden motion-reduce:transition-none',
                            isExpanded
                              ? 'col-span-6 border-theme-accent/60 bg-muted/50 ring-1 ring-theme-accent/25'
                              : isSecondaryExpanded
                                ? 'col-span-3 border-border/60 bg-muted/30 hover:bg-muted/50 hover:border-border/80'
                                : 'col-span-2 border-border/60 bg-muted/30 hover:bg-muted/50 hover:border-border/80'
                          )}
                        >
                          <button
                            type="button"
                            aria-expanded={isExpanded}
                            onClick={() => selectPayoutMethod(id)}
                            className={cn(
                              'w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent/40 rounded-lg',
                              isExpanded ? 'p-4 sm:p-5' : 'p-2.5 sm:p-3'
                            )}
                          >
                            <div className={cn('flex items-center gap-1.5', isExpanded ? 'mb-3' : 'mb-1.5')}>
                              <Icon className={cn('shrink-0', isExpanded ? 'w-5 h-5' : 'w-4 h-4', iconColor)} />
                              <span className={cn('font-medium truncate text-foreground', isExpanded ? 'text-base sm:text-lg font-semibold' : 'text-xs sm:text-sm')}>{label}</span>
                            </div>
                            <p className={cn('text-muted-foreground leading-tight', isExpanded ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs line-clamp-2')}>{fee}</p>
                            {delay && (
                              <p className={cn('text-muted-foreground/80 flex items-center gap-0.5', isExpanded ? 'text-xs mt-1' : 'text-[10px] mt-0.5')}>
                                <ClockIcon className={cn(isExpanded ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5')} />
                                {delay}
                              </p>
                            )}
                          </button>

                          <div
                            className={cn(
                              'grid transition-[grid-template-rows] duration-[275ms] ease-out',
                              isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                            )}
                          >
                            <div className="overflow-hidden">
                              <div className={cn('pt-0 border-t border-border/50', isExpanded ? 'px-4 sm:px-5 pb-4 sm:pb-5' : 'px-3 pb-3')}>
                              <TabsContent value={id} className={cn('space-y-4', isExpanded ? 'mt-4' : 'mt-3')}>
                                {id === 'card' && (
                                  <>
                                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                                      <div className="flex items-start space-x-3">
                                        <InformationCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-emerald-700 dark:text-emerald-300">{text.request.security.cardInfo}</p>
                                      </div>
                                    </div>
                                    {savedCardMethods.length > 0 && (
                                      <div className="space-y-2">
                                        <Label>{text.request.savedCardLabel}</Label>
                                        <div className="flex flex-col gap-2">
                                          {savedCardMethods.map((pm: { id: string; last4: string | null; holderName: string | null }) => (
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
                                                {text.request.useSavedCard}: **** {pm.last4 ?? '••••'}
                                                {pm.holderName ? `, ${pm.holderName}` : ''}
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
                                            <span className="text-sm">{text.request.enterNewCard}</span>
                                          </label>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{text.request.savedCardHint}</p>
                                      </div>
                                    )}
                                    {(!useSavedCard || savedCardMethods.length === 0) && (
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="cardNumber">{text.request.cardNumberLabel}</Label>
                                        <Input
                                          id="cardNumber"
                                          type="text"
                                          inputMode="numeric"
                                          autoComplete="cc-number"
                                          placeholder={text.request.cardNumberPlaceholder}
                                          value={formData.cardNumber}
                                          onChange={(e) => {
                                            const v = e.target.value.replace(/\D/g, '').slice(0, 19);
                                            setFormData(prev => ({ ...prev, cardNumber: v.replace(/(\d{4})/g, '$1 ').trim() }));
                                            setQuote(null);
                                          }}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="cardHolder">{text.request.cardHolderLabel}</Label>
                                        <Input
                                          id="cardHolder"
                                          autoComplete="cc-name"
                                          placeholder={text.request.cardHolderPlaceholder}
                                          value={formData.cardHolder}
                                          onChange={(e) => {
                                            setFormData(prev => ({ ...prev, cardHolder: e.target.value }));
                                            setQuote(null);
                                          }}
                                        />
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="expireMonth">{text.request.cardExpireMonthLabel}</Label>
                                          <Select
                                            value={formData.expireMonth}
                                            onValueChange={(v) => {
                                              setFormData(prev => ({ ...prev, expireMonth: v }));
                                              setQuote(null);
                                            }}
                                          >
                                            <SelectTrigger id="expireMonth">
                                              <SelectValue placeholder={text.request.cardExpireMonthPlaceholder} />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map((m) => (
                                                <SelectItem key={m} value={m}>{m}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="expireYear">{text.request.cardExpireYearLabel}</Label>
                                          <Input
                                            id="expireYear"
                                            placeholder={text.request.cardExpireYearPlaceholder}
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
                                          <Label htmlFor="cvv">{text.request.cardCvvLabel}</Label>
                                          <Input
                                            id="cvv"
                                            type="password"
                                            inputMode="numeric"
                                            autoComplete="cc-csc"
                                            placeholder={text.request.cardCvvPlaceholder}
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
                                      <p className="text-xs text-muted-foreground">{text.request.saveCardHint}</p>
                                    )}
                                  </>
                                )}
                                {id === 'sepa' && (
                                  <>
                                    <SepaFrPremiumHint onSelectSepaPremium={() => selectPayoutMethod('sepa_fr')} />

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="sepaFirstName">{text.request.firstNameLabel}</Label>
                                        <Input
                                          id="sepaFirstName"
                                          placeholder={text.request.firstNamePlaceholder}
                                          value={formData.firstName}
                                          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="sepaLastName">{text.request.lastNameLabel}</Label>
                                        <Input
                                          id="sepaLastName"
                                          placeholder={text.request.lastNamePlaceholder}
                                          value={formData.lastName}
                                          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                        />
                                      </div>
                                    </div>

                                    {savedSepaMethods.length > 0 && (
                                      <div className="space-y-2">
                                        <Label>{text.request.savedIbanLabel}</Label>
                                        <div className="flex flex-col gap-2">
                                          {savedSepaMethods.map((pm: { id: string; maskedIban?: string | null; holderName?: string | null }) => (
                                            <label key={pm.id} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
                                              <input
                                                type="radio"
                                                name="sepa-source"
                                                checked={useSavedIban && selectedPaymentMethodId === pm.id}
                                                onChange={() => {
                                                  setUseSavedIban(true);
                                                  setSelectedPaymentMethodId(pm.id);
                                                }}
                                                className="h-4 w-4"
                                              />
                                              <span className="text-sm">
                                                {text.request.useSavedIban}: <strong>{String(pm.maskedIban ?? '••••••••••••').slice(-4).padStart(12, '•')}</strong>
                                                {pm.holderName ? `, ${pm.holderName}` : ''}
                                              </span>
                                            </label>
                                          ))}
                                          <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
                                            <input
                                              type="radio"
                                              name="sepa-source"
                                              checked={!useSavedIban}
                                              onChange={() => {
                                                setUseSavedIban(false);
                                                setSelectedPaymentMethodId(null);
                                              }}
                                              className="h-4 w-4"
                                            />
                                            <span className="text-sm">{text.request.enterNewIban}</span>
                                          </label>
                                        </div>
                                      </div>
                                    )}

                                    {(!useSavedIban || savedSepaMethods.length === 0) && (
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="iban">{text.request.ibanLabel}</Label>
                                        <Input
                                          id="iban"
                                          placeholder={SEPA_ZONE_IBAN_PLACEHOLDER}
                                          value={formData.iban}
                                          onChange={(e) => {
                                            const raw = e.target.value.replace(/\s/g, '').toUpperCase();
                                            const formatted = raw.match(/.{1,4}/g)?.join(' ') ?? raw;
                                            setFormData(prev => ({ ...prev, iban: formatted }));
                                            setQuote(null);
                                            if (isFrenchIban(raw) && raw.length >= 4) {
                                              toast.warning(text.request.ibanFrWarningToast, { duration: 6000 });
                                            }
                                          }}
                                          maxLength={42}
                                        />
                                        {formData.iban.replace(/\s/g, '').length >= 4 && isFrenchIban(formData.iban) && (
                                          <p className="text-sm text-destructive">{text.request.ibanFrWarningToast}</p>
                                        )}
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="bic">{text.request.bicLabel}</Label>
                                        <Input
                                          id="bic"
                                          placeholder={SEPA_ZONE_BIC_PLACEHOLDER}
                                          value={formData.bic}
                                          onChange={(e) => setFormData(prev => ({ ...prev, bic: e.target.value.toUpperCase() }))}
                                          maxLength={11}
                                        />
                                      </div>
                                    </div>
                                    )}

                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="sepaPhone">{text.request.phoneLabel}</Label>
                                        <Input
                                          id="sepaPhone"
                                          type="tel"
                                          placeholder={text.request.phonePlaceholder}
                                          value={formData.phone}
                                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="sepaAddress">{text.request.addressLabel}</Label>
                                        <Input
                                          id="sepaAddress"
                                          placeholder={text.request.addressPlaceholder}
                                          value={formData.address}
                                          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="sepaCity">{text.request.cityLabel}</Label>
                                          <Input
                                            id="sepaCity"
                                            placeholder={text.request.cityPlaceholder}
                                            value={formData.beneficiaryCity}
                                            onChange={(e) => setFormData(prev => ({ ...prev, beneficiaryCity: e.target.value }))}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="sepaCountry">{text.request.countryLabel}</Label>
                                          <Input
                                            id="sepaCountry"
                                            placeholder={text.request.countryPlaceholder}
                                            value={formData.beneficiaryCountry}
                                            onChange={(e) => setFormData(prev => ({ ...prev, beneficiaryCountry: e.target.value.toUpperCase().slice(0, 2) }))}
                                            maxLength={2}
                                          />
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="sepaEmail">{text.request.beneficiaryEmailLabel}</Label>
                                        <Input
                                          id="sepaEmail"
                                          type="email"
                                          placeholder={text.request.beneficiaryEmailPlaceholder}
                                          value={formData.beneficiaryEmail}
                                          onChange={(e) => setFormData(prev => ({ ...prev, beneficiaryEmail: e.target.value }))}
                                        />
                                      </div>
                                    </div>
                                    {(!useSavedIban || savedSepaMethods.length === 0) && (
                                      <p className="text-xs text-muted-foreground">{text.request.saveIbanHint}</p>
                                    )}
                                  </>
                                )}
                                {id === 'crypto' && (
                                  <>
                                    <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                                      <div className="flex items-start space-x-3">
                                        <InformationCircleIcon className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-purple-700 dark:text-purple-300">{text.request.security.cryptoInfo}</p>
                                      </div>
                                    </div>

                                    {savedCryptoMethods.length > 0 && (
                                      <div className="space-y-2">
                                        <Label>{text.request.savedWalletLabel}</Label>
                                        <div className="flex flex-col gap-2">
                                          {savedCryptoMethods.map((pm: { id: string; maskedAddress: string | null; network: string | null; targetCurrency: string | null; memo: string | null }) => (
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
                                                {text.request.useSavedWallet}: <strong>{pm.maskedAddress ?? '••••'}</strong>
                                                {pm.network ? ` (${pm.network})` : ''} {pm.targetCurrency ? `, ${pm.targetCurrency}` : ''}
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
                                            <span className="text-sm">{text.request.enterNewWallet}</span>
                                          </label>
                                        </div>
                                      </div>
                                    )}

                                    {(!useSavedWallet || savedCryptoMethods.length === 0) && (
                                    <>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="crypto">{text.request.cryptoLabel}</Label>
                                        <Select
                                          value={formData.selectedCrypto}
                                          onValueChange={(v) => {
                                            const crypto = WHITEPAY_SUPPORTED_CRYPTOS.find((c) => c.ticker === v);
                                            setFormData(prev => ({
                                              ...prev,
                                              selectedCrypto: v,
                                              selectedNetwork: crypto?.networks[0] || 'TRC20',
                                            }));
                                            setQuote(null);
                                          }}
                                        >
                                          <SelectTrigger id="crypto">
                                            <SelectValue placeholder={text.request.cryptoPlaceholder} />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {WHITEPAY_SUPPORTED_CRYPTOS.map((c) => (
                                              <SelectItem key={c.ticker} value={c.ticker}>
                                                <span className="flex items-center gap-2">
                                                  {c.name}
                                                  {c.is_stable && (
                                                    <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">{text.request.stablecoinBadge}</span>
                                                  )}
                                                </span>
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

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
                                            {availableNetworks.map((net) => {
                                              const feeLabel = formatWhitepayNetworkFeeLabel(formData.selectedCrypto, net);
                                              return (
                                              <SelectItem key={net} value={net}>
                                                {feeLabel ? `${net} (${feeLabel})` : net}
                                              </SelectItem>
                                              );
                                            })}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div className="space-y-2">
                                        <Label htmlFor="walletAddress">{text.request.walletAddressLabel}</Label>
                                        <Input
                                          id="walletAddress"
                                          value={formData.walletAddress}
                                          onChange={(e) => setFormData(prev => ({ ...prev, walletAddress: e.target.value.trim() }))}
                                          placeholder={getWhitepayAddressPlaceholder(formData.selectedNetwork)}
                                        />
                                        <p className="text-xs text-muted-foreground">{text.request.walletAddressWarning}</p>
                                      </div>

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
                                          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-theme-highlight/25 dark:border-theme-highlight/35 rounded-lg p-3">
                                            <p className="text-xs text-yellow-700 dark:text-yellow-300">{text.request.memoWarning}</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{text.request.saveWalletHint}</p>
                                    </>
                                    )}
                                  </>
                                )}
                                {renderFlexifyMethodActions()}
                              </TabsContent>
                              </div>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>

                </Tabs>
                </>
                )}

                {/* Récapitulatif frais réels après soumission */}
                {payoutResult && (() => {
                  const resultFees = normalizeWithdrawalFeesCents(payoutResult.fees);
                  const resultNet =
                    typeof payoutResult.netCents === 'number' && !Number.isNaN(payoutResult.netCents)
                      ? payoutResult.netCents
                      : Math.max(
                          0,
                          payoutResult.amountCents - resultFees.processingCents - resultFees.networkCents,
                        );
                  return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-green-500/40 bg-green-500/5 p-4 space-y-3"
                  >
                    <h3 className="font-semibold flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircleIcon className="w-5 h-5" />
                      {payoutResult.pendingApproval ? text.result.requestRegistered : text.result.paymentInitiated}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{text.result.reference}</span>
                        <span className="font-mono text-xs">{payoutResult.reference}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{text.request.grossAmount}</span>
                        <span>{formatCentsToCurrency(payoutResult.amountCents, 'EUR')}</span>
                      </div>
                      <div className="flex justify-between text-theme-accent">
                        <span>{text.result.processingFee}</span>
                        <span>-{formatCentsToCurrency(resultFees.processingCents, 'EUR')}</span>
                      </div>
                      <div className="flex justify-between text-theme-accent">
                        <span>{text.result.networkFee}</span>
                        <span>-{formatCentsToCurrency(resultFees.networkCents, 'EUR')}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>{text.request.youReceive}</span>
                        <span className="text-green-500">{formatCentsToCurrency(resultNet, 'EUR')}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setPayoutResult(null)}
                    >
                      {text.result.newWithdrawal}
                    </Button>
                  </motion.div>
                  );
                })()}
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar - Historique */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:self-start"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{text.history.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      isManualReconcileRef.current = true;
                      await triggerReconcile();
                      queryClient.invalidateQueries({ queryKey: queryKeys.payoutHistory });
                      queryClient.invalidateQueries({ queryKey: queryKeys.userBalance });
                    }}
                    title={messages.ui?.refresh}
                    disabled={isReconciling}
                    className="h-8 w-8"
                  >
                    <ArrowPathIcon className={`h-4 w-4 ${isReconciling ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {payoutHistory.length === 0 ? (
                  <div className="text-center py-2">
                    <BanknotesIcon className="w-6 h-6 mx-auto mb-1 text-muted-foreground" aria-hidden />
                    <p className="text-xs text-muted-foreground">{text.history.noPayoutDesc}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 -mr-2">
                    {payoutHistory.map((payout) => {
                      const { grossCents, netCents } = netReceivedFromHistoryRow(payout);
                      return (
                      <div 
                        key={payout.id} 
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{text.history.receivedNetHint}</p>
                          <p className="font-medium">{formatCentsToCurrency(netCents, 'EUR')}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payout.createdAt).toLocaleDateString(locale)}
                          </p>
                          {grossCents !== netCents && (
                            <p className="text-[11px] text-muted-foreground mt-1">
                              {text.history.balanceDebitedHint}: {formatCentsToCurrency(grossCents, 'EUR')}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {getStatusBadge(displayPayoutStatus(payout))}
                          <p className="text-xs text-muted-foreground mt-1">
                            {payout.method === 'FLEXIFY_SEPA' ? 'SEPA' : payout.method === 'WHITEPAY_CRYPTO' ? 'Crypto' : payout.method === 'SEPA_FR' ? text.history.sepaPremiumLabel : payout.method}
                          </p>
                        </div>
                      </div>
                    ); })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <InformationCircleIcon className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{text.request.ibanVerificationTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {text.request.security.ibanVerificationDesc}
                    </p>
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

