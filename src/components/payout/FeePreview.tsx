'use client';

import { motion } from 'framer-motion';
import { ClockIcon } from '@heroicons/react/24/outline';
import { Separator } from '@/components/ui/separator';
import { formatCentsToCurrency } from '@/lib/currency-converter';
import { useLocale } from '@/components/providers/locale-provider';

type PayoutMethod = 'card' | 'sepa' | 'crypto';

interface FeeNumericConfig {
  rate: number;
  fixedCents: number;
}

const FEE_CONFIG: Record<PayoutMethod, FeeNumericConfig> = {
  card:   { rate: 0.042, fixedCents: 50 },
  sepa:   { rate: 0.02,  fixedCents: 350 },
  crypto: { rate: 0.011, fixedCents: 0 },   // 1,1% Whitepay, pas de frais fixe
};

export function computeFees(method: PayoutMethod, amountCents: number) {
  const cfg = FEE_CONFIG[method];
  const proportional = cfg.rate > 0 ? Math.ceil(amountCents * cfg.rate) : 0;
  const totalCents = proportional + cfg.fixedCents;
  return { totalCents, netCents: amountCents - totalCents };
}

interface FeePreviewProps {
  method: PayoutMethod;
  amountCents: number;
  labels: {
    feesPreview: string;
    grossAmount: string;
    youReceive: string;
  };
}

export function FeePreview({ method, amountCents, labels }: FeePreviewProps) {
  const { messages } = useLocale();
  const fees = messages.payoutComponents.fees;
  const { totalCents, netCents } = computeFees(method, amountCents);

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
        <span>-{formatCentsToCurrency(totalCents, 'EUR')}</span>
      </div>
      <Separator />
      <div className="flex justify-between font-semibold">
        <span>{labels.youReceive}</span>
        <span className={netCents > 0 ? 'text-green-500' : 'text-destructive'}>
          {netCents > 0 ? formatCentsToCurrency(netCents, 'EUR') : '—'}
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
