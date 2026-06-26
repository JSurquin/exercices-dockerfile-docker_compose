"use client";

import { useState } from "react";
import Image from "next/image";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

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
  unoptimized = false,
  priority = false,
  onError,
}: SafeImageProps) {
  const [error, setError] = useState(false);

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
      width={width || 100}
      height={height || 100}
      className={className}
      unoptimized={unoptimized}
      priority={priority}
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
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted/50 text-muted-foreground",
          fallbackClassName,
          className
        )}
      >
        {fallbackIcon || <PhotoIcon className="w-1/2 h-1/2 opacity-50" />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => {
        setError(true);
        onError?.();
      }}
    />
  );
}
