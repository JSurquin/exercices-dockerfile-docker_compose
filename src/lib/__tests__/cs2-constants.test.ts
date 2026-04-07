import {
  CS2_RARITIES,
  CS2_EXTERIORS,
  normalizeRarity,
  getRarityHexColor,
  RARITY_ORDER,
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
