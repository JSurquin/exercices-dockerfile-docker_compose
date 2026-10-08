"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/components/providers/locale-provider";
import { useCurrency } from "@/components/providers/currency-provider";
import { CurrencyFlag } from "@/components/ui/currency-flag";
import { locales, type Locale } from "@/lib/i18n";
import { APP_THEMES, type AppTheme, normalizeStoredTheme } from "@/lib/themes";
import type { SupportedCurrency } from "@/lib/currency-converter";
import { cn } from "@/lib/utils";
import {
  AdjustmentsHorizontalIcon,
  FireIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";

type ThemeIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

const THEME_ICON: Record<AppTheme, ThemeIcon> = {
  moonskin: MoonIcon,
  light: SunIcon,
  cs2: FireIcon,
};

const THEME_LABEL_KEY: Record<AppTheme, "themeMoonskin" | "themeLight" | "themeCs2"> = {
  moonskin: "themeMoonskin",
  light: "themeLight",
  cs2: "themeCs2",
};

const LOCALE_LABEL_KEY: Record<Locale, "localeFr" | "localeEn" | "localeZh"> = {
  fr: "localeFr",
  en: "localeEn",
  cn: "localeZh",
};

const LOCALE_FLAG: Record<Locale, string> = {
  fr: "🇫🇷",
  en: "🇺🇸",
  cn: "🇨🇳",
};

export function PreferenceMenuItems() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { locale, setLocale, messages } = useLocale();
  const { selectedCurrency, setSelectedCurrency, supportedCurrencies } = useCurrency();
  const currentTheme = normalizeStoredTheme(resolvedTheme ?? theme);

  return (
    <>
      <DropdownMenuLabel className="text-xs text-muted-foreground">
        {messages.ui.currency}
      </DropdownMenuLabel>
      {Object.values(supportedCurrencies).map((currency) => (
        <DropdownMenuItem
          key={currency.code}
          onClick={() => setSelectedCurrency(currency.code as SupportedCurrency)}
          className={selectedCurrency === currency.code ? "bg-accent font-medium" : ""}
        >
          <CurrencyFlag currency={currency.code} />
          <span className="font-mono font-bold">{currency.code}</span>
          <span className="ml-auto text-muted-foreground">{currency.symbol}</span>
        </DropdownMenuItem>
      ))}

      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-xs text-muted-foreground">
        {messages.nav.themeLabel}
      </DropdownMenuLabel>
      {APP_THEMES.map((t) => {
        const Icon = THEME_ICON[t];
        return (
          <DropdownMenuItem
            key={t}
            onClick={() => setTheme(t)}
            className={currentTheme === t ? "bg-accent font-medium" : ""}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {messages.nav[THEME_LABEL_KEY[t]]}
          </DropdownMenuItem>
        );
      })}

      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-xs text-muted-foreground">
        {messages.nav.language}
      </DropdownMenuLabel>
      {locales.map((loc) => (
        <DropdownMenuItem
          key={loc}
          onClick={() => setLocale(loc as Locale)}
          className={locale === loc ? "bg-theme-accent/10 text-theme-accent" : ""}
        >
          <span aria-hidden>{LOCALE_FLAG[loc]}</span>
          {messages.nav[LOCALE_LABEL_KEY[loc]]}
        </DropdownMenuItem>
      ))}
    </>
  );
}

interface NavPreferencesMenuProps {
  menuClassName?: string;
  className?: string;
}

export function NavPreferencesMenu({ menuClassName, className }: NavPreferencesMenuProps) {
  const { messages } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-9 w-9 shrink-0 rounded-xl", className)}
        aria-hidden
      >
        <AdjustmentsHorizontalIcon className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 shrink-0 rounded-xl hover:bg-transparent hover:text-foreground",
            className
          )}
          data-tour="theme-selector"
          data-language-selector
          aria-label={messages.ui.preferences}
        >
          <AdjustmentsHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={cn("min-w-[200px] z-[210]", menuClassName)}>
        <PreferenceMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
