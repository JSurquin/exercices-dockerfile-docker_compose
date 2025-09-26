import React from "react";

// Collection d'images CS2 authentiques avec URLs réelles
export const CS2ImageURLs = {
  // Arrière-plans CS2 officiels et de haute qualité
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

  // Armes iconiques CS2
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

// Fonction pour générer des images de fallback optimisées
export const generateCS2Fallback = (width = 1920, height = 1080) => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1a1a2e" />
          <stop offset="50%" stop-color="#16213e" />
          <stop offset="100%" stop-color="#FF6B35" />
        </linearGradient>
        
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,107,53,0.1)" stroke-width="1"/>
        </pattern>
      </defs>
      
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <rect width="100%" height="100%" fill="url(#grid)"/>
      
      <g transform="translate(${width / 2}, ${height / 2})" opacity="0.1">
        <circle r="100" fill="none" stroke="#FF6B35" stroke-width="2"/>
        <text y="20" text-anchor="middle" font-family="Arial" font-size="48" font-weight="bold" fill="#FF6B35">CS2</text>
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

// Collection d'images optimisées pour le header
export const headerBackgrounds = {
  dust2: {
    url: CS2ImageURLs.backgrounds.dust2,
    fallback: "dust2",
    name: "Dust2",
  },
  mirage: {
    url: CS2ImageURLs.backgrounds.mirage,
    fallback: "mirage",
    name: "Mirage",
  },
  inferno: {
    url: CS2ImageURLs.backgrounds.inferno,
    fallback: "inferno",
    name: "Inferno",
  },
  community: {
    url: CS2ImageURLs.backgrounds.community_1,
    fallback: "default",
    name: "Community",
  },
  cs2_main: {
    url: CS2ImageURLs.backgrounds.steam_bg_1,
    fallback: "default",
    name: "CS2 Main",
  },
} as const;

export default CS2ImageURLs;
