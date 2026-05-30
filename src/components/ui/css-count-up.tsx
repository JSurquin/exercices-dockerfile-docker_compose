"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type CssCountUpProps = {
  value: number;
  decimals?: number;
  duration?: number;
  delay?: number;
  className?: string;
};

/**
 * Compteur animé en CSS pur (@property + keyframes), sans boucle JS.
 */
export function CssCountUp({
  value,
  decimals = 0,
  duration = 2,
  delay = 0,
  className,
}: CssCountUpProps) {
  const style = {
    "--count-to": value,
    "--count-decimals": decimals,
    "--count-duration": `${duration}s`,
    "--count-delay": `${delay}s`,
  } as CSSProperties;

  return (
    <span
      className={cn("home-count-up tabular-nums", className)}
      style={style}
      aria-hidden="true"
    />
  );
}
