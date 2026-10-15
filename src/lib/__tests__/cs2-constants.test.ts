import {
  CS2_RARITIES,
  CS2_EXTERIORS,
  normalizeRarity,
  getRarityHexColor,
  RARITY_ORDER,
  extractCs2WeaponType,
  extractCs2SkinName,
  extractCs2Exterior,
  formatCs2SkinDisplayName,
  extractCs2SkinDisplayName,
} from '../cs2-constants';

describe('CS2_RARITIES — structure', () => {
  it('contient les 7 raretés officielles', () => {
    const keys = Object.keys(CS2_RARITIES);
    expect(keys).toContain('Consumer Grade');
    expect(keys).toContain('Industrial Grade');
    expect(keys).toContain('Mil-Spec Grade');
    expect(keys).toContain('Restricted');
    expect(keys).toContain('Classified');
    expect(keys).toContain('Covert');
    expect(keys).toContain('Exceedingly Rare');
    expect(keys).toHaveLength(7);
  });

  it('chaque rareté a une couleur hex valide', () => {
    for (const [, value] of Object.entries(CS2_RARITIES)) {
      expect(value.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('les couleurs correspondent aux valeurs officielles CS2', () => {
    expect(CS2_RARITIES['Consumer Grade'].color).toBe('#b0c3d9');
    expect(CS2_RARITIES['Industrial Grade'].color).toBe('#5e98d9');
    expect(CS2_RARITIES['Mil-Spec Grade'].color).toBe('#4b69ff');
    expect(CS2_RARITIES['Restricted'].color).toBe('#8847ff');
    expect(CS2_RARITIES['Classified'].color).toBe('#d32ce6');
    expect(CS2_RARITIES['Covert'].color).toBe('#eb4b4b');
    expect(CS2_RARITIES['Exceedingly Rare'].color).toBe('#ffd700');
  });
});

describe('CS2_EXTERIORS — structure', () => {
  it('contient les 5 exterieurs officiels', () => {
    const keys = Object.keys(CS2_EXTERIORS);
    expect(keys).toContain('Factory New');
    expect(keys).toContain('Minimal Wear');
    expect(keys).toContain('Field-Tested');
    expect(keys).toContain('Well-Worn');
    expect(keys).toContain('Battle-Scarred');
    expect(keys).toHaveLength(5);
  });

  it('les abréviations correspondent', () => {
    expect(CS2_EXTERIORS['Factory New'].short).toBe('FN');
    expect(CS2_EXTERIORS['Minimal Wear'].short).toBe('MW');
    expect(CS2_EXTERIORS['Field-Tested'].short).toBe('FT');
    expect(CS2_EXTERIORS['Well-Worn'].short).toBe('WW');
    expect(CS2_EXTERIORS['Battle-Scarred'].short).toBe('BS');
  });
});

describe('normalizeRarity()', () => {
  it('retourne la valeur canonique si déjà correcte', () => {
    expect(normalizeRarity('Consumer Grade')).toBe('Consumer Grade');
    expect(normalizeRarity('Covert')).toBe('Covert');
    expect(normalizeRarity('Mil-Spec Grade')).toBe('Mil-Spec Grade');
  });

  it('normalise la valeur courte de l\'API Skinplace (Consumer → Consumer Grade)', () => {
    expect(normalizeRarity('Consumer')).toBe('Consumer Grade');
  });

  it('normalise Mil-Spec (sans Grade) → Mil-Spec Grade', () => {
    expect(normalizeRarity('Mil-Spec')).toBe('Mil-Spec Grade');
  });

  it('normalise les anciennes valeurs Extraordinary/Contraband → Exceedingly Rare', () => {
    expect(normalizeRarity('Extraordinary')).toBe('Exceedingly Rare');
    expect(normalizeRarity('Contraband')).toBe('Exceedingly Rare');
    expect(normalizeRarity('Exceedingly Rare')).toBe('Exceedingly Rare');
  });

  it('retourne Consumer Grade pour une valeur inconnue (fallback)', () => {
    expect(normalizeRarity('SomeRandomValue')).toBe('Consumer Grade');
    expect(normalizeRarity('')).toBe('Consumer Grade');
  });

  it('mappe les raretés d\'agents CS2 sur les grades armes équivalents', () => {
    expect(normalizeRarity('Distinguished')).toBe('Mil-Spec Grade');
    expect(normalizeRarity('Exceptional')).toBe('Restricted');
    expect(normalizeRarity('Superior')).toBe('Classified');
    expect(normalizeRarity('Master')).toBe('Covert');
    expect(normalizeRarity('superior')).toBe('Classified');
    expect(normalizeRarity('Distinguished Agent')).toBe('Mil-Spec Grade');
  });
});

describe('getRarityHexColor()', () => {
  it('retourne la couleur correcte pour les valeurs canoniques', () => {
    expect(getRarityHexColor('Covert')).toBe('#eb4b4b');
    expect(getRarityHexColor('Classified')).toBe('#d32ce6');
    expect(getRarityHexColor('Consumer Grade')).toBe('#b0c3d9');
  });

  it('retourne la couleur correcte pour les valeurs courtes de l\'API', () => {
    expect(getRarityHexColor('Consumer')).toBe('#b0c3d9');
    expect(getRarityHexColor('Mil-Spec')).toBe('#4b69ff');
    expect(getRarityHexColor('Extraordinary')).toBe('#ffd700');
  });

  it('retourne la couleur Consumer Grade pour valeur inconnue', () => {
    expect(getRarityHexColor('inconnu')).toBe('#b0c3d9');
  });

  it('colore les raretés d\'agents (Distinguished bleu, Superior rose)', () => {
    expect(getRarityHexColor('Distinguished')).toBe('#4b69ff');
    expect(getRarityHexColor('Exceptional')).toBe('#8847ff');
    expect(getRarityHexColor('Superior')).toBe('#d32ce6');
    expect(getRarityHexColor('Master')).toBe('#eb4b4b');
  });
});

describe('RARITY_ORDER', () => {
  it('contient les 7 raretés', () => {
    expect(Object.keys(RARITY_ORDER)).toHaveLength(7);
  });

  it('Consumer Grade est moins rare que Covert', () => {
    expect(RARITY_ORDER['Consumer Grade']).toBeLessThan(RARITY_ORDER['Covert']);
  });

  it('ordre croissant du plus commun au plus rare', () => {
    expect(RARITY_ORDER['Consumer Grade']).toBe(1);
    expect(RARITY_ORDER['Industrial Grade']).toBe(2);
    expect(RARITY_ORDER['Mil-Spec Grade']).toBe(3);
    expect(RARITY_ORDER['Restricted']).toBe(4);
    expect(RARITY_ORDER['Classified']).toBe(5);
    expect(RARITY_ORDER['Covert']).toBe(6);
    expect(RARITY_ORDER['Exceedingly Rare']).toBe(7);
  });
});

describe('extractCs2WeaponType() / extractCs2SkinName()', () => {
  it('parse un skin classique avec extérieur', () => {
    const name = 'Desert Eagle | Printstream (Field-Tested)';
    expect(extractCs2WeaponType(name)).toBe('Desert Eagle');
    expect(extractCs2SkinName(name)).toBe('Printstream');
  });

  it('parse gants et couteaux avec préfixe ★', () => {
    const name = '★ Sport Gloves | Hedge Maze (Factory New)';
    expect(extractCs2WeaponType(name)).toBe('Sport Gloves');
    expect(extractCs2SkinName(name)).toBe('Hedge Maze');
  });

  it('parse StatTrak™', () => {
    const name = 'StatTrak™ AK-47 | Redline (Minimal Wear)';
    expect(extractCs2WeaponType(name)).toBe('AK-47');
    expect(extractCs2SkinName(name)).toBe('Redline');
  });
});

describe('extractCs2Exterior()', () => {
  it('extrait l’extérieur canonique', () => {
    expect(extractCs2Exterior('AK-47 | Redline (Field-Tested)')).toBe('Field-Tested');
    expect(extractCs2Exterior('★ Karambit | Fade (Factory New)')).toBe('Factory New');
  });

  it('accepte l’abréviation officielle', () => {
    expect(extractCs2Exterior('AWP | Asiimov (FT)')).toBe('Field-Tested');
  });

  it('retourne null sans extérieur', () => {
    expect(extractCs2Exterior('50€ cash')).toBeNull();
  });
});

describe('formatCs2SkinDisplayName() / extractCs2SkinDisplayName()', () => {
  it('ajoute la phase pour un Doppler classique', () => {
    expect(formatCs2SkinDisplayName('Doppler', 'Phase 2')).toBe('Doppler Phase 2');
    expect(formatCs2SkinDisplayName('Doppler', 'Ruby')).toBe('Doppler Ruby');
    expect(formatCs2SkinDisplayName('Doppler', 'Black Pearl')).toBe('Doppler Black Pearl');
    expect(formatCs2SkinDisplayName('Doppler', 'Sapphire')).toBe('Doppler Sapphire');
  });

  it('ajoute la phase pour un Gamma Doppler', () => {
    expect(formatCs2SkinDisplayName('Gamma Doppler', 'Phase 3')).toBe('Gamma Doppler Phase 3');
    expect(formatCs2SkinDisplayName('Gamma Doppler', 'Emerald')).toBe('Gamma Doppler Emerald');
  });

  it('ignore la phase pour les skins non-Doppler', () => {
    expect(formatCs2SkinDisplayName('Redline', 'Phase 1')).toBe('Redline');
  });

  it('ne duplique pas une phase déjà présente', () => {
    expect(formatCs2SkinDisplayName('Doppler Ruby', 'Ruby')).toBe('Doppler Ruby');
  });

  it('extrait le nom complet depuis le market hash name', () => {
    const name = '★ Navaja Knife | Doppler (Factory New)';
    expect(extractCs2SkinDisplayName(name, 'Phase 4')).toBe('Doppler Phase 4');
    expect(extractCs2SkinDisplayName(name, null)).toBe('Doppler');
    expect(extractCs2SkinDisplayName('AK-47 | Redline (Field-Tested)', null)).toBe('Redline');
  });
});
