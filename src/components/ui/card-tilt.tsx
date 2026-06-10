import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardTiltProps {
  children: ReactNode;
  className?: string;
  shimmer?: boolean;
}

/**
 * Card glassmorphism 3D, tilt au hover en CSS pur (plus fluide que le tracking souris JS).
 */
export function CardTilt({ children, className, shimmer = false }: CardTiltProps) {
  return (
    <div className={cn("lunar-card card-tilt", shimmer && "chrome-shimmer", className)}>
      {children}
    </div>
  );
}
