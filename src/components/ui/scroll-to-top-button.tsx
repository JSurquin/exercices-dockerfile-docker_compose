"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronUpIcon } from "@heroicons/react/24/outline";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

const SCROLL_THRESHOLD_PX = 400;

/** Offset above the chat FAB: chat height (3.5rem) + gap (0.75rem) */
const OFFSET_ABOVE_CHAT = "4.25rem";

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const { messages } = useLocale();

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > SCROLL_THRESHOLD_PX);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, []);

  return (
    <div
      className={cn(
        "fixed right-[max(1rem,env(safe-area-inset-right,0px))] z-[99998] pointer-events-none sm:right-[max(1.5rem,env(safe-area-inset-right,0px))]",
        "bottom-[calc(max(1rem,env(safe-area-inset-bottom,0px))+var(--scroll-top-offset))]",
        "sm:bottom-[calc(max(1.5rem,env(safe-area-inset-bottom,0px))+var(--scroll-top-offset))]",
        "transition-all duration-200",
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-2 pointer-events-none"
      )}
      style={
        {
          "--scroll-top-offset": OFFSET_ABOVE_CHAT,
        } as React.CSSProperties
      }
    >
      <button
        type="button"
        onClick={scrollToTop}
        aria-label={messages.common.scrollToTop}
        tabIndex={visible ? 0 : -1}
        className={cn(
          "h-11 w-11 rounded-full",
          "bg-background/90 backdrop-blur-md border border-orange-500/30",
          "shadow-lg shadow-black/10 dark:shadow-black/40",
          "flex items-center justify-center cursor-pointer",
          "transition-transform duration-200 hover:scale-110 active:scale-95",
          "hover:border-orange-500/60 hover:bg-orange-500/10",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
      >
        <ChevronUpIcon className="h-5 w-5 text-orange-500" aria-hidden />
      </button>
    </div>
  );
}
