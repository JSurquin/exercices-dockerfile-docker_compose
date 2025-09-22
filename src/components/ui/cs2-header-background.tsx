import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { headerBackgrounds, generateCS2Fallback } from "@/lib/cs2-images";

interface CS2HeaderBackgroundProps {
  variant?: keyof typeof headerBackgrounds;
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

  const background = headerBackgrounds[variant];
  const fallbackSrc = generateCS2Fallback();

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
          className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-orange-900/40"
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Effet de particules CS2 */}
      {animated && (
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
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-60" />

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
    useState<keyof typeof headerBackgrounds>("cs2_main");

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
      overlayOpacity={0.6}
      animated={true}
    >
      {/* Pattern overlay pour plus de texture */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ff6b35' fill-opacity='0.4'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

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
  useEffect(() => {
    Object.values(headerBackgrounds).forEach((background) => {
      if (background.url) {
        const img = new Image();
        img.src = background.url;
      }
    });
  }, []);
};

export default CS2HeaderBackground;
