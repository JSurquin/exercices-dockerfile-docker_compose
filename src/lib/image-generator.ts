// Générateur d'images CS2 optimisées avec des techniques modernes
// Utilise des SVG, gradients et patterns pour créer des visuels CS2 authentiques

export const generateCS2WeaponImage = (
  weapon: string,
  skin: string,
  rarity: string,
  width: number = 400,
  height: number = 250
): string => {
  const rarityColors = {
    "Consumer Grade": ["#b0c3d9", "#8fb1d3"],
    "Industrial Grade": ["#5e98d9", "#4a7ba7"], 
    "Mil-Spec": ["#4b69ff", "#3b52cc"],
    "Restricted": ["#8847ff", "#6936cc"],
    "Classified": ["#d32ce6", "#a623b8"],
    "Covert": ["#eb4b4b", "#cc3333"],
    "Extraordinary": ["#ffd700", "#e6c200"],
  };

  const [primaryColor, secondaryColor] = rarityColors[rarity as keyof typeof rarityColors] || rarityColors["Consumer Grade"];

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rarityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:1" />
        </linearGradient>
        
        <linearGradient id="weaponGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#2a2a2e;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#1a1a2e;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0f0f1e;stop-opacity:1" />
        </linearGradient>

        <pattern id="techPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="none"/>
          <path d="M10 0v20M0 10h20" stroke="${primaryColor}" stroke-width="0.5" opacity="0.3"/>
        </pattern>

        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Background -->
      <rect width="100%" height="100%" fill="url(#weaponGradient)"/>
      <rect width="100%" height="100%" fill="url(#techPattern)" opacity="0.4"/>

      <!-- Rarity border -->
      <rect x="0" y="0" width="100%" height="4" fill="url(#rarityGradient)"/>
      <rect x="0" y="${height-4}" width="100%" height="4" fill="url(#rarityGradient)"/>

      <!-- Weapon silhouette (simplified) -->
      ${generateWeaponSilhouette(weapon, width, height, primaryColor)}

      <!-- Skin pattern overlay -->
      ${generateSkinPattern(skin, width, height)}

      <!-- Text overlay -->
      <g font-family="Arial, sans-serif" fill="#ffffff">
        <text x="20" y="30" font-size="16" font-weight="bold" filter="url(#glow)">
          ${weapon.toUpperCase()}
        </text>
        <text x="20" y="50" font-size="12" fill="${primaryColor}">
          ${skin}
        </text>
        <text x="20" y="${height-20}" font-size="10" fill="#aaaaaa">
          ${rarity}
        </text>
      </g>

      <!-- Quality indicators -->
      <g transform="translate(${width-60}, 20)">
        ${generateQualityStars(5, primaryColor)}
      </g>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const generateWeaponSilhouette = (weapon: string, width: number, height: number, color: string): string => {
  const centerY = height / 2;
  const weaponPaths = {
    "AK-47": `<path d="M50 ${centerY-10} L${width-100} ${centerY-5} L${width-80} ${centerY+5} L60 ${centerY+10} Z" fill="${color}" opacity="0.6"/>`,
    "AWP": `<path d="M30 ${centerY-5} L${width-50} ${centerY-8} L${width-40} ${centerY+8} L40 ${centerY+5} Z" fill="${color}" opacity="0.6"/>`,
    "M4A4": `<path d="M40 ${centerY-8} L${width-90} ${centerY-6} L${width-70} ${centerY+6} L50 ${centerY+8} Z" fill="${color}" opacity="0.6"/>`,
    "Karambit": `<path d="M${width/2-30} ${centerY-15} Q${width/2} ${centerY-25} ${width/2+30} ${centerY-15} Q${width/2+20} ${centerY} ${width/2} ${centerY+10} Q${width/2-20} ${centerY} ${width/2-30} ${centerY-15} Z" fill="${color}" opacity="0.7"/>`,
  };

  return weaponPaths[weapon as keyof typeof weaponPaths] || weaponPaths["AK-47"];
};

const generateSkinPattern = (skin: string, width: number, height: number): string => {
  const patterns = {
    "Redline": `
      <g opacity="0.3">
        ${Array.from({length: 5}, (_, i) => 
          `<line x1="0" y1="${(i+1) * height/6}" x2="${width}" y2="${(i+1) * height/6}" stroke="#ff0000" stroke-width="2"/>`
        ).join('')}
      </g>
    `,
    "Dragon Lore": `
      <g opacity="0.4">
        <path d="M${width*0.6} ${height*0.3} Q${width*0.8} ${height*0.5} ${width*0.7} ${height*0.7}" stroke="#ffd700" stroke-width="3" fill="none"/>
        <circle cx="${width*0.75}" cy="${height*0.4}" r="8" fill="#ffd700" opacity="0.5"/>
      </g>
    `,
    "Howl": `
      <g opacity="0.4">
        <circle cx="${width*0.7}" cy="${height*0.4}" r="20" fill="#ff4500" opacity="0.3"/>
        <path d="M${width*0.65} ${height*0.35} L${width*0.75} ${height*0.45} L${width*0.65} ${height*0.45} Z" fill="#ff0000"/>
      </g>
    `,
    "Fade": `
      <defs>
        <linearGradient id="fadeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#ff00ff;stop-opacity:0.3" />
          <stop offset="50%" style="stop-color:#ffff00;stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:#ff0000;stop-opacity:0.3" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#fadeGradient)"/>
    `,
  };

  return patterns[skin as keyof typeof patterns] || '';
};

const generateQualityStars = (quality: number, color: string): string => {
  return Array.from({length: 5}, (_, i) => 
    `<text x="${i * 10}" y="15" font-size="12" fill="${i < quality ? color : '#333333'}">★</text>`
  ).join('');
};

export const generateCS2BackgroundImage = (
  variant: string,
  width: number = 1920,
  height: number = 1080
): string => {
  const backgrounds = {
    cs2_main: `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="mainBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:#2a2a3e;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0f0f1e;stop-opacity:1" />
          </radialGradient>
          
          <pattern id="hexPattern" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
            <polygon points="30,2 50,15 50,37 30,50 10,37 10,15" fill="none" stroke="#ff6b35" stroke-width="0.5" opacity="0.1"/>
          </pattern>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#mainBg)"/>
        <rect width="100%" height="100%" fill="url(#hexPattern)"/>
        
        <!-- CS2 Logo silhouette -->
        <g transform="translate(${width*0.1}, ${height*0.1})" opacity="0.05">
          <circle cx="50" cy="50" r="40" fill="#ff6b35"/>
          <text x="50" y="58" text-anchor="middle" font-family="Arial" font-size="20" font-weight="bold" fill="#ffffff">CS2</text>
        </g>
        
        <!-- Geometric elements -->
        <g opacity="0.1">
          <line x1="0" y1="${height*0.3}" x2="${width}" y2="${height*0.3}" stroke="#ff6b35" stroke-width="1"/>
          <line x1="${width*0.7}" y1="0" x2="${width*0.7}" y2="${height}" stroke="#ff6b35" stroke-width="1"/>
        </g>
      </svg>
    `,
    
    trading_bg: `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="tradingBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1a2332;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0f141a;stop-opacity:1" />
          </linearGradient>
          
          <pattern id="gridPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00ff88" stroke-width="0.3" opacity="0.2"/>
          </pattern>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#tradingBg)"/>
        <rect width="100%" height="100%" fill="url(#gridPattern)"/>
        
        <!-- Trading icons -->
        <g transform="translate(${width*0.8}, ${height*0.2})" opacity="0.1">
          <circle cx="0" cy="0" r="30" fill="#00ff88"/>
          <text x="0" y="8" text-anchor="middle" font-family="Arial" font-size="24" fill="#ffffff">$</text>
        </g>
      </svg>
    `,
  };

  const bgSvg = backgrounds[variant as keyof typeof backgrounds] || backgrounds.cs2_main;
  return `data:image/svg+xml,${encodeURIComponent(bgSvg)}`;
};

// Fonction helper pour créer des images WebP optimisées
export const createOptimizedImageUrl = (
  imagePath: string,
  width?: number,
  height?: number,
  quality: number = 80
): string => {
  // Si c'est déjà un data URL ou une URL externe, retourner tel quel
  if (imagePath.startsWith('data:') || imagePath.startsWith('http')) {
    return imagePath;
  }

  // Pour les vraies images, on peut ajouter des paramètres d'optimisation
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('q', quality.toString());
  params.set('f', 'webp');

  return `${imagePath}?${params.toString()}`;
};

// Collection d'images générées par défaut
export const defaultCS2Images = {
  weapons: {
    ak47_redline: generateCS2WeaponImage("AK-47", "Redline", "Classified"),
    awp_dragon_lore: generateCS2WeaponImage("AWP", "Dragon Lore", "Covert"),
    m4a4_howl: generateCS2WeaponImage("M4A4", "Howl", "Extraordinary"),
    karambit_fade: generateCS2WeaponImage("Karambit", "Fade", "Extraordinary"),
  },
  
  backgrounds: {
    cs2_main: generateCS2BackgroundImage("cs2_main"),
    trading_bg: generateCS2BackgroundImage("trading_bg"),
  },
};
