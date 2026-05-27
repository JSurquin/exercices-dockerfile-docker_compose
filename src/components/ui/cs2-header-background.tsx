"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { getHeaderBackgrounds, generateCS2Fallback, useThemeAwareImages } from "@/lib/cs2-images";
import { normalizeStoredTheme } from "@/lib/themes";

interface CS2HeaderBackgroundProps {
  variant?: 'dust2' | 'mirage' | 'inferno' | 'community' | 'cs2_main';
  className?: string;
  children?: React.ReactNode;
  overlay?: boolean;
  overlayOpacity?: number;
  animated?: boolean;
}

export const CS2HeaderBackground: React.FC<CS2HeaderBackgroundProps> = ({
  variant = "cs2_main",
  className = "",
  children,
  overlay = true,
  overlayOpacity = 0.7,
  animated = true,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { resolvedTheme } = useTheme();
  const currentTheme = normalizeStoredTheme(resolvedTheme);
  const showOrange = currentTheme === "cs2" || currentTheme === "light";
  
  // Image fixe pour tous les thèmes
  const fixedBackgroundUrl = "/images/cs2/backgrounds/artworksite.webp";
  
  // Utiliser le hook pour obtenir les images selon le thème
  // const { currentTheme } = useThemeAwareImages();
  // const headerBackgrounds = getHeaderBackgrounds(currentTheme);
  // const background = headerBackgrounds[variant];
  // const fallbackSrc = generateCS2Fallback(1920, 1080, currentTheme);
  
  const background = { url: fixedBackgroundUrl, name: "CS2 Artwork" };
  const fallbackSrc = fixedBackgroundUrl;

  // Réinitialiser l'état quand le thème change
  // useEffect(() => {
  //   setImageLoaded(false);
  //   setImageError(false);
  // }, [currentTheme]);

  useEffect(() => {
    if (!background.url) {
      setImageError(true);
      return;
    }

    const img = new Image();
    img.onload = () => {
      setImageLoaded(true);
      setImageError(false);
    };
    img.onerror = () => {
      setImageError(true);
      setImageLoaded(false);
    };
    img.src = background.url;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [background.url]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Image de fond */}
      <div className="absolute inset-0">
        {!imageError && background.url ? (
          <img
            src={background.url}
            alt={`CS2 ${background.name} Background`}
            className={cn(
              "w-full h-full object-cover transition-all duration-700",
              imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105",
              animated && "hover:scale-105"
            )}
            loading="eager"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <img
            src={fallbackSrc}
            alt={`CS2 ${background.name} Background Fallback`}
            className="w-full h-full object-cover"
            loading="eager"
          />
        )}
      </div>

      {/* Overlay avec gradient */}
      {overlay && (
        <div
          className={cn(
            "absolute inset-0",
            showOrange
              ? "bg-gradient-to-br from-black/60 via-black/50 to-orange-900/40"
              : "bg-gradient-to-br from-black/60 via-black/50 to-black/40"
          )}
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Effet de particules CS2 */}
      {animated && showOrange && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="cs2-particles">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-orange-500/20 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bordure inférieure avec effet CS2 */}
      {showOrange && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-60" />
      )}

      {/* Contenu */}
      {children && <div className="relative z-10 h-full">{children}</div>}
    </div>
  );
};

// Composant spécialisé pour le hero avec plusieurs images
export const CS2HeroBackground: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className = "", children }) => {
  const [currentBackground, setCurrentBackground] =
    useState<'dust2' | 'mirage' | 'inferno' | 'community' | 'cs2_main'>("cs2_main");
  const { resolvedTheme } = useTheme();
  const currentTheme = normalizeStoredTheme(resolvedTheme);
  const showOrange = currentTheme === "cs2" || currentTheme === "light";

  // Utiliser le hook pour obtenir les images selon le thème
  // const { currentTheme } = useThemeAwareImages();
  // const headerBackgrounds = getHeaderBackgrounds(currentTheme);

  // Image fixe pour tous les thèmes
  const fixedBackgroundUrl = "/images/cs2/backgrounds/artworksite.webp";
  const headerBackgrounds = {
    dust2: { url: fixedBackgroundUrl, name: "CS2 Artwork" },
    mirage: { url: fixedBackgroundUrl, name: "CS2 Artwork" },
    inferno: { url: fixedBackgroundUrl, name: "CS2 Artwork" },
    community: { url: fixedBackgroundUrl, name: "CS2 Artwork" },
    cs2_main: { url: fixedBackgroundUrl, name: "CS2 Artwork" },
  };

  const backgrounds = Object.keys(headerBackgrounds) as Array<
    keyof typeof headerBackgrounds
  >;

  useEffect(() => {
    // Changer de fond toutes les 10 secondes
    const interval = setInterval(() => {
      setCurrentBackground((prev) => {
        const currentIndex = backgrounds.indexOf(prev);
        const nextIndex = (currentIndex + 1) % backgrounds.length;
        return backgrounds[nextIndex];
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [backgrounds]);

  return (
    <CS2HeaderBackground
      variant={currentBackground}
      className={cn("min-h-screen", className)}
      overlay={true}
      overlayOpacity={0.75}
      animated={true}
    >
      {/* Subtle noise texture overlay */}
      {showOrange && (
        <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-orange-500 via-transparent to-red-900" />
      )}

      {/* Indicateur de fond actuel */}
      <div className="absolute top-4 right-4 z-20">
        <div className="flex space-x-2">
          {backgrounds.map((bg) => (
            <button
              key={bg}
              onClick={() => setCurrentBackground(bg)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                currentBackground === bg
                  ? "bg-orange-500 scale-125"
                  : "bg-white/30 hover:bg-white/50"
              )}
              aria-label={`Switch to ${headerBackgrounds[bg].name} background`}
            />
          ))}
        </div>
      </div>

      {children}
    </CS2HeaderBackground>
  );
};

// Hook pour précharger les images de fond
export const usePreloadCS2Backgrounds = () => {
  // const { currentTheme } = useThemeAwareImages();
  
  useEffect(() => {
    // const backgrounds = getHeaderBackgrounds(currentTheme);
    // Object.values(backgrounds).forEach((background) => {
    //   if (background.url) {
    //     const img = new Image();
    //     img.src = background.url;
    //   }
    // });
    
    // Précharger l'image fixe
    const img = new Image();
    img.src = "/images/cs2/backgrounds/artworksite.webp";
  }, []); // [currentTheme]
};

export default CS2HeaderBackground;
