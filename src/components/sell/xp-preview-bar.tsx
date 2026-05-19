"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { useLocale } from "@/components/providers/locale-provider";

/**
 * XP formula mirrors the server-side logic in trade-hooks.ts:
 *   level = floor(sqrt(xp / 100)) + 1
 * XP thresholds:
 *   level L starts at xp = 100 * (L-1)^2
 *   level L ends at  xp = 100 * L^2  (= start of L+1)
 */
export function xpForLevel(level: number): number {
  return 100 * Math.pow(level - 1, 2);
}

export function xpForNextLevel(level: number): number {
  return 100 * Math.pow(level, 2);
}

export function levelFromXP(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/**
 * Estimate XP gain from a list of skin values (in cents).
 * Server formula: points = floor((grossCents / 100) * pointsPerEuro)
 * Default pointsPerEuro = 100 → points = grossCents
 */
export function estimateXPGain(totalCentimes: number): number {
  return totalCentimes;
}

interface XPPreviewBarProps {
  currentXP: number;
  currentLevel: number;
  xpForNextLevel: number;
  pendingXPGain: number;
}

const LABELS = {
  fr: {
    level: "Niveau",
    xpLabel: "XP",
    gain: (n: number) => `+${n.toLocaleString("fr-FR")} XP`,
    nextLevel: (n: number) => `Niveau ${n}`,
    progress: (cur: number, max: number) =>
      `${cur.toLocaleString("fr-FR")} / ${max.toLocaleString("fr-FR")} XP`,
    pendingLabel: "XP gagné à la vente",
  },
  en: {
    level: "Level",
    xpLabel: "XP",
    gain: (n: number) => `+${n.toLocaleString("en-US")} XP`,
    nextLevel: (n: number) => `Level ${n}`,
    progress: (cur: number, max: number) =>
      `${cur.toLocaleString("en-US")} / ${max.toLocaleString("en-US")} XP`,
    pendingLabel: "XP earned on sale",
  },
} as const;

export function XPPreviewBar({
  currentXP,
  currentLevel,
  xpForNextLevel: xpNext,
  pendingXPGain,
}: XPPreviewBarProps) {
  const { locale } = useLocale();
  const t = LABELS[locale as keyof typeof LABELS] ?? LABELS.en;

  const xpStart = xpForLevel(currentLevel);
  const xpRange = Math.max(xpNext - xpStart, 1);

  const currentProgress = Math.min(
    ((currentXP - xpStart) / xpRange) * 100,
    100
  );

  const projectedXP = currentXP + pendingXPGain;
  const projectedLevel = levelFromXP(projectedXP);

  // Pending gain may push beyond current level — clamp to 100%
  const projectedProgress = Math.min(
    ((projectedXP - xpStart) / xpRange) * 100,
    100
  );

  const pendingBarWidth = Math.max(projectedProgress - currentProgress, 0);
  const hasPending = pendingXPGain > 0;
  const levelUp = projectedLevel > currentLevel;

  return (
    <div className="w-full rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-1.5">
          <SparklesIcon className="w-4 h-4 text-orange-500 shrink-0" />
          <span className="text-sm font-semibold text-foreground">
            {t.level} {currentLevel}
          </span>
          <AnimatePresence>
            {levelUp && (
              <motion.span
                key="levelup"
                initial={{ opacity: 0, scale: 0.7, x: -6 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.7, x: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-500 border border-amber-400/40 ml-1"
              >
                → {t.nextLevel(projectedLevel)}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">
            {t.progress(currentXP, xpNext)}
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
        {/* Current XP fill */}
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full bg-orange-500"
          initial={false}
          animate={{ width: `${currentProgress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />

        {/* Pending XP gain overlay */}
        <AnimatePresence>
          {hasPending && pendingBarWidth > 0 && (
            <motion.div
              key="pending"
              className="absolute top-0 h-full rounded-r-full"
              style={{ left: `${currentProgress}%` }}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: `${pendingBarWidth}%`, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {/* Shimmer effect */}
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
