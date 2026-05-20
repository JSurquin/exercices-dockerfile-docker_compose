"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { LEVELS, XP_RATE } from "@/lib/level-system";
import { useLocale } from "@/components/providers/locale-provider";

const EMOJI: Record<string, string> = {
  "Poussière": "🌫️",
  "Étoile": "⭐",
  "Constellation": "✨",
  "Nébuleuse": "🌌",
  "Galaxie": "🌀",
  "Univers": "🪐",
};

export function LevelHelpPopover() {
  const { locale } = useLocale();
  const isFr = locale !== "en";

  const title = isFr ? "Système de niveaux" : "Level system";
  const subtitle = isFr
    ? `1 XP = ${(1 / XP_RATE).toFixed(2)} € vendus`
    : `1 XP = ${(1 / XP_RATE).toFixed(2)} € sold`;
  const colLevel = isFr ? "Niveau" : "Level";
  const colXP = "XP";
  const colBonus = isFr ? "Bonus vente" : "Sale bonus";
  const tierInfo = isFr
    ? "Chaque niveau contient 5 paliers — débloquez des récompenses (fragments, skins) à chaque palier."
    : "Each level has 5 tiers — unlock rewards (fragments, skins) at each tier.";
  const capInfo = isFr ? "Cap maximum : 100 000 XP (~64 000 € vendus)" : "Max cap: 100,000 XP (~€64,000 sold)";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-5 h-5 rounded-full text-muted-foreground hover:text-foreground"
          aria-label={title}
        >
          <QuestionMarkCircleIcon className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <h3 className="font-semibold text-sm mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>

        <div className="rounded-lg border overflow-hidden mb-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-2 py-1.5 font-medium">{colLevel}</th>
                <th className="text-right px-2 py-1.5 font-medium">{colXP}</th>
                <th className="text-right px-2 py-1.5 font-medium">{colBonus}</th>
              </tr>
            </thead>
            <tbody>
              {LEVELS.map((l) => {
                const name = locale === "en" ? l.nameEn : l.name;
                const emoji = EMOJI[l.name] ?? "•";
                const bonusStr = l.saleBonus === 0 ? "—" : `+${(l.saleBonus * 100).toFixed(2).replace(/\.?0+$/, "")}%`;
                const xpStr = `${(l.xpStart / 1000).toFixed(0)}k–${(l.xpEnd / 1000).toFixed(0)}k`;
                return (
                  <tr key={l.index} className="border-t border-border">
                    <td className="px-2 py-1.5 flex items-center gap-1">
                      <span>{emoji}</span>
                      <span className="font-medium">{name}</span>
                    </td>
                    <td className="px-2 py-1.5 text-right text-muted-foreground">{xpStr}</td>
                    <td className="px-2 py-1.5 text-right font-medium text-orange-500">{bonusStr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground mb-1">{tierInfo}</p>
        <p className="text-xs text-muted-foreground">{capInfo}</p>
      </PopoverContent>
    </Popover>
  );
}
