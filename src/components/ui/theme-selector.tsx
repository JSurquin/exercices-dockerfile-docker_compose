"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/components/providers/locale-provider";
import { SwatchIcon, MoonIcon, SunIcon, FireIcon } from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";
import { APP_THEMES, type AppTheme, normalizeStoredTheme } from "@/lib/themes";

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

export function ThemeSelector() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { messages } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const current = normalizeStoredTheme(resolvedTheme ?? theme);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" aria-hidden>
        <SwatchIcon className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          data-tour="theme-selector"
        >
          <SwatchIcon className="h-4 w-4" />
          <span className="sr-only">{messages.nav.themeLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {messages.nav.themeLabel}
        </DropdownMenuLabel>
        {APP_THEMES.map((t) => {
          const Icon = THEME_ICON[t];
          return (
          <DropdownMenuItem
            key={t}
            onClick={() => setTheme(t)}
            className={current === t ? "bg-accent font-medium" : ""}
          >
            <Icon className="mr-2 h-4 w-4 shrink-0" aria-hidden />
            {messages.nav[THEME_LABEL_KEY[t]]}
          </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
