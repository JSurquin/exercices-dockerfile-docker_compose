"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { useLocale } from "@/components/providers/locale-provider";
import { LevelHelpPopover } from "@/components/ui/level-help-popover";
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
  currentLevel: number;   // kept for API compat, recalculated internally
  xpForNextLevel: number; // kept for API compat, recalculated internally
  pendingXPGain: number;
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
}: XPPreviewBarProps) {
  const { locale } = useLocale();
  const t = LABELS[locale as keyof typeof LABELS] ?? LABELS.en;

  const info = getLevelInfo(currentXP);
  const projectedInfo = getLevelInfo(currentXP + pendingXPGain);

  const cosmicName = locale === "en" ? info.level.nameEn : info.level.name;
  const projectedCosmicName =
    locale === "en" ? projectedInfo.level.nameEn : projectedInfo.level.name;

  const currentPct = info.tierProgress * 100;
  const projectedPct = Math.min(projectedInfo.tierProgress * 100, 100);
  const hasTierUp = projectedInfo.globalTierIndex > info.globalTierIndex;
  const hasLevelUp = projectedInfo.levelIndex > info.levelIndex;

  // When a tier/level boundary is crossed, animate the bar to 100% then restart
  const pendingPct = hasTierUp
    ? Math.max(100 - currentPct, 0)
    : Math.max(projectedPct - currentPct, 0);

  const hasPending = pendingXPGain > 0;

  return (
    <div className="w-full rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <SparklesIcon className="w-4 h-4 text-orange-500 shrink-0" />
          <span className="text-sm font-semibold text-foreground">
            {cosmicName}
          </span>
          <LevelHelpPopover />
          <span className="text-xs text-muted-foreground">
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

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">
            {t.progress(info.cappedXP, info.tierXpEnd)}
          </span>

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

      {/* Progress bar */}
      <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
        {/* Current XP fill within the tier */}
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full bg-orange-500"
          initial={false}
          animate={{ width: `${currentPct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />

        {/* Pending XP gain overlay */}
        <AnimatePresence>
          {hasPending && pendingPct > 0 && (
            <motion.div
              key="pending"
              className="absolute top-0 h-full rounded-r-full"
              style={{ left: `${currentPct}%` }}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: `${pendingPct}%`, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="relative h-full w-full overflow-hidden rounded-r-full bg-emerald-500/70">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    repeatDelay: 0.4,
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pending label */}
      <AnimatePresence>
        {hasPending && (
          <motion.p
            key="pending-label"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 6 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3 }}
            className="text-xs text-emerald-500 font-medium overflow-hidden"
          >
            {t.pendingLabel}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
