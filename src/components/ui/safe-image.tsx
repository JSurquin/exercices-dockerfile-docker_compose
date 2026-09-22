"use client";

import { useState } from "react";
import Image from "next/image";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { shouldUseNextImageOptimizer } from "@/lib/image-optimization";

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackClassName?: string;
  fallbackIcon?: React.ReactNode;
  unoptimized?: boolean;
  priority?: boolean;
  sizes?: string;
  onError?: () => void;
}

export function SafeImage({
  src,
  alt,
  width,
  height,
  className,
  fallbackClassName,
  fallbackIcon,
  unoptimized: _unoptimized = false,
  priority = false,
  sizes,
  onError,
}: SafeImageProps) {
  const [error, setError] = useState(false);
  const resolvedWidth = width || 100;
  const resolvedHeight = height || 100;
  const canOptimize = Boolean(src && shouldUseNextImageOptimizer(src));

  if (!src || error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted/50 text-muted-foreground",
          fallbackClassName,
          className
        )}
        style={width && height ? { width, height } : undefined}
      >
        {fallbackIcon || <PhotoIcon className="w-1/2 h-1/2 opacity-50" />}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={resolvedWidth}
      height={resolvedHeight}
      className={className}
      unoptimized={!canOptimize}
      priority={priority}
      sizes={sizes ?? `${resolvedWidth}px`}
      onError={() => {
        setError(true);
        onError?.();
      }}
    />
  );
}

interface SafeImgProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  fallbackIcon?: React.ReactNode;
  onError?: () => void;
}

export function SafeImg({
  src,
  alt,
  className,
  fallbackClassName,
  fallbackIcon,
  onError,
}: SafeImgProps) {
  return (
    <SafeImage
      src={src}
      alt={alt}
      width={160}
      height={80}
      className={className}
      fallbackClassName={fallbackClassName}
      fallbackIcon={fallbackIcon}
      sizes="160px"
      onError={onError}
    />
  );
}
