'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Plus, CheckCircle } from 'lucide-react';
import { StripePaymentMethod } from '@/lib/types';
import { useLocale } from '@/components/providers/locale-provider';

interface PaymentMethodsListProps {
  onAddNew: () => void;
  onSelect: (paymentMethodId: string) => void;
  selectedId?: string;
  className?: string;
}

export function PaymentMethodsList({
  onAddNew,
  onSelect,
  selectedId,
  className,
}: PaymentMethodsListProps) {
  const { messages } = useLocale();
  const [paymentMethods, setPaymentMethods] = useState<StripePaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/stripe/payment-methods');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || messages.paymentMethodsList.loadingError);
      }

      setPaymentMethods(data.paymentMethods || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : messages.paymentMethodsList.unknownError);
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'sepa_debit':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getPaymentMethodLabel = (pm: StripePaymentMethod) => {
    if (pm.type === 'card' && pm.card) {
      return `**** **** **** ${pm.card.last4}`;
    }
    if (pm.type === 'sepa_debit' && pm.sepa_debit) {
      return `**** ${pm.sepa_debit.last4}`;
    }
    return messages.paymentMethodsList.paymentMethod;
  };

  const getPaymentMethodDescription = (pm: StripePaymentMethod) => {
    if (pm.type === 'card' && pm.card) {
      return `${pm.card.brand.toUpperCase()} • ${pm.card.expMonth}/${pm.card.expYear}`;
    }
    if (pm.type === 'sepa_debit' && pm.sepa_debit) {
      return `SEPA • ${pm.sepa_debit.country.toUpperCase()}`;
    }
    return pm.type.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">{messages.paymentMethodsList.loading}</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{messages.paymentMethodsList.title}</h3>
        <Button onClick={onAddNew} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {messages.paymentMethodsList.add}
        </Button>
      </div>

      {paymentMethods.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              {messages.paymentMethodsList.noMethods}
            </p>
            <Button onClick={onAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              {messages.paymentMethodsList.addMethod}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {paymentMethods.map((pm) => (
            <Card
              key={pm.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedId === pm.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onSelect(pm.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getPaymentMethodIcon(pm.type)}
                    <div>
                      <p className="font-medium">{getPaymentMethodLabel(pm)}</p>
                      <p className="text-sm text-muted-foreground">
                        {getPaymentMethodDescription(pm)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {selectedId === pm.id && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                    <Badge variant="secondary">
                      {pm.type === 'card' ? 'Card' : messages.paymentMethodsList.sepa}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
