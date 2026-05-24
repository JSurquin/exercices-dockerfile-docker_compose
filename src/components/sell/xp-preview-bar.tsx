"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { useLocale } from "@/components/providers/locale-provider";
import { LevelHelpPopover } from "@/components/ui/level-help-popover";
import { LevelBadge } from "@/components/ui/level-badge";
import { LevelProgressBar } from "@/components/ui/level-progress-bar";
import {
  getLevelInfo,
  xpFromCents,
  LEVELS,
  TIERS_PER_LEVEL,
  XP_CAP,
} from "@/lib/level-system";

// ─── Exported helpers (used by sell/page.tsx) ────────────────────────────────

export function estimateXPGain(totalCentimes: number): number {
  return xpFromCents(totalCentimes);
}

export function xpForNextLevel(level: number): number {
  const idx = Math.max(0, Math.min(level - 1, LEVELS.length - 1));
  return LEVELS[idx]?.xpEnd ?? XP_CAP;
}

export function levelFromXP(xp: number): number {
  return getLevelInfo(xp).levelIndex + 1;
}

export function xpForLevel(level: number): number {
  const idx = Math.max(0, Math.min(level - 1, LEVELS.length - 1));
  return LEVELS[idx]?.xpStart ?? 0;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface XPPreviewBarProps {
  currentXP: number;
  currentLevel: number;
  xpForNextLevel: number;
  pendingXPGain: number;
  compact?: boolean;
}

const LABELS = {
  fr: {
    tier: (cur: number, total: number) => `Palier ${cur}/${total}`,
    gain: (n: number) => `+${n.toLocaleString("fr-FR")} XP`,
    levelUp: (name: string) => `→ ${name}`,
    progress: (cur: number, max: number) =>
      `${cur.toLocaleString("fr-FR")} / ${max.toLocaleString("fr-FR")} XP`,
    pendingLabel: "XP gagné à la vente",
    saleBonus: "Bonus vendeur",
  },
  en: {
    tier: (cur: number, total: number) => `Tier ${cur}/${total}`,
    gain: (n: number) => `+${n.toLocaleString("en-US")} XP`,
    levelUp: (name: string) => `→ ${name}`,
    progress: (cur: number, max: number) =>
      `${cur.toLocaleString("en-US")} / ${max.toLocaleString("en-US")} XP`,
    pendingLabel: "XP earned on sale",
    saleBonus: "Seller bonus",
  },
} as const;

export function XPPreviewBar({
  currentXP,
  pendingXPGain,
  compact = false,
}: XPPreviewBarProps) {
  const { locale } = useLocale();
  const t = LABELS[locale as keyof typeof LABELS] ?? LABELS.en;

  const info = getLevelInfo(currentXP);
  const projectedInfo = getLevelInfo(currentXP + pendingXPGain);

  const cosmicName = locale === "en" ? info.level.nameEn : info.level.name;
  const projectedCosmicName =
    locale === "en" ? projectedInfo.level.nameEn : projectedInfo.level.name;

  const hasLevelUp = projectedInfo.levelIndex > info.levelIndex;
  const hasPending = pendingXPGain > 0;

  return (
    <div className={`w-full rounded-xl border border-border bg-card shadow-sm ${compact ? "px-3 py-2.5" : "px-4 py-3"}`}>
      <div className={`flex items-start gap-2 ${compact ? "mb-2" : "mb-3"}`}>
        <LevelBadge tierIndex={info.tierIndex} size="sm" className="shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0">
          <div className={`flex ${compact ? "flex-col items-start gap-1" : "items-center justify-between mb-2 gap-2 flex-wrap"}`}>
            <div className="flex items-center gap-1.5 flex-wrap">
              <SparklesIcon className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className={`${compact ? "text-xs" : "text-sm"} font-semibold text-foreground`}>
                {cosmicName}
              </span>
              {!compact && <LevelHelpPopover />}
              <span className="text-[10px] text-muted-foreground">
                {t.tier(info.tierIndex + 1, TIERS_PER_LEVEL)}
              </span>

              {info.saleBonus > 0 && (
                <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-600 dark:text-amber-400 border border-amber-400/30">
                  {info.saleBonusPct}
                </span>
              )}

              <AnimatePresence>
                {hasLevelUp && (
                  <motion.span
                    key="levelup"
                    initial={{ opacity: 0, scale: 0.7, x: -6 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.7, x: -6 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-500 border border-amber-400/40 ml-1"
                  >
                    {t.levelUp(projectedCosmicName)}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <div className={`flex items-center gap-2 shrink-0 ${compact ? "w-full justify-between" : ""}`}>
              {!compact && (
                <span className="text-xs text-muted-foreground">
                  {t.progress(info.cappedXP, info.level.xpEnd)}
                </span>
              )}

              <AnimatePresence>
                {hasPending && (
                  <motion.span
                    key="gain"
                    initial={{ opacity: 0, y: -6, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.85 }}
                    transition={{ type: "spring", stiffness: 250, damping: 18 }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5"
                  >
                    <SparklesIcon className="w-3 h-3" />
                    {t.gain(pendingXPGain)}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          <LevelProgressBar xp={currentXP} pendingXP={pendingXPGain} />
        </div>
      </div>

      <AnimatePresence>
        {hasPending && (
          <motion.p
            key="pending-label"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 6 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3 }}
            className="text-xs text-emerald-500 font-medium overflow-hidden pl-11"
          >
            {t.pendingLabel}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
