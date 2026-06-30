"use client";

import { useEffect, useMemo, useState } from "react";
import CountUp from "react-countup";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NormalizedInventoryItem } from "@/hooks/use-skinplace-inventory";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { useCurrency } from "@/components/providers/currency-provider";
import {
  currencyConverter,
  SUPPORTED_CURRENCIES,
  SupportedCurrency,
} from "@/lib/currency-converter";
import { cn } from "@/lib/utils";

/** Same blue as merchant prices on inventory cards (#3B82F6 / blue-500). */
const MERCHANT_PRICE_TEXT_CLASS = "text-blue-500 dark:text-blue-400";

function getItemPriceWithBonusCentimes(
  item: NormalizedInventoryItem,
  bonusRatePercent: number,
): number {
  if (bonusRatePercent <= 0) return item.price_centimes;
  return item.price_centimes + Math.round(item.price_centimes * bonusRatePercent / 100);
}

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
  embedded?: boolean;
}

export function SellSelectionPanel({
  items,
  onContinue,
  onDeselect,
  embedded = false,
}: SellSelectionPanelProps) {
  const { user } = useAuth();
  const { messages } = useLocale();
  const { selectedCurrency } = useCurrency();
  const sp = messages.components.skinplace;
  const t = messages.sellPage.selectionPanel;
  const bonusRatePercent = user?.bonusRatePercent ?? 0;
  const hasMerchantPricing = bonusRatePercent > 0;

  const totalCentimes = items.reduce(
    (sum, item) => sum + getItemPriceWithBonusCentimes(item, bonusRatePercent),
    0,
  );
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

  const hasSelection = items.length > 0;

  const panelBody = (
    <div className={embedded ? "space-y-2" : "space-y-3"}>
      <div>
        <p
          className={
            embedded
              ? "text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 mb-0.5"
              : "text-sm text-muted-foreground mb-1.5"
          }
        >
          {t.selectedTotal}
        </p>
        <p
          className={cn(
            "font-bold tabular-nums",
            embedded ? "text-2xl" : "text-3xl",
            hasMerchantPricing
              ? MERCHANT_PRICE_TEXT_CLASS
              : "text-green-600 dark:text-green-400",
          )}
        >
          {isConverting && hasSelection && displayCentimes === 0 ? (
            "…"
          ) : (
            <CountUp
              end={displayCentimes / 100}
              duration={0.45}
              decimals={2}
              prefix={prefix}
              suffix={suffix}
              preserveValue
            />
          )}
        </p>
        <p
          className={
            embedded
              ? "text-[11px] text-muted-foreground/80 mt-0.5"
              : "text-sm text-muted-foreground mt-1.5"
          }
        >
          {items.length} {sp.itemsSelected}
        </p>
      </div>

      <div className={cn("flex flex-col", embedded ? "gap-1.5" : "gap-3")}>
        <Button
          type="button"
          variant="cta"
          className={cn(
            "w-full transition-all duration-200",
            hasSelection &&
              "shadow-[0_4px_24px_var(--cta-shadow),0_0_32px_rgba(126,179,232,0.22)] hover:shadow-[0_8px_32px_var(--cta-shadow),0_0_40px_rgba(126,179,232,0.28)]",
          )}
          disabled={!hasSelection}
          onClick={onContinue}
        >
          {sp.continueWithSelection}
        </Button>
        {hasSelection && !embedded && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full border-[rgba(159,196,255,0.22)] bg-white/[0.03] hover:bg-white/[0.06]"
            onClick={onDeselect}
          >
            {sp.deselectAll}
          </Button>
        )}
      </div>
    </div>
  );

  if (embedded) {
    return panelBody;
  }

  return (
    <Card className="brand-panel">
      <CardContent className="p-3.5">{panelBody}</CardContent>
    </Card>
  );
}
