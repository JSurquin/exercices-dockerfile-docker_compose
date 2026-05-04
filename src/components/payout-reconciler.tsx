'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { formatCentsToCurrency } from '@/lib/currency-converter';

interface ReconcileResult {
  payoutId: string;
  action: 'debited' | 'failed' | 'unchanged' | 'error';
  amountCents: number;
  provider?: 'flexify' | 'whitepay';
}

interface ReconcileResponse {
  results: ReconcileResult[];
}

async function fetchReconcile(): Promise<ReconcileResponse> {
  const res = await fetch('/api/user/payouts/reconcile');
  if (!res.ok) throw new Error('Reconcile failed');
  return res.json();
}

export function PayoutReconciler() {
  const { user } = useAuth();
  const toastedRef = useRef<Set<string>>(new Set());

  const { data } = useQuery<ReconcileResponse>({
    queryKey: ['payout-reconcile'],
    queryFn: fetchReconcile,
    enabled: !!user,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
  });

  useEffect(() => {
    if (!data?.results) return;

    for (const r of data.results) {
      if (toastedRef.current.has(r.payoutId)) continue;

      if (r.action === 'debited') {
        toastedRef.current.add(r.payoutId);
        toast.success('Payout confirmé', {
          description: `Votre retrait de ${formatCentsToCurrency(r.amountCents, 'EUR')} a été traité avec succès.`,
          duration: 8000,
        });
      } else if (r.action === 'failed') {
        toastedRef.current.add(r.payoutId);
        toast.error('Payout échoué', {
          description: `Votre retrait de ${formatCentsToCurrency(r.amountCents, 'EUR')} a échoué. Votre solde a été rétabli.`,
          duration: 8000,
        });
      }
    }
  }, [data]);

  return null;
}
