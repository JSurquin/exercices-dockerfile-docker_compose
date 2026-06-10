"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LevelBadge } from "@/components/ui/level-badge";
import {
  getLevelInfo,
  getTierReward,
  TIERS_PER_LEVEL,
} from "@/lib/level-system";
import { useLocale } from "@/components/providers/locale-provider";

interface LevelProgressBarProps {
  xp: number;
  pendingXP?: number;
  showTierMarkers?: boolean;
  className?: string;
  barClassName?: string;
}

export function LevelProgressBar({
  xp,
  pendingXP = 0,
  showTierMarkers = true,
  className,
  barClassName,
}: LevelProgressBarProps) {
  const { locale } = useLocale();
  const isFr = locale !== "en";

  const info = getLevelInfo(xp);
  const projectedInfo = getLevelInfo(xp + pendingXP);

  const currentPct = info.levelProgress * 100;
  const projectedPct = Math.min(projectedInfo.levelProgress * 100, 100);
  const hasPending = pendingXP > 0;
  const crossesLevel = projectedInfo.levelIndex > info.levelIndex;

  const pendingPct = crossesLevel
    ? Math.max(100 - currentPct, 0)
    : Math.max(projectedPct - currentPct, 0);

  const tierLabel = (n: number) => (isFr ? `Palier ${n}` : `Tier ${n}`);

  return (
    <div className={cn("relative pt-7", className)}>
      {showTierMarkers && (
        <div className="absolute inset-x-0 top-0 h-7 pointer-events-none">
          {Array.from({ length: TIERS_PER_LEVEL }, (_, i) => {
            const position = ((i + 1) / TIERS_PER_LEVEL) * 100;
            const globalTier = info.levelIndex * TIERS_PER_LEVEL + i;
            const reward = getTierReward(globalTier);
            const rewardText = isFr ? reward.description : reward.descriptionEn;
            const isReached = info.tierIndex > i;
            const isCurrent = info.tierIndex === i;

            return (
              <Tooltip key={globalTier}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "absolute top-0 -translate-x-1/2 rounded-full p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary pointer-events-auto",
                      isCurrent && "scale-110 ring-2 ring-primary/60",
                      isReached && !isCurrent && "opacity-90"
                    )}
                    style={{ left: `${position}%` }}
                    aria-label={`${tierLabel(i + 1)}, ${rewardText}`}
                  >
                    <LevelBadge
                      tierIndex={i}
                      size="xs"
                      className={cn(!isReached && !isCurrent && "opacity-40 grayscale-[30%]")}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px] text-center">
                  <p className="font-semibold">{tierLabel(i + 1)}</p>
                  <p className="text-primary-foreground/80">{rewardText}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      )}

      <div
        className={cn(
          "relative h-3 w-full rounded-full bg-muted overflow-hidden",
          barClassName
        )}
      >
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full bg-primary"
          initial={false}
          animate={{ width: `${currentPct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />

        <AnimatePresence>
          {hasPending && pendingPct > 0 && (
            <motion.div
              key="pending"
              className="absolute top-0 h-full rounded-full"
              style={{ left: `${currentPct}%` }}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: `${pendingPct}%`, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="relative h-full w-full overflow-hidden rounded-full bg-emerald-500/70">
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

        {showTierMarkers &&
          Array.from({ length: TIERS_PER_LEVEL - 1 }, (_, i) => {
            const position = ((i + 1) / TIERS_PER_LEVEL) * 100;
            return (
              <div
                key={i}
                className="absolute top-0 h-full w-px bg-background/60"
                style={{ left: `${position}%` }}
                aria-hidden
              />
            );
          })}
      </div>
    </div>
  );
}
