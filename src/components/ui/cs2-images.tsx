import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface CS2ImageProps {
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: "weapon" | "map" | "background" | "skin";
  rarity?: string;
  quality?: number;
  priority?: boolean;
}

// Génération de placeholders SVG optimisés
const generatePlaceholder = (type: string, rarity?: string) => {
  const colors = {
    weapon: "#1a1a2e",
    map: "#16213e",
    background: "#0f172a",
    skin: getRarityColor(rarity || "Consumer Grade"),
  };

  const patterns = {
    weapon: `
      <rect width="100%" height="100%" fill="${colors.weapon}"/>
      <path d="M20 30h60v20h-60z" fill="#ff6b35" opacity="0.2"/>
      <circle cx="50" cy="50" r="15" fill="#ff6b35" opacity="0.3"/>
    `,
    map: `
      <rect width="100%" height="100%" fill="${colors.map}"/>
      <path d="M0 50h100v50h-100z" fill="#0ea5e9" opacity="0.2"/>
      <path d="M20 20h60v60h-60z" stroke="#0ea5e9" stroke-width="2" fill="none"/>
    `,
    background: `
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ff6b35" stroke-width="0.5" opacity="0.1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="${colors.background}"/>
      <rect width="100%" height="100%" fill="url(#grid)"/>
    `,
    skin: `
      <rect width="100%" height="100%" fill="${colors.skin}"/>
      <path d="M10 10h80v80h-80z" fill="#000" opacity="0.2"/>
      <text x="50" y="55" text-anchor="middle" fill="#fff" font-size="12" font-family="Arial">CS2</text>
    `,
  };

  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      ${patterns[type as keyof typeof patterns]}
    </svg>
  `)}`;
};

function getRarityColor(rarity: string): string {
  const colors = {
    "Consumer Grade": "#b0c3d9",
    "Industrial Grade": "#5e98d9",
    "Mil-Spec": "#4b69ff",
    Restricted: "#8847ff",
    Classified: "#d32ce6",
    Covert: "#eb4b4b",
    Extraordinary: "#ffd700",
  };
  return colors[rarity as keyof typeof colors] || colors["Consumer Grade"];
}

export const CS2Image: React.FC<CS2ImageProps> = ({
  src,
  alt,
  width = 300,
  height = 200,
  className,
  placeholder = "weapon",
  rarity,
  priority = false,
}) => {
  const placeholderSrc = generatePlaceholder(placeholder, rarity);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={src || placeholderSrc}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className="object-cover w-full h-full"
        placeholder="blur"
        blurDataURL={placeholderSrc}
      />

      {rarity && (
        <div
          className="absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-white shadow-lg"
          style={{ backgroundColor: getRarityColor(rarity) }}
        />
      )}
    </div>
  );
};

// Collection d'images CS2 authentiques avec fallbacks
export const CS2Images = {
  // Armes populaires (fallback vers placeholders)
  weapons: {
    ak47_redline: "/images/cs2/weapons/ak47-redline.jpg",
    awp_dragon_lore: "/images/cs2/weapons/awp-dragon-lore.jpg",
    m4a4_howl: "/images/cs2/weapons/m4a4-howl.jpg",
    karambit_fade: "/images/cs2/weapons/karambit-fade.jpg",
    ak47_fire_serpent: "/images/cs2/weapons/ak47-fire-serpent.jpg",
    awp_asiimov: "/images/cs2/weapons/awp-asiimov.jpg",
  },

  // Cartes emblématiques
  maps: {
    dust2: "/images/cs2/maps/dust2.jpg",
    mirage: "/images/cs2/maps/mirage.jpg",
    inferno: "/images/cs2/maps/inferno.jpg",
    cache: "/images/cs2/maps/cache.jpg",
    nuke: "/images/cs2/maps/nuke.jpg",
    vertigo: "/images/cs2/maps/vertigo.jpg",
  },

  // Arrière-plans thématiques
  backgrounds: {
    cs2_main: "/images/cs2/backgrounds/cs2-main-bg.jpg",
    trading_bg: "/images/cs2/backgrounds/trading-bg.jpg",
    inventory_bg: "/images/cs2/backgrounds/inventory-bg.jpg",
    market_bg: "/images/cs2/backgrounds/market-bg.jpg",
  },

  // Éléments UI CS2
  ui: {
    steam_logo: "/images/cs2/ui/steam-logo.png",
    cs2_logo: "/images/cs2/ui/cs2-logo.png",
    trade_icon: "/images/cs2/ui/trade-icon.png",
    inventory_icon: "/images/cs2/ui/inventory-icon.png",
  },
};

// Composant spécialisé pour les armes
export const CS2WeaponImage: React.FC<{
  weapon: string;
  skin?: string;
  rarity?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}> = ({ weapon, skin, rarity = "Consumer Grade", className, size = "md" }) => {
  const sizes = {
    sm: { width: 120, height: 80 },
    md: { width: 200, height: 130 },
    lg: { width: 300, height: 200 },
  };

  const weaponKey = `${weapon.toLowerCase().replace(/\s+/g, "_")}_${skin
    ?.toLowerCase()
    .replace(/\s+/g, "_")}`;
  const imageSrc =
    CS2Images.weapons[weaponKey as keyof typeof CS2Images.weapons];

  return (
    <CS2Image
      src={imageSrc}
      alt={`${weapon} ${skin ? `| ${skin}` : ""}`}
      width={sizes[size].width}
      height={sizes[size].height}
      className={cn("rounded-lg border shadow-lg", className)}
      placeholder="skin"
      rarity={rarity}
    />
  );
};

// Composant pour les arrière-plans de sections
export const CS2BackgroundImage: React.FC<{
  variant: keyof typeof CS2Images.backgrounds;
  className?: string;
  children?: React.ReactNode;
  overlay?: boolean;
}> = ({ variant, className, children, overlay = true }) => {
  return (
    <div className={cn("relative", className)}>
      <CS2Image
        src={CS2Images.backgrounds[variant]}
        alt={`CS2 ${variant} background`}
        width={1920}
        height={1080}
        className="absolute inset-0 object-cover w-full h-full"
        placeholder="background"
        priority={variant === "cs2_main"}
      />

      {overlay && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
      )}

      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
};

// Hook pour précharger les images critiques
export const usePreloadCS2Images = () => {
  React.useEffect(() => {
    // Précharger les images les plus importantes
    const criticalImages = [
      CS2Images.backgrounds.cs2_main,
      CS2Images.weapons.ak47_redline,
      CS2Images.weapons.awp_dragon_lore,
      CS2Images.ui.cs2_logo,
    ];

    criticalImages.forEach((src) => {
      if (src) {
        const img = new window.Image();
        img.src = src;
      }
    });
  }, []);
};
