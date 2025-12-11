'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, Wallet } from 'lucide-react';
import { useLocale } from '@/components/providers/locale-provider';

export type PaymentMethodType = 'SEPA' | 'CRYPTO';

interface PaymentMethodSelectorProps {
  onSelect: (method: PaymentMethodType) => void;
  selectedMethod?: PaymentMethodType;
  disabled?: boolean;
}

export function PaymentMethodSelector({
  onSelect,
  selectedMethod,
  disabled = false,
}: PaymentMethodSelectorProps) {
  const { messages } = useLocale();
  const [selected, setSelected] = useState<PaymentMethodType>(selectedMethod || 'SEPA');

  const handleSelect = (value: string) => {
    const method = value as PaymentMethodType;
    setSelected(method);
    onSelect(method);
  };

  const t = messages.paymentComponents.methodSelector;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>
          {t.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selected}
          onValueChange={handleSelect}
          disabled={disabled}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Option SEPA */}
          <Label
            htmlFor="sepa"
            className={`flex flex-col items-center gap-3 p-6 border-2 rounded-lg cursor-pointer transition-all hover:border-primary ${
              selected === 'SEPA' ? 'border-primary bg-primary/5' : 'border-border'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RadioGroupItem value="SEPA" id="sepa" className="sr-only" />
            <CreditCard className="h-12 w-12 text-primary" />
            <div className="text-center space-y-1">
              <h3 className="font-semibold text-lg">{t.sepa.title}</h3>
              <p className="text-sm text-muted-foreground">
                {t.sepa.description}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{t.sepa.delay}</span>
              <span>•</span>
              <span>{t.sepa.fees}</span>
            </div>
          </Label>

          {/* Option Crypto */}
          <Label
            htmlFor="crypto"
            className={`flex flex-col items-center gap-3 p-6 border-2 rounded-lg cursor-pointer transition-all hover:border-primary ${
              selected === 'CRYPTO' ? 'border-primary bg-primary/5' : 'border-border'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RadioGroupItem value="CRYPTO" id="crypto" className="sr-only" />
            <Wallet className="h-12 w-12 text-primary" />
            <div className="text-center space-y-1">
              <h3 className="font-semibold text-lg">{t.crypto.title}</h3>
              <p className="text-sm text-muted-foreground">
                {t.crypto.description}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{t.crypto.delay}</span>
              <span>•</span>
              <span>{t.crypto.fees}</span>
            </div>
          </Label>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}

