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
  const [chatOpen, setChatOpen] = useState(false);
  const { messages } = useLocale();

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > SCROLL_THRESHOLD_PX);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onChatOpenChange = (e: Event) => {
      setChatOpen((e as CustomEvent<{ open: boolean }>).detail.open);
    };
    window.addEventListener("chat-widget-open-change", onChatOpenChange);
    return () =>
      window.removeEventListener("chat-widget-open-change", onChatOpenChange);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, []);

  const showButton = visible && !chatOpen;

  return (
    <div
      className={cn(
        "pointer-events-auto absolute right-[max(1rem,env(safe-area-inset-right,0px))] z-[99998] sm:right-[max(1.5rem,env(safe-area-inset-right,0px))]",
        "bottom-[calc(max(1rem,env(safe-area-inset-bottom,0px))+var(--scroll-top-offset))]",
        "sm:bottom-[calc(max(1.5rem,env(safe-area-inset-bottom,0px))+var(--scroll-top-offset))]",
        "transition-all duration-200",
        showButton
          ? "opacity-100 translate-y-0"
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
        tabIndex={showButton ? 0 : -1}
        className={cn(
          "h-11 w-11 rounded-full",
          "bg-background/90 backdrop-blur-md border border-theme-accent/30",
          "shadow-lg shadow-black/10 dark:shadow-black/40",
          "flex items-center justify-center cursor-pointer",
          "transition-transform duration-200 hover:scale-110 active:scale-95",
          "hover:border-theme-accent/40 hover:bg-theme-accent/10",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
      >
        <ChevronUpIcon className="h-5 w-5 text-theme-accent" aria-hidden />
      </button>
    </div>
  );
}
