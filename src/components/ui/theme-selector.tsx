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
import { SwatchIcon } from "@heroicons/react/24/outline";
import { APP_THEMES, type AppTheme, normalizeStoredTheme } from "@/lib/themes";

const THEME_ICON: Record<AppTheme, string> = {
  moonskin: "🌙",
  light: "☀️",
  cs2: "🔥",
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
        {APP_THEMES.map((t) => (
          <DropdownMenuItem
            key={t}
            onClick={() => setTheme(t)}
            className={current === t ? "bg-accent font-medium" : ""}
          >
            <span className="mr-2">{THEME_ICON[t]}</span>
            {messages.nav[THEME_LABEL_KEY[t]]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
