import { cn } from "@/lib/utils";

type SectionFadeTarget = "background" | "muted";

const FADE_TARGET: Record<SectionFadeTarget, string> = {
  background: "var(--background)",
  muted: "var(--home-section-muted)",
};

interface SectionBottomFadeProps {
  to: SectionFadeTarget;
  className?: string;
}

/** Gradient at section bottom blending into the next section background. */
export function SectionBottomFade({ to, className }: SectionBottomFadeProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute bottom-0 left-0 right-0 z-[1]",
        "h-[100px] sm:h-[120px] md:h-[150px]",
        className
      )}
      style={{
        background: `linear-gradient(to bottom, transparent, ${FADE_TARGET[to]})`,
      }}
    />
  );
}
