// Rarités officielles CS2 avec leurs couleurs hex
export const CS2_RARITIES = {
  'Consumer Grade': { color: '#b0c3d9', label: 'Consumer Grade', apiValues: ['Consumer', 'Consumer Grade'] },
  'Industrial Grade': { color: '#5e98d9', label: 'Industrial Grade', apiValues: ['Industrial Grade'] },
  'Mil-Spec Grade': { color: '#4b69ff', label: 'Mil-Spec Grade', apiValues: ['Mil-Spec Grade', 'Mil-Spec', 'Distinguished', 'Distinguished Agent'] },
  'Restricted': { color: '#8847ff', label: 'Restricted', apiValues: ['Restricted', 'Exceptional', 'Exceptional Agent'] },
  'Classified': { color: '#d32ce6', label: 'Classified', apiValues: ['Classified', 'Superior', 'Superior Agent'] },
  'Covert': { color: '#eb4b4b', label: 'Covert', apiValues: ['Covert', 'Master', 'Master Agent'] },
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
  const needle = apiRarity.trim().toLowerCase();
  for (const [key, value] of Object.entries(CS2_RARITIES)) {
    if ((value.apiValues as readonly string[]).some((candidate) => candidate.toLowerCase() === needle)) {
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

/** Sport Gloves, Specialist Gloves, Hand Wraps, etc. Knives stay on their own rarity color. */
export function isCs2GloveItem(marketName: string | null | undefined): boolean {
  if (!marketName) return false;
  const type = extractCs2WeaponType(marketName);
  const source = type || marketName;
  return /\bgloves\b/i.test(source) || /\bhand wraps\b/i.test(source);
}

/**
 * Badge color for an inventory item.
 * Gloves are labeled Extraordinary by Skinplace, but CS2 paints them Covert red, not gold.
 */
export function getDisplayedRarityColor(rarity: string, marketName?: string | null): string {
  if (isCs2GloveItem(marketName)) {
    return CS2_RARITIES.Covert.color;
  }
  return getRarityHexColor(rarity);
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

/** Strip exterior suffix e.g. "(Field-Tested)" from a CS2 market name. */
function stripExteriorSuffix(marketName: string): string {
  return marketName.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

/** Extract weapon type from market_name e.g. "AK-47 | Redline" → "AK-47". */
export function extractCs2WeaponType(marketName: string): string {
  const base = stripExteriorSuffix(marketName);
  const pipeIdx = base.indexOf('|');
  if (pipeIdx === -1) return '';
  return base
    .slice(0, pipeIdx)
    .replace(/^★\s*/, '')
    .replace(/^StatTrak™\s*/i, '')
    .replace(/^Souvenir\s*/i, '')
    .trim();
}

/** Extract skin name from market_name e.g. "AK-47 | Redline (FT)" → "Redline". */
export function extractCs2SkinName(marketName: string): string {
  const base = stripExteriorSuffix(marketName);
  const pipeIdx = base.indexOf('|');
  if (pipeIdx !== -1) {
    return base.slice(pipeIdx + 1).trim();
  }
  return base;
}

/** Extract exterior from market_name e.g. "AK-47 | Redline (Field-Tested)" → "Field-Tested". */
export function extractCs2Exterior(marketName: string): CS2Exterior | null {
  const match = marketName.match(/\(([^)]+)\)\s*$/);
  if (!match) return null;
  const inner = match[1]?.trim() ?? '';
  if (inner in CS2_EXTERIORS) return inner as CS2Exterior;
  const byShort = (Object.entries(CS2_EXTERIORS) as [CS2Exterior, { short: string }][]).find(
    ([, value]) => value.short.toLowerCase() === inner.toLowerCase()
  );
  return byShort?.[0] ?? null;
}

/** Append Doppler/Gamma Doppler phase when provided by Skinplace (e.g. "Doppler" + "Ruby" → "Doppler Ruby"). */
export function formatCs2SkinDisplayName(
  skinName: string,
  phase: string | null | undefined,
): string {
  const trimmedPhase = phase?.trim();
  if (!trimmedPhase) return skinName;
  if (skinName.includes(trimmedPhase)) return skinName;
  if (!/\bDoppler\b/i.test(skinName)) return skinName;
  return `${skinName} ${trimmedPhase}`;
}

/** Extract skin display name from market_name, including Doppler phase when available. */
export function extractCs2SkinDisplayName(
  marketName: string,
  phase?: string | null,
): string {
  return formatCs2SkinDisplayName(extractCs2SkinName(marketName), phase);
}
