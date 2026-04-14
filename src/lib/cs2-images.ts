import React from "react";
import { useTheme } from "next-themes";

// Collection d'images CS2 pour le thème DARK (actuelles)
export const CS2ImageURLs = {
  // Arrière-plans CS2 officiels et de haute qualité (thème sombre)
  backgrounds: {
    // Images de cartes emblématiques CS2
    dust2:
      "https://dmarket.com/blog/best-csgo-wallpapers/tercsgo_hu_d02018a53a81a818.jpg",
    mirage:
      "https://4kwallpapers.com/images/wallpapers/counter-strike-1920x1080-9192.png",
    inferno:
      "https://preview.redd.it/inferno-wallpaper-isnt-the-map-beautiful-v0-ee83avzsv8dc1.jpeg?auto=webp&s=c8b71e000e27b83c7bb95f1da84fcb6e7a699134",
    nuke: "https://prosettings.net/cdn-cgi/image/dpr=1%2Cf=auto%2Cfit=cover%2Ch=675%2Cq=95%2Cw=1200/wp-content/uploads/nuke-in-cs2-18.jpg",

    // Wallpapers CS2 alternatifs
    steam_bg_1:
      "https://4kwallpapers.com/images/walls/thumbs_2t/11129.png",
    community_1: "https://images3.alphacoders.com/132/1320531.jpeg",
    community_2: "https://wallpaperaccess.com/full/5531098.jpg",
    trading_bg: "https://wallpaperaccess.com/full/5531099.jpg",
  },
};

// Collection d'images CS2 pour le thème LIGHT (plus claires, moins contrastées)
export const CS2ImageURLsLight = {
  // Arrière-plans CS2 optimisés pour le thème clair
  backgrounds: {
    // Images de cartes avec des tons plus clairs - tu peux remplacer ces URLs par tes propres images
    dust2: "/images/cs2/backgrounds/light/3.png", 
    mirage: "/images/cs2/backgrounds/light/1.png", 
    inferno: "/images/cs2/backgrounds/light/2.png", 
    nuke: "/images/cs2/backgrounds/light/3.png", 

    // Wallpapers CS2 alternatifs pour le thème clair
    steam_bg_1: "/images/cs2/backgrounds/light/1.png", 
    community_1: "/images/cs2/backgrounds/light/1.png", 
    community_2: "/images/cs2/backgrounds/light/1.png", 
    trading_bg: "/images/cs2/backgrounds/light/1.png", 
  },
};

// Armes iconiques CS2 (identiques pour les deux thèmes)
export const CS2WeaponURLs = {
  weapons: {
    ak47_redline:
      "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEmyUEsJVz3-uX9I-t0VWx_BBvYz-gLYKVdgI3Y13S_gK3xb_s1JC7uZTO1zI97QjKlsn7/512fx384f",
    awp_dragon_lore:
      "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17PLfYQJD_9W7m5a0mvLwOq7c2GxU-vFw2LiUo4323lG2r0RtZj31LIeXcAA3aArTqFK4l-a7g561uJjOzSZh7SB0s3vYzkKwhUpMPbJixavJVrJjcWY/512fx384f",
    m4a4_howl:
      "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJTwT09q5g4yCmfDLP7LWnn8f7pMh0-iZ8Nz20QK3_0Y9Ymz0J4SRJwQ9ZQ7V8gK-xOru1sO9tc7PziQ1vSMi5HvVgVXp1qGwOhcH/512fx384f",
    karambit_fade:
      "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf0ebcZThQ6tCvq4GaqPf_MLvTl2NQ18hwj9bJ8bP321CwrBZuY2GhJtKVIAY6Z1DR_1m3wui6hJW5vJrMyXY27yQi4SzYmx2_iU5NOOFuhqbJVhwdZWwN/512fx384f",
  },
};

// Fonction pour générer des images de fallback optimisées selon le thème
export const generateCS2Fallback = (width = 1920, height = 1080, theme: 'dark' | 'light' = 'dark') => {
  const isDark = theme === 'dark';
  
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${isDark ? '#1a1a2e' : '#f8fafc'}" />
          <stop offset="50%" stop-color="${isDark ? '#16213e' : '#e2e8f0'}" />
          <stop offset="100%" stop-color="${isDark ? '#FF6B35' : '#3b82f6'}" />
        </linearGradient>
        
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="${isDark ? 'rgba(255,107,53,0.1)' : 'rgba(59,130,246,0.1)'}" stroke-width="1"/>
        </pattern>
      </defs>
      
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <rect width="100%" height="100%" fill="url(#grid)"/>
      
      <g transform="translate(${width / 2}, ${height / 2})" opacity="0.1">
        <circle r="100" fill="none" stroke="${isDark ? '#FF6B35' : '#3b82f6'}" stroke-width="2"/>
        <text y="20" text-anchor="middle" font-family="Arial" font-size="48" font-weight="bold" fill="${isDark ? '#FF6B35' : '#3b82f6'}">CS2</text>
      </g>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

// Hook pour vérifier si une image est disponible
export const useImageAvailability = (url: string) => {
  const [isAvailable, setIsAvailable] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (!url) {
      setIsAvailable(false);
      return;
    }

    const img = new Image();
    img.onload = () => setIsAvailable(true);
    img.onerror = () => setIsAvailable(false);
    img.src = url;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [url]);

  return isAvailable;
};

// Hook principal pour obtenir les images selon le thème
export const useThemeAwareImages = () => {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Éviter l'hydration mismatch
  if (!mounted) {
    return {
      backgrounds: CS2ImageURLs.backgrounds,
      weapons: CS2WeaponURLs.weapons,
      isLight: false,
      currentTheme: 'dark' as const,
    };
  }

  const isLight = resolvedTheme === 'light';
  const currentImages = isLight ? CS2ImageURLsLight : CS2ImageURLs;

  return {
    backgrounds: currentImages.backgrounds,
    weapons: CS2WeaponURLs.weapons,
    isLight,
    currentTheme: (resolvedTheme || theme || 'dark') as 'dark' | 'light',
  };
};

// Collection d'images optimisées pour le header (sera dynamique selon le thème)
export const getHeaderBackgrounds = (theme: 'dark' | 'light' = 'dark') => {
  const images = theme === 'light' ? CS2ImageURLsLight : CS2ImageURLs;
  
  return {
    dust2: {
      url: "/images/cs2/backgrounds/artworksite.webp",
      fallback: "dust2",
      name: "Dust2",
    },
    mirage: {
      url: "/images/cs2/backgrounds/artworksite.webp",
      //url: images.backgrounds.mirage,
      fallback: "mirage",
      name: "Mirage",
    },
    inferno: {
      //url: images.backgrounds.inferno,
      url: "/images/cs2/backgrounds/artworksite.webp",
      fallback: "inferno",
      name: "Inferno",
    },
    community: {
      //url: images.backgrounds.community_1,
      url: "/images/cs2/backgrounds/artworksite.webp",
      fallback: "default",
      name: "Community",
    },
    cs2_main: {
      //url: images.backgrounds.steam_bg_1,
      url: "/images/cs2/backgrounds/artworksite.webp",
      fallback: "default",
      name: "CS2 Main",
    },
  } as const;
};

// Rétrocompatibilité - utilise le thème sombre par défaut
export const headerBackgrounds = getHeaderBackgrounds('dark');

export default CS2ImageURLs;
