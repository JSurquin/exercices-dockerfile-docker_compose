'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { formatCentsToCurrency, toCents } from '@/lib/currency-converter';
import { validateSepaIban } from '@/lib/iban-sepa';
import {
  WHITEPAY_SUPPORTED_CRYPTOS,
  MEMO_REQUIRED_NETWORKS,
  getWhitepayAddressPlaceholder,
} from '@/lib/whitepay';
import {
  BanknotesIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { SEPA_COUNTRY_CODES } from '@/lib/iban-sepa';
import { Store } from 'lucide-react';

const PAYOUT_SUBMIT_BTN_CLASS =
  'w-full h-11 text-base font-semibold bg-theme-accent text-white border border-theme-accent shadow-[0_4px_16px_color-mix(in_srgb,var(--theme-accent)_40%,transparent)] hover:brightness-110 hover:shadow-[0_6px_24px_color-mix(in_srgb,var(--theme-accent)_50%,transparent)] focus-visible:ring-theme-accent/40 disabled:bg-muted/50 disabled:text-muted-foreground disabled:border-border/60 disabled:shadow-none disabled:opacity-100 disabled:brightness-100 disabled:hover:brightness-100';

type MerchantWithdrawText = {
  tabLabel: string;
  infoTitle: string;
  infoDesc: string;
  feeLabel: string;
  bankTab: string;
  cryptoTab: string;
  accountHolderLabel: string;
  ibanLabel: string;
  bicLabel: string;
  countryLabel: string;
  assetLabel: string;
  networkLabel: string;
  addressLabel: string;
  memoLabel: string;
  cryptoWarning: string;
  submitButton: string;
  submitting: string;
  successTitle: string;
  successDesc: string;
  reference: string;
  newRequest: string;
  grossAmount: string;
  youReceive: string;
  feesPreview: string;
  amountRequired: string;
  ibanError: string;
};

interface MerchantWithdrawCardProps {
  amount: string;
  text: MerchantWithdrawText;
  requestText: { minAmount: string; maxAmount: string };
  expanded: boolean;
  onToggle: () => void;
  onSuccess?: () => void;
}

export function MerchantWithdrawCard({
  amount,
  text,
  requestText,
  expanded,
  onToggle,
  onSuccess,
}: MerchantWithdrawCardProps) {
  const [subtype, setSubtype] = useState<'bank' | 'crypto'>('bank');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ reference: string; amountCents: number } | null>(null);

  const [bankForm, setBankForm] = useState({
    accountHolder: '',
    iban: '',
    bic: '',
    country: 'FR',
  });

  const [cryptoForm, setCryptoForm] = useState({
    asset: 'USDT',
    network: 'TRC20',
    address: '',
    memo: '',
  });

  const grossCents = amount && parseFloat(amount) > 0 ? toCents(parseFloat(amount)) : 0;

  const handleSubmit = async () => {
    if (!grossCents) {
      toast.error(text.amountRequired);
      return;
    }

    if (subtype === 'bank') {
      const ibanCheck = validateSepaIban(bankForm.iban);
      if (!ibanCheck.isValid) {
        toast.error(ibanCheck.error ?? text.ibanError);
        return;
      }
    }

    setLoading(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      const body =
        subtype === 'bank'
          ? {
              subtype: 'bank' as const,
              amountCents: grossCents,
              accountHolder: bankForm.accountHolder,
              iban: bankForm.iban,
              bic: bankForm.bic,
              country: bankForm.country,
            }
          : {
              subtype: 'crypto' as const,
              amountCents: grossCents,
              asset: cryptoForm.asset,
              network: cryptoForm.network,
              address: cryptoForm.address,
              memo: cryptoForm.memo || undefined,
            };

      const res = await fetch('/api/payouts/merchant-withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur');

      setResult({
        reference: data.payout.reference,
        amountCents: data.payout.amountCents,
      });
      toast.success(text.successTitle);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const selectedCrypto = WHITEPAY_SUPPORTED_CRYPTOS.find((c) => c.ticker === cryptoForm.asset);
  const needsMemo = MEMO_REQUIRED_NETWORKS.includes(cryptoForm.network);

  return (
    <div
      className={cn(
        'relative z-0 rounded-xl border-2 border-violet-500/60 bg-muted/45 ring-1 ring-violet-500/30',
      )}
    >
      <span className="absolute -top-2.5 -right-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
        <Store className="w-3.5 h-3.5 shrink-0" aria-hidden />
        Merchant
      </span>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className="w-full p-4 sm:p-5 text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
      >
        <div className="flex flex-wrap items-center gap-2 mb-3 pr-16">
          <BanknotesIcon className="w-5 h-5 shrink-0 text-violet-500" />
          <span className="font-semibold text-base sm:text-lg text-foreground">{text.tabLabel}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-muted-foreground">
          <span>{text.feeLabel}</span>
          <span>{text.infoDesc}</span>
        </div>
      </button>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-[225ms] ease-out',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 border-t border-border/50 space-y-4">
            {grossCents > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm mt-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {text.feesPreview}
                </p>
                <div className="flex justify-between text-muted-foreground">
                  <span>{text.grossAmount}</span>
                  <span>{formatCentsToCurrency(grossCents, 'EUR')}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>{text.youReceive}</span>
                  <span className="text-green-500">{formatCentsToCurrency(grossCents, 'EUR')}</span>
                </div>
              </div>
            )}

            {result ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-green-500/40 bg-green-500/5 p-4 space-y-3"
              >
                <h3 className="font-semibold flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircleIcon className="w-5 h-5" />
                  {text.successTitle}
                </h3>
                <p className="text-sm text-muted-foreground">{text.successDesc}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{text.reference}</span>
                  <span className="font-mono text-xs">{result.reference}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setResult(null);
                    setBankForm({ accountHolder: '', iban: '', bic: '', country: 'FR' });
                    setCryptoForm({ asset: 'USDT', network: 'TRC20', address: '', memo: '' });
                  }}
                >
                  {text.newRequest}
                </Button>
              </motion.div>
            ) : (
              <>
                <Tabs value={subtype} onValueChange={(v) => setSubtype(v as 'bank' | 'crypto')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="bank">{text.bankTab}</TabsTrigger>
                    <TabsTrigger value="crypto">{text.cryptoTab}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="bank" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>{text.accountHolderLabel}</Label>
                      <Input
                        value={bankForm.accountHolder}
                        onChange={(e) => setBankForm((p) => ({ ...p, accountHolder: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{text.ibanLabel}</Label>
                      <Input
                        value={bankForm.iban}
                        onChange={(e) => setBankForm((p) => ({ ...p, iban: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{text.bicLabel}</Label>
                        <Input
                          value={bankForm.bic}
                          onChange={(e) => setBankForm((p) => ({ ...p, bic: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{text.countryLabel}</Label>
                        <Select
                          value={bankForm.country}
                          onValueChange={(v) => setBankForm((p) => ({ ...p, country: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[...SEPA_COUNTRY_CODES].sort().map((code) => (
                              <SelectItem key={code} value={code}>
                                {code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="crypto" className="space-y-4 mt-4">
                    <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-400">
                      <InformationCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
                      <p>{text.cryptoWarning}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{text.assetLabel}</Label>
                        <Select
                          value={cryptoForm.asset}
                          onValueChange={(v) => {
                            const crypto = WHITEPAY_SUPPORTED_CRYPTOS.find((c) => c.ticker === v);
                            setCryptoForm((p) => ({
                              ...p,
                              asset: v,
                              network: crypto?.networks[0] ?? p.network,
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {WHITEPAY_SUPPORTED_CRYPTOS.map((c) => (
                              <SelectItem key={c.ticker} value={c.ticker}>
                                {c.ticker}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{text.networkLabel}</Label>
                        <Select
                          value={cryptoForm.network}
                          onValueChange={(v) => setCryptoForm((p) => ({ ...p, network: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(selectedCrypto?.networks ?? []).map((net) => (
                              <SelectItem key={net} value={net}>
                                {net}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{text.addressLabel}</Label>
                      <Input
                        value={cryptoForm.address}
                        onChange={(e) => setCryptoForm((p) => ({ ...p, address: e.target.value.trim() }))}
                        placeholder={getWhitepayAddressPlaceholder(cryptoForm.network)}
                      />
                    </div>
                    {needsMemo && (
                      <div className="space-y-2">
                        <Label>{text.memoLabel}</Label>
                        <Input
                          value={cryptoForm.memo}
                          onChange={(e) => setCryptoForm((p) => ({ ...p, memo: e.target.value }))}
                        />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <Button
                  className={PAYOUT_SUBMIT_BTN_CLASS}
                  disabled={loading || !grossCents}
                  onClick={handleSubmit}
                >
                  {loading ? text.submitting : text.submitButton}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
