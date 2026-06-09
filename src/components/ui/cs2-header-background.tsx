"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { normalizeStoredTheme } from "@/lib/themes";

interface CS2HeaderBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  overlay?: boolean;
  overlayOpacity?: number;
}

export const CS2HeaderBackground: React.FC<CS2HeaderBackgroundProps> = ({
  className = "",
  children,
  overlay = true,
  overlayOpacity = 0.7,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { resolvedTheme } = useTheme();
  const currentTheme = normalizeStoredTheme(resolvedTheme);
  const showOrange = currentTheme === "cs2" || currentTheme === "light";

  const backgroundUrl = "/images/cs2/backgrounds/artworksite.webp";

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageLoaded(true);
      setImageError(false);
    };
    img.onerror = () => {
      setImageError(true);
      setImageLoaded(false);
    };
    img.src = backgroundUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [backgroundUrl]);

  return (
    <div className={cn("relative overflow-hidden grid", className)}>
      {/* Fond + overlay : même cellule grille que le contenu pour couvrir toute la section */}
      <div className="col-start-1 row-start-1 relative min-h-full w-full" aria-hidden>
        <div
          role="img"
          aria-label="CS2 Artwork Background"
          className={cn(
            "cs2-hero-background__artwork absolute inset-0 w-full bg-no-repeat transition-opacity duration-700",
            imageLoaded && !imageError ? "opacity-100" : "opacity-0"
          )}
          style={{ backgroundImage: `url("${backgroundUrl}")` }}
        />

        {overlay && (
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70"
            style={{ opacity: overlayOpacity }}
          />
        )}

        {showOrange && (
          <>
            <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-theme-accent/15 via-transparent to-background" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-theme-accent/20 to-transparent opacity-60" />
          </>
        )}
      </div>

      {children && (
        <div className="col-start-1 row-start-1 relative z-10">{children}</div>
      )}
    </div>
  );
};

export const CS2HeroBackground: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className = "", children }) => {
  return (
    <CS2HeaderBackground
      className={cn("min-h-screen", className)}
      overlay={true}
      overlayOpacity={0.75}
    >
      {children}
    </CS2HeaderBackground>
  );
};

export const usePreloadCS2Backgrounds = () => {
  useEffect(() => {
    const img = new Image();
    img.src = "/images/cs2/backgrounds/artworksite.webp";
  }, []);
};

export default CS2HeaderBackground;
