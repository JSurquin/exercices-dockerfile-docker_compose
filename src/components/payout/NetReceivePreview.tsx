'use client';

import { useMemo } from 'react';
import { formatCentsToCurrency, toCents } from '@/lib/currency-converter';
import { computeFees, type PayoutFeeMethod } from '@/components/payout/FeePreview';

interface NetReceivePreviewProps {
  method: PayoutFeeMethod;
  amount: string;
  youReceiveLabel: string;
  targetCurrency?: string;
  network?: string;
}

export function NetReceivePreview({
  method,
  amount,
  youReceiveLabel,
  targetCurrency,
  network,
}: NetReceivePreviewProps) {
  const parsed = parseFloat(amount);
  const amountCents = Number.isFinite(parsed) && parsed > 0 ? toCents(parsed) : null;

  const netCents = useMemo(() => {
    if (amountCents === null) return null;
    const cryptoContext =
      method === 'crypto' && targetCurrency && network
        ? { targetCurrency, network }
        : undefined;
    const { netCents: net } = computeFees(method, amountCents, cryptoContext);
    return net > 0 ? net : null;
  }, [method, amountCents, targetCurrency, network]);

  if (netCents === null) return null;

  return (
    <p className="text-sm font-medium motion-reduce:transition-none" aria-live="polite">
      <span className="text-muted-foreground">{youReceiveLabel}: </span>
      <span className="text-green-500">{formatCentsToCurrency(netCents, 'EUR')}</span>
    </p>
  );
}
