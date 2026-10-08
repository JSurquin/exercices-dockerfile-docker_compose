import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const HERO_ARTWORK_SRC = "/images/cs2/backgrounds/artworksite.webp";

interface CS2HeaderBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  overlay?: boolean;
  overlayOpacity?: number;
  priority?: boolean;
}

export const CS2HeaderBackground: React.FC<CS2HeaderBackgroundProps> = ({
  className = "",
  children,
  overlay = true,
  overlayOpacity = 0.7,
  priority = false,
}) => {
  return (
    <div className={cn("relative isolate overflow-hidden grid", className)}>
      <div className="pointer-events-none col-start-1 row-start-1 absolute inset-0 z-0" aria-hidden>
        <Image
          src={HERO_ARTWORK_SRC}
          alt=""
          fill
          priority={priority}
          sizes="100vw"
          className="cs2-hero-background__artwork pointer-events-none object-cover md:object-fill"
        />

        {overlay && (
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70"
            style={{ opacity: overlayOpacity }}
          />
        )}

        <div className="cs2-hero-theme-wash absolute inset-0 opacity-5 bg-gradient-to-br from-theme-accent/15 via-transparent to-background" />
        <div className="cs2-hero-theme-wash absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-theme-accent/20 to-transparent opacity-60" />
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
      priority
    >
      {children}
    </CS2HeaderBackground>
  );
};

export const usePreloadCS2Backgrounds = () => {};

export default CS2HeaderBackground;
