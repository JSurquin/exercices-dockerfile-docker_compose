// Rarités officielles CS2 avec leurs couleurs hex
export const CS2_RARITIES = {
  'Consumer Grade': { color: '#b0c3d9', label: 'Consumer Grade', apiValues: ['Consumer', 'Consumer Grade'] },
  'Industrial Grade': { color: '#5e98d9', label: 'Industrial Grade', apiValues: ['Industrial Grade'] },
  'Mil-Spec Grade': { color: '#4b69ff', label: 'Mil-Spec Grade', apiValues: ['Mil-Spec Grade', 'Mil-Spec'] },
  'Restricted': { color: '#8847ff', label: 'Restricted', apiValues: ['Restricted'] },
  'Classified': { color: '#d32ce6', label: 'Classified', apiValues: ['Classified'] },
  'Covert': { color: '#eb4b4b', label: 'Covert', apiValues: ['Covert'] },
  'Exceedingly Rare': { color: '#ffd700', label: 'Exceedingly Rare ★', apiValues: ['Contraband', 'Extraordinary', 'Exceedingly Rare'] },
} as const;

// Exterieurs officiels CS2 (état d'usure)
export const CS2_EXTERIORS = {
  'Factory New': { short: 'FN', label: 'Factory New' },
  'Minimal Wear': { short: 'MW', label: 'Minimal Wear' },
  'Field-Tested': { short: 'FT', label: 'Field-Tested' },
  'Well-Worn': { short: 'WW', label: 'Well-Worn' },
  'Battle-Scarred': { short: 'BS', label: 'Battle-Scarred' },
} as const;

export type CS2Rarity = keyof typeof CS2_RARITIES;
export type CS2Exterior = keyof typeof CS2_EXTERIORS;

// Fonction utilitaire pour normaliser la rareté venant de l'API
export function normalizeRarity(apiRarity: string): CS2Rarity {
  for (const [key, value] of Object.entries(CS2_RARITIES)) {
    if ((value.apiValues as readonly string[]).includes(apiRarity)) {
      return key as CS2Rarity;
    }
  }
  return 'Consumer Grade';
}

// Fonction pour obtenir la couleur hex d'une rareté
export function getRarityHexColor(rarity: string): string {
  const normalized = normalizeRarity(rarity);
  return CS2_RARITIES[normalized].color;
}

// Ordre de tri des raretés (du plus commun au plus rare)
export const RARITY_ORDER: Record<CS2Rarity, number> = {
  'Consumer Grade': 1,
  'Industrial Grade': 2,
  'Mil-Spec Grade': 3,
  'Restricted': 4,
  'Classified': 5,
  'Covert': 6,
  'Exceedingly Rare': 7,
};
