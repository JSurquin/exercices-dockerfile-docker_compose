"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BanknotesIcon,
  ChartBarIcon,
  ClockIcon,
  GiftIcon,
  InformationCircleIcon,
  PlusIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { FragmentBadge } from "@/components/ui/level-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/components/providers/auth-provider";
import { useCurrency } from "@/components/providers/currency-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { queryKeys } from "@/lib/query-keys";
import { currencyConverter } from "@/lib/currency-converter";
import { localeToDateLocale } from "@/lib/giveaway-presentation";
import { cn } from "@/lib/utils";

type UserBalanceResponse = {
  availableCents?: number;
  pendingBalanceCents?: number;
};

function useFlashOnChange(value: number | string) {
  const [flash, setFlash] = useState(false);
  const prev = useRef<number | string | null>(null);

  useEffect(() => {
    if (prev.current === null) {
      prev.current = value;
      return;
    }
    if (prev.current === value) return;
    if (prev.current === "\u00a0" || value === "\u00a0") {
      prev.current = value;
      return;
    }
    prev.current = value;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    setFlash(true);
    const timer = window.setTimeout(() => setFlash(false), 420);
    return () => window.clearTimeout(timer);
  }, [value]);

  return flash;
}

function useConvertedBalanceLabel(cents: number) {
  const { selectedCurrency } = useCurrency();
  const [label, setLabel] = useState(() =>
    selectedCurrency === "EUR" ? currencyConverter.formatPrice(cents, "EUR") : "\u00a0"
  );

  useEffect(() => {
    let mounted = true;

    const convert = async () => {
      try {
        const converted =
          selectedCurrency === "EUR"
            ? cents
            : await currencyConverter.convertCents(cents, "EUR", selectedCurrency);
        if (mounted) {
          setLabel(currencyConverter.formatPrice(converted, selectedCurrency));
        }
      } catch {
        if (mounted) {
          setLabel(currencyConverter.formatPrice(cents, selectedCurrency));
        }
      }
    };

    void convert();
    return () => {
      mounted = false;
    };
  }, [cents, selectedCurrency]);

  return label;
}

function FlashValue({
  value,
  className,
  children,
}: {
  value: number | string;
  className?: string;
  children: ReactNode;
}) {
  const flash = useFlashOnChange(value);
  return (
    <span className={cn("inline-block origin-center tabular-nums", flash && "nav-wallet-flash", className)}>
      {children}
    </span>
  );
}

export function NavWallet() {
  const { user } = useAuth();
  const { locale, messages } = useLocale();
  const wallet = messages.nav.wallet;
  const fragments = user?.fragments ?? 0;
  const formattedFragments = new Intl.NumberFormat(localeToDateLocale(locale)).format(fragments);

  const { data: balanceData } = useQuery<UserBalanceResponse>({
    queryKey: queryKeys.userBalance,
    queryFn: async () => {
      const response = await fetch("/api/user/balance");
      if (!response.ok) return { availableCents: 0, pendingBalanceCents: 0 };
      return response.json();
    },
    enabled: !!user,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });

  const availableCents = balanceData?.availableCents ?? 0;
  const pendingCents = balanceData?.pendingBalanceCents ?? 0;
  const availableLabel = useConvertedBalanceLabel(availableCents);
  const pendingLabel = useConvertedBalanceLabel(pendingCents);

  if (!user) return null;

  return (
    <div
      id="nav-fragments"
      data-slot="nav-wallet"
      className="flex h-9 shrink-0 items-center overflow-visible whitespace-nowrap rounded-full border border-border bg-foreground/[0.06]"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-9 items-center gap-1.5 rounded-full px-2 text-foreground transition-opacity duration-200 hover:bg-foreground/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 min-[768px]:gap-2 min-[768px]:px-2.5"
            aria-label={wallet.label}
          >
            <FragmentBadge
              size="xs"
              alt={wallet.availableFragments}
              className="h-5 w-auto max-w-none min-[768px]:h-6"
            />
            <FlashValue
              value={fragments}
              className="font-display text-xs font-medium text-foreground min-[768px]:text-sm"
            >
              {formattedFragments}
            </FlashValue>
            <span
              className="hidden min-[768px]:inline-flex"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.preventDefault()}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="inline-flex h-4 w-4 items-center justify-center text-foreground/80 transition-opacity duration-200 hover:text-foreground"
                    aria-hidden
                  >
                    <InformationCircleIcon className="h-3.5 w-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="z-[220] max-w-[220px] space-y-1.5 p-3">
                  <p>{wallet.fragmentsHint}</p>
                  <Link
                    href="/missions"
                    className="inline-flex font-medium text-primary-foreground underline-offset-2 hover:underline"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {wallet.earnFragments}
                  </Link>
                </TooltipContent>
              </Tooltip>
            </span>
            <span className="h-4 w-px shrink-0 bg-border" aria-hidden />
            <FlashValue
              value={availableLabel}
              className="min-w-[3.25rem] text-right font-display text-sm font-semibold tracking-tight text-foreground"
            >
              {availableLabel}
            </FlashValue>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[220px] z-[220]">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{wallet.availableFragments}</span>
                <span className="font-medium tabular-nums text-foreground">{formattedFragments}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{wallet.availableBalance}</span>
                <span className="font-semibold tabular-nums text-foreground">{availableLabel}</span>
              </div>
              {pendingCents > 0 ? (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">{wallet.pendingBalance}</span>
                  <span className="font-medium tabular-nums text-foreground">{pendingLabel}</span>
                </div>
              ) : null}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/missions" className="flex items-center gap-2">
              <SparklesIcon className="h-4 w-4" />
              {messages.nav.missions}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/giveaways" className="flex items-center gap-2">
              <GiftIcon className="h-4 w-4" />
              {messages.nav.giveaways}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/payout" className="flex items-center gap-2">
              <BanknotesIcon className="h-4 w-4" />
              {wallet.withdraw}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="nav-wallet-action m-[3px] hidden h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full min-[768px]:inline-flex"
            aria-label={wallet.actionLabel}
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[200px] z-[220]">
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex items-center gap-2">
              <ChartBarIcon className="h-4 w-4" />
              {wallet.viewBalance}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/payout" className="flex items-center gap-2">
              <BanknotesIcon className="h-4 w-4" />
              {wallet.withdraw}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/payout" className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4" />
              {wallet.history}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
