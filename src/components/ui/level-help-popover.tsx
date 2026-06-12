"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import {
  LEVELS,
  XP_RATE,
  getTierReward,
  getTierRewardDescription,
  getLevelName,
  TIERS_PER_LEVEL,
  type LevelLocale,
} from "@/lib/level-system";
import { LevelBadge, FragmentBadge } from "@/components/ui/level-badge";
import { useLocale } from "@/components/providers/locale-provider";
import { formatMessage } from "@/lib/i18n";

export function LevelHelpPopover() {
  const { locale, messages } = useLocale();
  const t = messages.levelHelp;
  const lang = locale as LevelLocale;
  const xpPerEuro = (1 / XP_RATE).toFixed(2);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-5 h-5 rounded-full text-muted-foreground hover:text-foreground"
          aria-label={t.title}
        >
          <QuestionMarkCircleIcon className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <h3 className="font-semibold text-sm mb-1">{t.title}</h3>
        <p className="text-xs text-muted-foreground mb-3">
          {formatMessage(t.xpRate, { rate: xpPerEuro })}
        </p>

        <div className="flex items-center justify-center gap-2 mb-3 py-2 rounded-lg bg-muted/40">
          {Array.from({ length: TIERS_PER_LEVEL - 1 }, (_, i) => (
            <LevelBadge key={i} tierIndex={i} size="xs" />
          ))}
          <LevelBadge tierIndex={TIERS_PER_LEVEL - 1} size="xs" />
          <FragmentBadge size="xs" />
        </div>

        <div className="rounded-lg border overflow-hidden mb-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-2 py-1.5 font-medium">{t.colLevel}</th>
                <th className="text-right px-2 py-1.5 font-medium">XP</th>
                <th className="text-right px-2 py-1.5 font-medium">{t.colBonus}</th>
              </tr>
            </thead>
            <tbody>
              {LEVELS.map((l) => {
                const name = getLevelName(l.index, lang);
                const bonusStr = l.saleBonus === 0 ? "-" : `+${(l.saleBonus * 100).toFixed(2).replace(/\.?0+$/, "")}%`;
                const xpStr = `${(l.xpStart / 1000).toFixed(0)}k–${(l.xpEnd / 1000).toFixed(0)}k`;
                const badgeTier = Math.min(l.index, 3);
                return (
                  <tr key={l.index} className="border-t border-border">
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        {l.index > 0 ? (
                          <LevelBadge tierIndex={badgeTier} size="xs" className="h-5 w-5" />
                        ) : (
                          <span className="h-5 w-5 flex items-center justify-center text-muted-foreground">·</span>
                        )}
                        <span className="font-medium">{name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-right text-muted-foreground">{xpStr}</td>
                    <td className="px-2 py-1.5 text-right font-medium text-theme-accent">{bonusStr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-dashed p-2 mb-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            {t.tierRewardsTitle}
          </p>
          <div className="space-y-1.5">
            {Array.from({ length: TIERS_PER_LEVEL }, (_, i) => {
              const reward = getTierReward(TIERS_PER_LEVEL + i);
              const label = getTierRewardDescription(reward, lang);
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <LevelBadge tierIndex={i} size="xs" className="h-5 w-5 shrink-0" />
                  <span className="text-muted-foreground">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-1">{t.tierInfo}</p>
        <p className="text-xs text-muted-foreground">{t.capInfo}</p>
      </PopoverContent>
    </Popover>
  );
}
