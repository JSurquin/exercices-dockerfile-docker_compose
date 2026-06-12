/**
 * level-system.ts — Source de vérité du système de niveaux MoonSkin
 *
 * Spec:
 *  - 6 niveaux cosmiques, 5 paliers chacun → 30 étapes
 *  - 1 XP = 0,64 € vendus  →  XP = floor(grossCents / 100 * 1.5625)
 *  - XP max cap : 100 000
 *  - Bonus de vente permanent par niveau (appliqué sur le brut du trade)
 *  - Déclenché après le trade hold de 7 jours
 */

export const XP_RATE = 1.5625; // XP par euro (1 XP = 0,64 €)
export const XP_CAP = 100_000;
export const TIERS_PER_LEVEL = 5;

// ─── Définitions des niveaux ──────────────────────────────────────────────────

export interface LevelDef {
  index: number;
  name: string;    // FR
  nameEn: string;  // EN
  nameCn: string;  // CN
  xpStart: number;
  xpEnd: number;
  saleBonus: number; // ex: 0.0075 = +0.75%
}

export const LEVELS: LevelDef[] = [
  { index: 0, name: "Poussière",     nameEn: "Dust",          nameCn: "尘埃", xpStart: 0,      xpEnd: 2_500,   saleBonus: 0.0000 },
  { index: 1, name: "Étoile",        nameEn: "Star",          nameCn: "星星", xpStart: 2_500,  xpEnd: 10_000,  saleBonus: 0.0015 },
  { index: 2, name: "Constellation", nameEn: "Constellation", nameCn: "星座", xpStart: 10_000, xpEnd: 25_000,  saleBonus: 0.0030 },
  { index: 3, name: "Nébuleuse",     nameEn: "Nebula",        nameCn: "星云", xpStart: 25_000, xpEnd: 45_000,  saleBonus: 0.0050 },
  { index: 4, name: "Galaxie",       nameEn: "Galaxy",        nameCn: "星系", xpStart: 45_000, xpEnd: 70_000,  saleBonus: 0.0075 },
  { index: 5, name: "Univers",       nameEn: "Universe",      nameCn: "宇宙", xpStart: 70_000, xpEnd: 100_000, saleBonus: 0.0100 },
];

export const TOTAL_TIERS = LEVELS.length * TIERS_PER_LEVEL; // 30

// ─── Assets visuels (public/levels/) ────────────────────────────────────────

export const LEVEL_ASSETS = {
  fragment: "/levels/FRAGMENTMS.png",
  tiers: [
    "/levels/lvl1.png",
    "/levels/lvl2.png",
    "/levels/lvl3.png",
    "/levels/lvl4.png",
  ] as const,
} as const;

/** Badge de palier (1–5) — paliers 4 et 5 partagent le visuel max (lvl4). */
export function getTierBadgeSrc(tierIndex: number): string {
  const idx = Math.min(Math.max(tierIndex, 0), LEVEL_ASSETS.tiers.length - 1);
  return LEVEL_ASSETS.tiers[idx];
}

// ─── Paliers ──────────────────────────────────────────────────────────────────

/**
 * Retourne les 5 seuils XP absolus des paliers d'un niveau.
 * Ex: Poussière → [500, 1000, 1500, 2000, 2500]
 */
export function getTierThresholds(levelIndex: number): number[] {
  const level = LEVELS[levelIndex];
  if (!level) return [];
  const range = level.xpEnd - level.xpStart;
  const step = range / TIERS_PER_LEVEL;
  return Array.from({ length: TIERS_PER_LEVEL }, (_, i) =>
    Math.round(level.xpStart + step * (i + 1))
  );
}

// ─── Récompenses ─────────────────────────────────────────────────────────────

export type LevelLocale = "fr" | "en" | "cn";

export interface TierReward {
  fragments?: number;
  skinValueEur?: number;
  xpBonusMultiplier?: number;
  description: string;
  descriptionEn: string;
  descriptionCn?: string;
}

export function getTierRewardDescription(
  reward: TierReward,
  locale: LevelLocale = "fr",
): string {
  if (locale === "en") return reward.descriptionEn;
  if (locale === "cn") return reward.descriptionCn ?? reward.descriptionEn;
  return reward.description;
}

export function getTierReward(globalTierIndex: number): TierReward {
  const levelIdx = Math.floor(globalTierIndex / TIERS_PER_LEVEL);
  const tierIdx  = globalTierIndex % TIERS_PER_LEVEL;
  const baseFragments = [50, 150, 300, 600, 1000, 2000][levelIdx] ?? 50;

  if (tierIdx < 2) {
    const n = baseFragments * (tierIdx + 1);
    return { fragments: n, description: `+${n} fragments`, descriptionEn: `+${n} fragments` };
  } else if (tierIdx === 2) {
    const skinValues = [1, 2, 3, 5, 10, 20];
    const n = baseFragments * 2;
    const s = skinValues[levelIdx] ?? 1;
    return { fragments: n, skinValueEur: s, description: `+${n} fragments + skin ~${s}€`, descriptionEn: `+${n} fragments + ~${s}€ skin` };
  } else if (tierIdx === 3) {
    const n = baseFragments * 3;
    return { fragments: n, xpBonusMultiplier: 1.5, description: `+${n} fragments + ×1.5 XP (24h)`, descriptionEn: `+${n} fragments + ×1.5 XP (24h)` };
  } else {
    const skinValues = [1, 2, 5, 10, 20, 0];
    const n = baseFragments * 5;
    const isMax = levelIdx === 5;
    const s = skinValues[levelIdx] ?? 0;
    return {
      fragments: n,
      skinValueEur: isMax ? 0 : s,
      description: isMax ? `+${n} fragments (NIVEAU MAX)` : `+${n} fragments + skin ~${s}€`,
      descriptionEn: isMax ? `+${n} fragments (MAX LEVEL)` : `+${n} fragments + ~${s}€ skin`,
      descriptionCn: isMax ? `+${n} 碎片（最高等级）` : `+${n} 碎片 + 约 ${s}€ 皮肤`,
    };
  }
}

// ─── Fonctions principales ────────────────────────────────────────────────────

/**
 * Calcule le gain XP à partir d'un montant brut en centimes.
 * Formule : floor(grossCents / 100 * 1.5625)
 */
export function xpFromCents(grossCents: number): number {
  return Math.floor((grossCents / 100) * XP_RATE);
}

export interface LevelInfo {
  xp: number;
  cappedXP: number;
  levelIndex: number;
  level: LevelDef;
  globalTierIndex: number;  // 0-29
  tierIndex: number;        // 0-4 dans le niveau
  tierXpStart: number;
  tierXpEnd: number;
  tierProgress: number;     // 0-1
  levelProgress: number;    // 0-1
  saleBonus: number;
  saleBonusPct: string;     // ex: "+0.75%"
  nextTierXP: number;       // XP manquant pour prochain palier
  nextLevelXP: number | null;
  isMaxLevel: boolean;
  reward: TierReward;
}

export function getLevelInfo(xp: number): LevelInfo {
  const cappedXP = Math.min(Math.max(xp, 0), XP_CAP);

  let levelIndex = LEVELS.length - 1;
  for (let i = 0; i < LEVELS.length; i++) {
    if (cappedXP < LEVELS[i].xpEnd) { levelIndex = i; break; }
  }
  const level = LEVELS[levelIndex];

  const thresholds = getTierThresholds(levelIndex);
  let tierIndex = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (cappedXP >= thresholds[i]) tierIndex = i + 1;
  }
  tierIndex = Math.min(tierIndex, TIERS_PER_LEVEL - 1);

  const tierXpStart = tierIndex === 0 ? level.xpStart : thresholds[tierIndex - 1];
  const tierXpEnd   = thresholds[tierIndex];
  const tierRange   = Math.max(tierXpEnd - tierXpStart, 1);
  const tierProgress = Math.min((cappedXP - tierXpStart) / tierRange, 1);
  const levelRange   = Math.max(level.xpEnd - level.xpStart, 1);
  const levelProgress = Math.min((cappedXP - level.xpStart) / levelRange, 1);

  const globalTierIndex = levelIndex * TIERS_PER_LEVEL + tierIndex;
  const isMaxLevel = levelIndex === LEVELS.length - 1 && cappedXP >= XP_CAP;
  const saleBonusPct = level.saleBonus === 0
    ? "0%"
    : `+${(level.saleBonus * 100).toFixed(2).replace(/\.?0+$/, "")}%`;

  return {
    xp,
    cappedXP,
    levelIndex,
    level,
    globalTierIndex,
    tierIndex,
    tierXpStart,
    tierXpEnd,
    tierProgress,
    levelProgress,
    saleBonus: level.saleBonus,
    saleBonusPct,
    nextTierXP: Math.max(tierXpEnd - cappedXP, 0),
    nextLevelXP: isMaxLevel ? null : Math.max(level.xpEnd - cappedXP, 0),
    isMaxLevel,
    reward: getTierReward(globalTierIndex),
  };
}

/** Utilitaire pour comparer le palier avant/après award */
export function globalTierFromXP(xp: number): number {
  return getLevelInfo(xp).globalTierIndex;
}

/** Nom localisé du niveau */
export function getLevelName(levelIndex: number, locale: LevelLocale = "fr"): string {
  const l = LEVELS[levelIndex] ?? LEVELS[0];
  if (locale === "en") return l.nameEn;
  if (locale === "cn") return l.nameCn;
  return l.name;
}
