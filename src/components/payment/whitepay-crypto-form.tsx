'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Info,
  Wallet,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Zap,
  ArrowRight,
  Shield,
  Copy,
} from 'lucide-react';
import { useLocale } from '@/components/providers/locale-provider';

// =============================================================================
// TYPES
// =============================================================================

interface WhitepayCryptoFormProps {
  /** ID du trade associé (optionnel) */
  tradeId?: string;
  /** Montant en centimes EUR */
  amountCents: number;
  /** Callback succès */
  onSuccess?: (data: WhitepaySuccessData) => void;
  /** Callback erreur */
  onError?: (error: string) => void;
}

interface WhitepaySuccessData {
  payoutId: string;
  transactionId: string;
  status: string;
  targetValue: string;
  targetCurrency: string;
  txHash?: string;
}

interface WhitepayQuote {
  transactionId: string;
  exchangeRate: string;
  targetValue: string;
  targetCurrency: string;
  fee: string;
  estimatedAt: string;
  expiresAt: string;
  status: string;
}

// =============================================================================
// CRYPTOS SUPPORTÉES
// =============================================================================

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

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export function WhitepayCryptoForm({
  tradeId,
  amountCents,
  onSuccess,
  onError,
}: WhitepayCryptoFormProps) {
  const { messages } = useLocale();
  const t = messages.paymentComponents.whitepayForm;

  // State — Sélection
  const [selectedCrypto, setSelectedCrypto] = useState('USDT');
  const [selectedNetwork, setSelectedNetwork] = useState('ERC20');
  const [walletAddress, setWalletAddress] = useState('');
  const [memo, setMemo] = useState('');

  // State — Flow
  const [flowType, setFlowType] = useState<'standard' | 'instant'>('standard');
  const [step, setStep] = useState<'form' | 'confirm' | 'processing' | 'success' | 'error'>('form');

  // State — Loading
  const [isCreating, setIsCreating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State — Quote & données
  const [payoutId, setPayoutId] = useState<string | null>(null);
  const [quote, setQuote] = useState<WhitepayQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<WhitepaySuccessData | null>(null);

  // State — Timer 30s
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Réseaux disponibles pour la crypto sélectionnée
  const availableNetworks = SUPPORTED_CRYPTOS.find((c) => c.ticker === selectedCrypto)?.networks || [];
  const needsMemo = MEMO_REQUIRED_NETWORKS.includes(selectedNetwork);

  // Quand on change de crypto, reset le réseau
  useEffect(() => {
    const crypto = SUPPORTED_CRYPTOS.find((c) => c.ticker === selectedCrypto);
    if (crypto && crypto.networks.length > 0) {
      setSelectedNetwork(crypto.networks[0]);
    }
  }, [selectedCrypto]);

  // Timer de 30 secondes pour la confirmation
  useEffect(() => {
    if (step === 'confirm' && quote) {
      setTimeLeft(30);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [step, quote]);

  // Nettoyage du timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  // =============================================================================
  // STANDARD FLOW — Étape 1: Créer le retrait (obtenir le taux)
  // =============================================================================

  const handleCreateWithdrawal = useCallback(async () => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/whitepay/withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCents,
          tradeId,
          targetCurrency: selectedCrypto,
          network: selectedNetwork,
          walletAddress,
          memo: needsMemo ? memo : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'KYC_REQUIRED') {
          setError(t.errors.kycRequired);
          onError?.('KYC_REQUIRED');
          return;
        }
        throw new Error(data.error || t.errors.createError);
      }

      setPayoutId(data.payout.id);
      setQuote({
        transactionId: data.whitepay.transactionId,
        exchangeRate: data.whitepay.exchangeRate,
        targetValue: data.whitepay.targetValue,
        targetCurrency: data.whitepay.targetCurrency,
        fee: data.whitepay.fee,
        estimatedAt: data.whitepay.estimatedAt,
        expiresAt: data.whitepay.expiresAt,
        status: data.whitepay.status,
      });
      setStep('confirm');
    } catch (err) {
      const message = err instanceof Error ? err.message : t.errors.unknownError;
      setError(message);
      onError?.(message);
    } finally {
      setIsCreating(false);
    }
  }, [amountCents, tradeId, selectedCrypto, selectedNetwork, walletAddress, memo, needsMemo, t, onError]);

  // =============================================================================
  // STANDARD FLOW — Étape 2: Confirmer (dans les 30 secondes)
  // =============================================================================

  const handleConfirmWithdrawal = useCallback(async () => {
    if (!payoutId || !quote) return;

    setIsConfirming(true);
    setError(null);

    try {
      const response = await fetch('/api/whitepay/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutId,
          transactionId: quote.transactionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.errors.confirmError);
      }

      setStep('success');
      const result: WhitepaySuccessData = {
        payoutId,
        transactionId: data.whitepay.transactionId,
        status: data.whitepay.status,
        targetValue: data.whitepay.targetValue,
        targetCurrency: quote.targetCurrency,
      };
      setSuccessData(result);
      onSuccess?.(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.errors.unknownError;
      setError(message);
      onError?.(message);
    } finally {
      setIsConfirming(false);
    }
  }, [payoutId, quote, t, onSuccess, onError]);

  // =============================================================================
  // REFRESH — Rafraîchir le taux si expiré
  // =============================================================================

  const handleRefreshRate = useCallback(async () => {
    if (!payoutId || !quote) return;

    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch('/api/whitepay/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutId,
          transactionId: quote.transactionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.errors.refreshError);
      }

      setQuote((prev) =>
        prev
          ? {
              ...prev,
              exchangeRate: data.whitepay.exchangeRate,
              targetValue: data.whitepay.targetValue,
              fee: data.whitepay.fee,
              estimatedAt: data.whitepay.estimatedAt,
              expiresAt: data.whitepay.expiresAt,
            }
          : null
      );
      setTimeLeft(30);

      // Relancer le timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.errors.unknownError;
      setError(message);
    } finally {
      setIsRefreshing(false);
    }
  }, [payoutId, quote, t]);

  // =============================================================================
  // INSTANT FLOW — Tout en un seul appel
  // =============================================================================

  const handleInstantWithdrawal = useCallback(async () => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/whitepay/instant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCents,
          tradeId,
          targetCurrency: selectedCrypto,
          network: selectedNetwork,
          walletAddress,
          memo: needsMemo ? memo : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'KYC_REQUIRED') {
          setError(t.errors.kycRequired);
          onError?.('KYC_REQUIRED');
          return;
        }
        throw new Error(data.error || t.errors.createError);
      }

      setStep('success');
      const result: WhitepaySuccessData = {
        payoutId: data.payout.id,
        transactionId: data.whitepay.transactionId,
        status: data.whitepay.status,
        targetValue: data.whitepay.targetValue,
        targetCurrency: selectedCrypto,
        txHash: data.whitepay.txHash,
      };
      setSuccessData(result);
      onSuccess?.(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.errors.unknownError;
      setError(message);
      onError?.(message);
    } finally {
      setIsCreating(false);
    }
  }, [amountCents, tradeId, selectedCrypto, selectedNetwork, walletAddress, memo, needsMemo, t, onSuccess, onError]);

  // =============================================================================
  // RENDER — Écran de succès
  // =============================================================================

  if (step === 'success' && successData) {
    return (
      <Card className="border-green-500/50 bg-green-500/10">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <h3 className="text-xl font-bold text-green-500">{t.success.title}</h3>
            <p className="text-muted-foreground">{t.success.description}</p>

            <div className="w-full space-y-2 bg-muted/50 rounded-lg p-4 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.success.amount}</span>
                <span className="font-medium">{successData.targetValue} {successData.targetCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.success.status}</span>
                <Badge variant="outline" className="text-green-500 border-green-500">
                  {successData.status}
                </Badge>
              </div>
              {successData.txHash && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t.success.txHash}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(successData.txHash || '')}
                    className="flex items-center gap-1 text-xs font-mono hover:text-primary transition-colors"
                  >
                    {successData.txHash.slice(0, 8)}...{successData.txHash.slice(-8)}
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">{t.success.trackingInfo}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // =============================================================================
  // RENDER — Écran de confirmation (Standard Flow, 30 secondes)
  // =============================================================================

  if (step === 'confirm' && quote) {
    const isExpired = timeLeft <= 0;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {t.confirm.title}
          </CardTitle>
          <CardDescription>{t.confirm.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Timer */}
          <div className={`flex items-center justify-center gap-2 p-3 rounded-lg text-center ${
            isExpired ? 'bg-destructive/10 text-destructive' : timeLeft <= 10 ? 'bg-orange-500/10 text-orange-500' : 'bg-primary/10 text-primary'
          }`}>
            <Clock className="w-5 h-5" />
            <span className="text-lg font-bold font-mono">
              {isExpired ? t.confirm.expired : `${timeLeft}s`}
            </span>
            {!isExpired && <span className="text-sm">{t.confirm.timeLeft}</span>}
          </div>

          {/* Détails du taux */}
          <div className="space-y-2 bg-muted/50 rounded-lg p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.confirm.amount}</span>
              <span className="font-medium">{formatCurrency(amountCents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.confirm.exchangeRate}</span>
              <span>{parseFloat(quote.exchangeRate).toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.confirm.fee}</span>
              <span className="text-destructive">{quote.fee} {quote.targetCurrency}</span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between font-bold text-base">
              <span>{t.confirm.youReceive}</span>
              <span className="text-green-500">{quote.targetValue} {quote.targetCurrency}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{t.confirm.wallet}</span>
              <span className="font-mono">{walletAddress.slice(0, 10)}...{walletAddress.slice(-6)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t.confirm.network}</span>
              <span>{selectedNetwork}</span>
            </div>
          </div>

          {/* Boutons d'action */}
          {isExpired ? (
            <div className="space-y-3">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t.confirm.expiredTitle}</AlertTitle>
                <AlertDescription>{t.confirm.expiredDescription}</AlertDescription>
              </Alert>
              <Button
                onClick={handleRefreshRate}
                disabled={isRefreshing}
                className="w-full"
                variant="outline"
              >
                {isRefreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {t.confirm.refreshRate}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={handleConfirmWithdrawal}
                disabled={isConfirming}
                className="w-full"
                size="lg"
              >
                {isConfirming ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                {t.confirm.confirmButton}
              </Button>
              <Button
                onClick={() => {
                  setStep('form');
                  setQuote(null);
                  setPayoutId(null);
                  if (timerRef.current) clearInterval(timerRef.current);
                }}
                variant="ghost"
                className="w-full"
              >
                {t.confirm.cancel}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // =============================================================================
  // RENDER — Formulaire principal
  // =============================================================================

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Sélection du mode: Standard vs Instant */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFlowType('standard')}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              flowType === 'standard'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">{t.flowStandard.title}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t.flowStandard.description}</p>
          </button>
          <button
            type="button"
            onClick={() => setFlowType('instant')}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              flowType === 'instant'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">{t.flowInstant.title}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t.flowInstant.description}</p>
          </button>
        </div>

        {/* Sélection de la crypto */}
        <div className="space-y-2">
          <Label htmlFor="crypto">{t.selectCrypto}</Label>
          <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
            <SelectTrigger id="crypto">
              <SelectValue placeholder={t.selectCryptoPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_CRYPTOS.map((c) => (
                <SelectItem key={c.ticker} value={c.ticker}>
                  <span className="flex items-center gap-2">
                    {c.name}
                    {c.is_stable && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0">Stable</Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sélection du réseau */}
        <div className="space-y-2">
          <Label htmlFor="network">{t.selectNetwork}</Label>
          <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
            <SelectTrigger id="network">
              <SelectValue placeholder={t.selectNetworkPlaceholder} />
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
          <Label htmlFor="walletAddress">{t.walletAddress}</Label>
          <div className="relative">
            <Wallet className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="walletAddress"
              type="text"
              placeholder={getAddressPlaceholder(selectedNetwork)}
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value.trim())}
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground">{t.walletWarning}</p>
        </div>

        {/* Memo (si requis par le réseau) */}
        {needsMemo && (
          <div className="space-y-2">
            <Label htmlFor="memo">
              {t.memoLabel}
              <Badge variant="destructive" className="ml-2 text-[10px]">{t.memoRequired}</Badge>
            </Label>
            <Input
              id="memo"
              type="text"
              placeholder={t.memoPlaceholder}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">{t.memoWarning}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Montant */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">{t.amount}</span>
            <span className="text-xl font-bold">{formatCurrency(amountCents)}</span>
          </div>
        </div>

        {/* Bouton principal */}
        <Button
          onClick={flowType === 'standard' ? handleCreateWithdrawal : handleInstantWithdrawal}
          disabled={isCreating || !walletAddress || (needsMemo && !memo)}
          className="w-full"
          size="lg"
        >
          {isCreating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : flowType === 'standard' ? (
            <ArrowRight className="mr-2 h-4 w-4" />
          ) : (
            <Zap className="mr-2 h-4 w-4" />
          )}
          {flowType === 'standard' ? t.getQuoteButton : t.instantButton}
        </Button>

        <p className="text-xs text-center text-muted-foreground">{t.disclaimer}</p>
      </CardContent>
    </Card>
  );
}
