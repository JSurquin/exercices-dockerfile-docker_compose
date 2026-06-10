"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NormalizedInventoryItem } from "@/hooks/use-skinplace-inventory";
import { useLocale } from "@/components/providers/locale-provider";
import { useCurrency } from "@/components/providers/currency-provider";
import { currencyConverter } from "@/lib/currency-converter";

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
  const [formattedTotal, setFormattedTotal] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const converted = await currencyConverter.convertCents(totalCentimes, "USD", selectedCurrency);
        if (!cancelled) {
          setFormattedTotal(currencyConverter.formatPrice(converted, selectedCurrency));
        }
      } catch {
        if (!cancelled) {
          setFormattedTotal(currencyConverter.formatPrice(totalCentimes, selectedCurrency));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [totalCentimes, selectedCurrency]);

  return (
    <Card className="brand-panel">
      <CardContent className="p-5 space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1.5">{t.selectedTotal}</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 tabular-nums">
            {items.length > 0 ? formattedTotal || "…" : currencyConverter.formatPrice(0, selectedCurrency)}
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
