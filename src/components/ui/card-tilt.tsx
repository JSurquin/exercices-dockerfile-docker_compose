"use client";

import { useRef, useCallback, type ReactNode, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface CardTiltProps {
  children: ReactNode;
  className?: string;
  shimmer?: boolean;
}

/**
 * Card glassmorphism 3D avec tilt souris (style b9bou, teinte chrome).
 */
export function CardTilt({ children, className, shimmer = false }: CardTiltProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(600px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateY(-4px)`;
  }, []);

  const handleLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(600px) rotateY(0) rotateX(0) translateY(0)";
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={cn("lunar-card", shimmer && "chrome-shimmer", className)}
    >
      {children}
    </div>
  );
}
