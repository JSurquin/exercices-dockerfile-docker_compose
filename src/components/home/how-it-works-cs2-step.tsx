import type { ComponentType, CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { getRarityHexColor, type CS2Rarity } from "@/lib/cs2-constants";
import { WeaponGradeIndicator } from "@/components/ui/cs2-icons";
import { LockClosedIcon } from "@heroicons/react/24/solid";

const STEP_RARITIES: CS2Rarity[] = [
  "Consumer Grade",
  "Industrial Grade",
  "Mil-Spec Grade",
  "Restricted",
  "Covert",
];

const RARITY_SHORT: Record<CS2Rarity, string> = {
  "Consumer Grade": "Consumer",
  "Industrial Grade": "Industrial",
  "Mil-Spec Grade": "Mil-Spec",
  Restricted: "Restricted",
  Classified: "Classified",
  Covert: "Covert",
  "Exceedingly Rare": "★ Rare",
};

export type HowItWorksCs2StepProps = {
  step: number;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  details: string[];
  locked?: boolean;
  lockedLabel?: string;
  className?: string;
};

export function HowItWorksCs2Step({
  step,
  icon: Icon,
  title,
  description,
  details,
  locked = false,
  lockedLabel = "7D Hold",
  className,
}: HowItWorksCs2StepProps) {
  const rarity = STEP_RARITIES[step - 1] ?? "Consumer Grade";
  const rarityColor = getRarityHexColor(rarity);

  return (
    <article
      className={cn(
        "hiw-cs2-step group relative flex h-full w-full min-w-0 flex-col overflow-hidden rounded-lg border-2 bg-[#14141a] shadow-[0_8px_32px_rgba(0,0,0,0.55)] transition-all duration-300 hover:-translate-y-1",
        locked && "hiw-cs2-step--locked",
        className,
      )}
      style={
        {
          borderColor: `${rarityColor}99`,
          "--hiw-rarity": rarityColor,
        } as CSSProperties
      }
    >
      <div style={{ backgroundColor: rarityColor }} />

      <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
        <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-white/35">
          Phase {String(step).padStart(2, "0")}/05
        </span>
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
          style={{ backgroundColor: rarityColor }}
        >
          {RARITY_SHORT[rarity]}
        </span>
      </div>

      <div
        className={cn(
          "relative mx-3 mt-2 flex aspect-[5/4] items-center justify-center overflow-hidden rounded-md bg-[#0a0a0f] ring-1 ring-white/10 cs2-grid-bg",
          locked && "opacity-90",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(circle at 50% 80%, ${rarityColor}44 0%, transparent 65%)`,
          }}
        />
        <Icon
          className={cn(
            "relative z-[1] h-11 w-11 text-white/75 transition-transform duration-300 group-hover:scale-105",
            locked && "text-white/45",
          )}
          aria-hidden
        />
        <WeaponGradeIndicator
          grade={rarity}
          className="absolute right-2 top-2 z-[2] h-2.5 w-2.5 ring-2 ring-[#14141a]"
        />
        {locked && (
          <div className="absolute inset-0 z-[3] flex flex-col items-center justify-center gap-1 bg-black/45 backdrop-blur-[1px]">
            <LockClosedIcon className="h-6 w-6 text-white/80" aria-hidden />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/70">
              {lockedLabel}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-3 py-3">
        <h3 className="text-sm font-semibold leading-snug text-white">{title}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-white/55">{description}</p>

        <div className="mt-auto flex flex-wrap gap-1 pt-3">
          {details.map((detail) => (
            <span
              key={detail}
              className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] leading-tight text-white/50"
            >
              {detail}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export function HowItWorksTradeArrow({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "hiw-cs2-arrow flex shrink-0 items-center justify-center text-white/25",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h12m0 0-4-4m4 4-4 4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 6v12" opacity={0.35} />
      </svg>
    </div>
  );
}
