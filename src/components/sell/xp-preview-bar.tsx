"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { Store } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { LevelHelpPopover } from "@/components/ui/level-help-popover";
import { LevelBadge } from "@/components/ui/level-badge";
import { LevelProgressBar } from "@/components/ui/level-progress-bar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  getLevelInfo,
  xpFromCents,
  LEVELS,
  TIERS_PER_LEVEL,
  XP_CAP,
  getLevelName,
  type LevelLocale,
} from "@/lib/level-system";
import { formatMessage } from "@/lib/i18n";

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
  bonusRatePercent?: number;
  userTag?: string | null;
  compact?: boolean;
}

export function XPPreviewBar({
  currentXP,
  pendingXPGain,
  bonusRatePercent = 0,
  userTag,
  compact = false,
}: XPPreviewBarProps) {
  const { locale, messages } = useLocale();
  const t = messages.sellPage.xpPreview;
  const lang = locale as LevelLocale;
  const numberLocale = locale === "fr" ? "fr-FR" : locale === "cn" ? "zh-CN" : "en-US";

  const info = getLevelInfo(currentXP);
  const projectedInfo = getLevelInfo(currentXP + pendingXPGain);

  const cosmicName = getLevelName(info.levelIndex, lang);
  const projectedCosmicName = getLevelName(projectedInfo.levelIndex, lang);

  const hasLevelUp = projectedInfo.levelIndex > info.levelIndex;
  const hasPending = pendingXPGain > 0;

  return (
    <div
      className={cn(
        "w-full rounded-xl border border-border bg-card shadow-sm",
        compact ? "px-3 py-2.5 h-[84px] overflow-hidden" : "px-4 py-3",
      )}
    >
      <div className="flex items-start gap-2 h-full">
        <LevelBadge tierIndex={info.tierIndex} size="sm" className="shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div
            className={cn(
              "flex items-center gap-1.5 min-w-0",
              compact ? "mb-1" : "mb-2 flex-wrap justify-between gap-2",
            )}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
              <SparklesIcon className="w-3.5 h-3.5 text-theme-accent shrink-0" />
              <span
                className={cn(
                  compact ? "text-xs" : "text-sm",
                  "font-semibold text-foreground truncate",
                )}
              >
                {cosmicName}
              </span>
              {bonusRatePercent > 0 && userTag && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold leading-none px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 shrink-0">
                  {userTag === "MERCHANT" && <Store className="h-2.5 w-2.5" />}
                  {userTag} +{bonusRatePercent}%
                </span>
              )}
              {!compact && <LevelHelpPopover />}
              <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                {formatMessage(t.tier, {
                  current: info.tierIndex + 1,
                  total: TIERS_PER_LEVEL,
                })}
              </span>

              {hasPending && (
                <>
                  <span className="text-[10px] text-muted-foreground shrink-0" aria-hidden>
                    ·
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-1.5 py-0.5 shrink-0 cursor-default">
                        <SparklesIcon className="w-3 h-3" />
                        {formatMessage(t.gain, {
                          n: pendingXPGain.toLocaleString(numberLocale),
                        })}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">{t.pendingLabel}</TooltipContent>
                  </Tooltip>
                </>
              )}

              {info.saleBonus > 0 && (
                <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-theme-highlight/15 text-theme-highlight border border-theme-highlight/30 shrink-0">
                  {info.saleBonusPct}
                </span>
              )}

              <AnimatePresence>
                {hasLevelUp && (
                  <motion.span
                    key="levelup"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-theme-highlight/20 text-theme-stat border border-theme-highlight/40 shrink-0"
                  >
                    {formatMessage(t.levelUp, { name: projectedCosmicName })}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {!compact && (
              <span className="text-xs text-muted-foreground shrink-0">
                {formatMessage(t.progress, {
                  current: info.cappedXP.toLocaleString(numberLocale),
                  max: info.level.xpEnd.toLocaleString(numberLocale),
                })}
              </span>
            )}
          </div>

          <LevelProgressBar xp={currentXP} pendingXP={pendingXPGain} />
        </div>
      </div>
    </div>
  );
}
