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
import { Skeleton } from "@/components/ui/skeleton";
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
import { formatWalletFragments, formatWalletMoney } from "@/lib/nav-wallet-format";
import { localeToDateLocale } from "@/lib/giveaway-presentation";
import { cn } from "@/lib/utils";

type UserBalanceResponse = {
  availableCents?: number;
  pendingBalanceCents?: number;
};

const FRAGMENTS_SLOT = "inline-flex min-w-[2.75rem] justify-end";
const BALANCE_SLOT = "inline-flex min-w-[4.25rem] justify-end";

function useFlashOnChange(value: number | string) {
  const [flash, setFlash] = useState(false);
  const prev = useRef<number | string | null>(null);

  useEffect(() => {
    if (prev.current === null) {
      prev.current = value;
      return;
    }
    if (prev.current === value) return;
    prev.current = value;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    setFlash(true);
    const timer = window.setTimeout(() => setFlash(false), 420);
    return () => window.clearTimeout(timer);
  }, [value]);

  return flash;
}

function useConvertedBalanceCents(cents: number, enabled: boolean) {
  const { selectedCurrency } = useCurrency();
  const [convertedCents, setConvertedCents] = useState(cents);
  const [ready, setReady] = useState(() => enabled && selectedCurrency === "EUR");

  useEffect(() => {
    if (!enabled) {
      setReady(false);
      return;
    }

    let mounted = true;

    const convert = async () => {
      if (selectedCurrency !== "EUR") {
        setReady(false);
      }
      try {
        const next =
          selectedCurrency === "EUR"
            ? cents
            : await currencyConverter.convertCents(cents, "EUR", selectedCurrency);
        if (mounted) {
          setConvertedCents(next);
          setReady(true);
        }
      } catch {
        if (mounted) {
          setConvertedCents(cents);
          setReady(true);
        }
      }
    };

    void convert();
    return () => {
      mounted = false;
    };
  }, [cents, selectedCurrency, enabled]);

  return { cents: convertedCents, currency: selectedCurrency, ready };
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

function WalletChipValue({
  loading,
  display,
  exact,
  abbreviated,
  className,
  slotClassName,
}: {
  loading: boolean;
  display: string;
  exact: string;
  abbreviated: boolean;
  className?: string;
  slotClassName: string;
}) {
  if (loading) {
    return (
      <span className={slotClassName} aria-hidden>
        <Skeleton className="h-3 w-full rounded-sm" />
      </span>
    );
  }

  const value = (
    <FlashValue value={exact} className={cn(slotClassName, className)}>
      {display}
    </FlashValue>
  );

  if (!abbreviated) return value;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex max-w-full" title={exact}>
          {value}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="z-[220] tabular-nums">
        {exact}
      </TooltipContent>
    </Tooltip>
  );
}

export function NavWallet() {
  const { user } = useAuth();
  const { locale, messages } = useLocale();
  const wallet = messages.nav.wallet;
  const numberLocale = localeToDateLocale(locale);
  const fragments = user?.fragments ?? 0;
  const fragmentsValue = formatWalletFragments(fragments, numberLocale);

  const { data: balanceData, isPending: isBalancePending } = useQuery<UserBalanceResponse>({
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

  const isBalanceLoading = !!user && isBalancePending;
  const availableCents = balanceData?.availableCents ?? 0;
  const pendingCents = balanceData?.pendingBalanceCents ?? 0;
  const availableConverted = useConvertedBalanceCents(availableCents, !!user && !isBalancePending);
  const pendingConverted = useConvertedBalanceCents(pendingCents, !!user && !isBalancePending && pendingCents > 0);

  const availableMoney = formatWalletMoney(
    availableConverted.cents,
    availableConverted.currency,
    numberLocale
  );
  const pendingMoney = formatWalletMoney(
    pendingConverted.cents,
    pendingConverted.currency,
    numberLocale
  );
  const isAvailableReady = !isBalanceLoading && availableConverted.ready;
  const walletLabel = isAvailableReady
    ? `${wallet.label}: ${fragmentsValue.exact}, ${availableMoney.exact}`
    : `${wallet.label}, ${messages.common.loading}`;

  if (!user) return null;

  return (
    <div
      id="nav-fragments"
      data-slot="nav-wallet"
      aria-busy={!isAvailableReady}
      className="flex h-9 w-max max-w-full shrink-0 items-center overflow-visible whitespace-nowrap rounded-full border border-border bg-foreground/[0.06] min-w-[10.25rem] min-[768px]:min-w-[13.75rem]"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-9 min-w-0 items-center gap-1.5 rounded-full px-2 text-foreground transition-opacity duration-200 hover:bg-foreground/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 min-[768px]:gap-2 min-[768px]:px-2.5"
            aria-label={walletLabel}
          >
            <FragmentBadge
              size="xs"
              alt=""
              className="h-5 w-auto max-w-none min-[768px]:h-6"
            />
            <WalletChipValue
              loading={false}
              display={fragmentsValue.display}
              exact={fragmentsValue.exact}
              abbreviated={fragmentsValue.abbreviated}
              slotClassName={FRAGMENTS_SLOT}
              className="font-display text-xs font-medium text-foreground min-[768px]:text-sm"
            />
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
            <WalletChipValue
              loading={!isAvailableReady}
              display={availableMoney.display}
              exact={availableMoney.exact}
              abbreviated={availableMoney.abbreviated}
              slotClassName={BALANCE_SLOT}
              className="text-right font-display text-sm font-semibold tracking-tight text-foreground"
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[220px] z-[220]">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{wallet.availableFragments}</span>
                <span className="font-medium tabular-nums text-foreground" title={fragmentsValue.exact}>
                  {fragmentsValue.exact}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{wallet.availableBalance}</span>
                {isAvailableReady ? (
                  <span className="font-semibold tabular-nums text-foreground" title={availableMoney.exact}>
                    {availableMoney.exact}
                  </span>
                ) : (
                  <Skeleton className="h-3 w-16 rounded-sm" />
                )}
              </div>
              {isAvailableReady && pendingCents > 0 ? (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">{wallet.pendingBalance}</span>
                  {pendingConverted.ready ? (
                    <span className="font-medium tabular-nums text-foreground" title={pendingMoney.exact}>
                      {pendingMoney.exact}
                    </span>
                  ) : (
                    <Skeleton className="h-3 w-16 rounded-sm" />
                  )}
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
            className="nav-wallet-action m-[3px] hidden h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background min-[768px]:inline-flex"
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

export function NavWalletSkeleton() {
  return (
    <div
      data-slot="nav-wallet"
      aria-hidden
      className="flex h-9 w-max max-w-full shrink-0 items-center overflow-hidden rounded-full border border-border bg-foreground/[0.06] min-w-[10.25rem] min-[768px]:min-w-[13.75rem]"
    >
      <div className="flex h-9 min-w-0 flex-1 items-center gap-1.5 px-2 min-[768px]:gap-2 min-[768px]:px-2.5">
        <Skeleton className="h-5 w-5 shrink-0 rounded-full min-[768px]:h-6 min-[768px]:w-6" />
        <span className={FRAGMENTS_SLOT}>
          <Skeleton className="h-3 w-full rounded-sm" />
        </span>
        <span className="hidden h-4 w-4 shrink-0 min-[768px]:inline-flex" />
        <span className="h-4 w-px shrink-0 bg-border" />
        <span className={BALANCE_SLOT}>
          <Skeleton className="h-3 w-full rounded-sm" />
        </span>
      </div>
      <span className="m-[3px] hidden h-[30px] w-[30px] shrink-0 min-[768px]:inline-flex">
        <Skeleton className="h-full w-full rounded-full" />
      </span>
    </div>
  );
}
