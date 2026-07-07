'use client';

import { motion } from 'framer-motion';
import { ClockIcon } from '@heroicons/react/24/outline';
import { Separator } from '@/components/ui/separator';
import { formatCentsToCurrency } from '@/lib/currency-converter';
import { useLocale } from '@/components/providers/locale-provider';
import { calculateWhitepayFees, estimateNetworkFeeCentsSync } from '@/lib/whitepay';

type PayoutMethod = 'card' | 'sepa' | 'crypto';

interface FeeNumericConfig {
  rate: number;
  fixedCents: number;
}

const FEE_CONFIG: Record<Exclude<PayoutMethod, 'crypto'>, FeeNumericConfig> = {
  card: { rate: 0.042, fixedCents: 50 },
  sepa: { rate: 0.02, fixedCents: 350 },
};

export function computeFees(
  method: PayoutMethod,
  amountCents: number,
  crypto?: { targetCurrency: string; network: string }
) {
  if (method === 'crypto') {
    const networkFeeCents =
      crypto?.targetCurrency && crypto?.network
        ? estimateNetworkFeeCentsSync(crypto.targetCurrency, crypto.network)
        : 0;
    const fees = calculateWhitepayFees(amountCents, networkFeeCents);
    return { totalCents: fees.totalFeeCents, netCents: amountCents - fees.totalFeeCents, networkCents: fees.networkFeeCents, processingCents: fees.processingFeeCents };
  }

  const cfg = FEE_CONFIG[method];
  const proportional = cfg.rate > 0 ? Math.ceil(amountCents * cfg.rate) : 0;
  const totalCents = proportional + cfg.fixedCents;
  return { totalCents, netCents: amountCents - totalCents, networkCents: cfg.fixedCents, processingCents: proportional };
}

interface FeePreviewProps {
  method: PayoutMethod;
  amountCents: number;
  targetCurrency?: string;
  network?: string;
  labels: {
    feesPreview: string;
    grossAmount: string;
    youReceive: string;
  };
}

export function FeePreview({ method, amountCents, targetCurrency, network, labels }: FeePreviewProps) {
  const { messages } = useLocale();
  const fees = messages.payoutComponents.fees;
  const cryptoContext =
    method === 'crypto' && targetCurrency && network
      ? { targetCurrency, network }
      : undefined;
  const { totalCents, netCents, networkCents, processingCents } = computeFees(
    method,
    amountCents,
    cryptoContext
  );

  const labelMap: Record<PayoutMethod, string> = {
    card: fees.cardLabel,
    sepa: fees.sepaLabel,
    crypto: fees.cryptoLabel,
  };

  const delayMap: Record<PayoutMethod, string | undefined> = {
    card: fees.cardDelay,
    sepa: fees.sepaDelay,
    crypto: undefined,
  };

  const label = labelMap[method];
  const delay = delayMap[method];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-muted/40 border border-border rounded-lg p-4 space-y-2 text-sm"
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
        {labels.feesPreview}
      </p>
      <div className="flex justify-between">
        <span className="text-muted-foreground">{labels.grossAmount}</span>
        <span>{formatCentsToCurrency(amountCents, 'EUR')}</span>
      </div>
      <div className="flex justify-between text-theme-accent">
        <span>{label}</span>
        <span>-{formatCentsToCurrency(method === 'crypto' ? processingCents : totalCents, 'EUR')}</span>
      </div>
      {method === 'crypto' && networkCents > 0 && (
        <div className="flex justify-between text-theme-accent">
          <span>{String('networkFees' in fees ? fees.networkFees : 'Frais réseau')}</span>
          <span>-{formatCentsToCurrency(networkCents, 'EUR')}</span>
        </div>
      )}
      <Separator />
      <div className="flex justify-between font-semibold">
        <span>{labels.youReceive}</span>
        <span className={netCents > 0 ? 'text-green-500' : 'text-destructive'}>
          {netCents > 0 ? formatCentsToCurrency(netCents, 'EUR') : '-'}
        </span>
      </div>
      {delay && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <ClockIcon className="w-3 h-3" />
          <span>{delay}</span>
        </div>
      )}
    </motion.div>
  );
}
