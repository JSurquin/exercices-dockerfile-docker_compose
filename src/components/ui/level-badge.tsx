"use client";

import { cn } from "@/lib/utils";
import { getTierBadgeSrc } from "@/lib/level-system";

const SIZE_CLASSES = {
  xs: "h-6 w-6",
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
} as const;

/** Fragment icon is wide (16:9) — height only, no square crop */
const FRAGMENT_SIZE_CLASSES = {
  xs: "h-6 w-auto max-w-none",
  sm: "h-9 w-auto max-w-none",
  md: "h-12 w-auto max-w-none",
  lg: "h-16 w-auto max-w-none",
  xl: "h-24 w-auto max-w-none",
} as const;

interface LevelBadgeProps {
  tierIndex: number;
  size?: keyof typeof SIZE_CLASSES;
  pixelSize?: number;
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}

export function LevelBadge({
  tierIndex,
  size = "md",
  pixelSize,
  className,
  alt,
  style,
}: LevelBadgeProps) {
  const src = getTierBadgeSrc(tierIndex);

  return (
    <img
      src={src}
      alt={alt ?? `Tier ${tierIndex + 1}`}
      className={cn(
        "object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.35)]",
        pixelSize == null && SIZE_CLASSES[size],
        className
      )}
      style={
        pixelSize != null
          ? { width: pixelSize, height: pixelSize, ...style }
          : style
      }
      draggable={false}
    />
  );
}

interface FragmentBadgeProps {
  size?: keyof typeof FRAGMENT_SIZE_CLASSES;
  className?: string;
  alt?: string;
}

export function FragmentBadge({
  size = "md",
  className,
  alt = "Fragments",
}: FragmentBadgeProps) {
  return (
    <img
      src="/levels/FRAGMENTMS.png"
      alt={alt}
      className={cn(
        "block shrink-0 overflow-visible object-contain drop-shadow-[0_0_12px_rgba(236,72,153,0.35)]",
        FRAGMENT_SIZE_CLASSES[size],
        className
      )}
      draggable={false}
    />
  );
}

interface FragmentAmountProps {
  amount: number | string;
  size?: keyof typeof FRAGMENT_SIZE_CLASSES;
  className?: string;
  prefix?: string;
  showBadge?: boolean;
}

export function FragmentAmount({
  amount,
  size = "xs",
  className,
  prefix = "",
  showBadge = true,
}: FragmentAmountProps) {
  return (
    <span className={cn("inline-flex items-center gap-1 overflow-visible", className)}>
      {prefix}
      <span>{amount}</span>
      {showBadge && <FragmentBadge size={size} />}
    </span>
  );
}
