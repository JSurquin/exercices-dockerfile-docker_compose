"use client";

import { useEffect, useMemo, useState } from "react";
import CountUp from "react-countup";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NormalizedInventoryItem } from "@/hooks/use-skinplace-inventory";
import { useLocale } from "@/components/providers/locale-provider";
import { useCurrency } from "@/components/providers/currency-provider";
import {
  currencyConverter,
  SUPPORTED_CURRENCIES,
  SupportedCurrency,
} from "@/lib/currency-converter";

function getCurrencyAffixes(currency: SupportedCurrency) {
  const symbol = SUPPORTED_CURRENCIES[currency].symbol;
  if (currency === "EUR") {
    return { prefix: "", suffix: symbol };
  }
  return { prefix: symbol, suffix: "" };
}

interface SellSelectionPanelProps {
  items: NormalizedInventoryItem[];
  onContinue: () => void;
  onDeselect: () => void;
}

export function SellSelectionPanel({ items, onContinue, onDeselect }: SellSelectionPanelProps) {
  const { messages } = useLocale();
  const { selectedCurrency } = useCurrency();
  const sp = messages.components.skinplace;
  const t = messages.sellPage.selectionPanel;

  const totalCentimes = items.reduce((sum, item) => sum + item.price_centimes, 0);
  const [displayCentimes, setDisplayCentimes] = useState(0);
  const [isConverting, setIsConverting] = useState(false);
  const { prefix, suffix } = useMemo(
    () => getCurrencyAffixes(selectedCurrency),
    [selectedCurrency],
  );

  useEffect(() => {
    let cancelled = false;
    setIsConverting(true);
    (async () => {
      try {
        const converted = await currencyConverter.convertCents(totalCentimes, "USD", selectedCurrency);
        if (!cancelled) {
          setDisplayCentimes(Math.round(converted));
        }
      } catch {
        if (!cancelled) {
          setDisplayCentimes(totalCentimes);
        }
      } finally {
        if (!cancelled) {
          setIsConverting(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [totalCentimes, selectedCurrency]);

  return (
    <Card className="brand-panel">
      <CardContent className="p-3.5 space-y-3">
        <div>
          <p className="text-sm text-muted-foreground mb-1.5">{t.selectedTotal}</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 tabular-nums">
            {isConverting && items.length > 0 && displayCentimes === 0 ? (
              "…"
            ) : (
              <CountUp
                end={displayCentimes / 100}
                duration={0.3}
                decimals={2}
                prefix={prefix}
                suffix={suffix}
                preserveValue
              />
            )}
          </p>
          <p className="text-sm text-muted-foreground mt-1.5">
            {items.length} {sp.itemsSelected}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={items.length === 0}
            onClick={onContinue}
          >
            {sp.continueWithSelection}
          </Button>
          {items.length > 0 && (
            <Button type="button" variant="outline" className="w-full" onClick={onDeselect}>
              {sp.deselectAll}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
