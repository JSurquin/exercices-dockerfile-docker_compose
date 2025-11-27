'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/providers/locale-provider';

interface PayoutStatusTrackerProps {
  payoutId: string;
  orderId?: string;
  orderType: 'SEPA' | 'CRYPTO';
  currentStatus: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const STATUS_STEPS = {
  SEPA: [
    { key: 'PENDING', label: 'En attente', description: 'Votre demande est enregistrée' },
    { key: 'VERIFICATION_REQUIRED', label: 'Vérification', description: 'Vérification en cours' },
    { key: 'VERIFIED', label: 'Vérifié', description: 'Vérification terminée' },
    { key: 'PROCESSING', label: 'En traitement', description: 'Paiement en cours' },
    { key: 'PAID', label: 'Payé', description: 'Virement effectué' },
  ],
  CRYPTO: [
    { key: 'PENDING', label: 'En attente', description: 'Votre demande est enregistrée' },
    { key: 'VERIFICATION_REQUIRED', label: 'Vérification', description: 'Vérification en cours' },
    { key: 'PROCESSING', label: 'En traitement', description: 'Transaction en cours' },
    { key: 'PAID', label: 'Envoyé', description: 'Crypto envoyée sur votre wallet' },
  ],
};

export function PayoutStatusTracker({
  payoutId,
  orderId,
  orderType,
  currentStatus,
  autoRefresh = false,
  refreshInterval = 30000,
}: PayoutStatusTrackerProps) {
  const { messages } = useLocale();
  const [status, setStatus] = useState(currentStatus);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  const steps = STATUS_STEPS[orderType];
  const currentStepIndex = steps.findIndex((step) => step.key === status);
  const isFailed = status === 'FAILED';

  // Rafraîchir le statut
  const refreshStatus = async () => {
    if (!orderId) return;

    setIsRefreshing(true);
    try {
      const endpoint =
        orderType === 'SEPA'
          ? `/api/gatefi/offramp/orders/${orderId}`
          : `/api/gatefi/onramp/orders/${orderId}`;

      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setOrderDetails(data.order);

        // Mapper le statut GateFi au statut de notre application
        const newStatus = mapGateFiStatusToAppStatus(data.order.status);
        if (newStatus !== status) {
          setStatus(newStatus);
        }
      }
    } catch (error) {
      console.error('Error refreshing status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !orderId || status === 'PAID' || status === 'FAILED') return;

    const interval = setInterval(refreshStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, orderId, status, refreshInterval]);

  // Mapper les statuts
  const mapGateFiStatusToAppStatus = (gateFiStatus: string): string => {
    switch (gateFiStatus) {
      case 'PENDING':
        return 'PROCESSING';
      case 'PROCESSING':
        return 'PROCESSING';
      case 'COMPLETED':
        return 'PAID';
      case 'FAILED':
      case 'EXPIRED':
      case 'CANCELED':
        return 'FAILED';
      default:
        return 'PENDING';
    }
  };

  // Obtenir l'icône pour chaque étape
  const getStepIcon = (stepIndex: number) => {
    if (isFailed && stepIndex === currentStepIndex) {
      return <XCircle className="h-6 w-6 text-destructive" />;
    }

    if (stepIndex < currentStepIndex) {
      return <CheckCircle2 className="h-6 w-6 text-primary" />;
    }

    if (stepIndex === currentStepIndex) {
      return <Loader2 className="h-6 w-6 text-primary animate-spin" />;
    }

    return <Circle className="h-6 w-6 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Suivi de paiement</CardTitle>
            <CardDescription>
              {orderType === 'SEPA' ? 'Virement SEPA' : 'Paiement Crypto'}
            </CardDescription>
          </div>
          <Badge
            variant={
              status === 'PAID'
                ? 'default'
                : status === 'FAILED'
                  ? 'destructive'
                  : 'secondary'
            }
          >
            {status === 'PAID'
              ? 'Terminé'
              : status === 'FAILED'
                ? 'Échoué'
                : 'En cours'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Timeline */}
          <div className="relative space-y-8">
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex && !isFailed;

              return (
                <div key={step.key} className="relative flex gap-4">
                  {/* Ligne de connexion */}
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'absolute left-3 top-6 h-full w-0.5',
                        isCompleted ? 'bg-primary' : 'bg-muted'
                      )}
                    />
                  )}

                  {/* Icône */}
                  <div className="relative z-10 flex-shrink-0">
                    {getStepIcon(index)}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 pt-0.5">
                    <h4
                      className={cn(
                        'font-semibold',
                        isCurrent && 'text-primary',
                        !isActive && !isCompleted && 'text-muted-foreground'
                      )}
                    >
                      {step.label}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                    {isCurrent && isRefreshing && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Actualisation...
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Détails de la commande */}
          {orderDetails && (
            <div className="mt-6 p-4 bg-muted rounded-lg space-y-2 text-sm">
              <h4 className="font-semibold">Détails de la transaction</h4>
              <div className="space-y-1">
                {orderDetails.cryptoAmount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant crypto</span>
                    <span>
                      {orderDetails.cryptoAmount} {orderDetails.crypto}
                    </span>
                  </div>
                )}
                {orderDetails.fiatAmount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant fiat</span>
                    <span>
                      {orderDetails.fiatAmount} {orderDetails.fiat}
                    </span>
                  </div>
                )}
                {orderDetails.txHash && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction</span>
                    <span className="font-mono text-xs truncate max-w-[200px]">
                      {orderDetails.txHash}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

