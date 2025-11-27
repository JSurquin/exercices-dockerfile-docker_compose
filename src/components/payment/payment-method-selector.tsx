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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choisissez votre mode de paiement</CardTitle>
        <CardDescription>
          Sélectionnez comment vous souhaitez recevoir votre paiement
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
              <h3 className="font-semibold text-lg">Virement SEPA</h3>
              <p className="text-sm text-muted-foreground">
                Recevez votre paiement directement sur votre compte bancaire
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Délai: 1-3 jours</span>
              <span>•</span>
              <span>Frais: ~0.5%</span>
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
              <h3 className="font-semibold text-lg">Crypto-monnaie</h3>
              <p className="text-sm text-muted-foreground">
                Recevez votre paiement en crypto sur votre wallet
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Délai: Instantané</span>
              <span>•</span>
              <span>Frais réseau variables</span>
            </div>
          </Label>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}

