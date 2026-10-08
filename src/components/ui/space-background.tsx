"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { normalizeStoredTheme } from "@/lib/themes";

/**
 * Fond spatial chrome/lunaire, étoiles, nébuleuse diffuse.
 */
export function SpaceBackground() {
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  const current = normalizeStoredTheme(resolvedTheme ?? theme);
  if (current !== "moonskin") return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      {/* Nébuleuse */}
      <div className="absolute inset-0 lunar-nebula" />

      {/* Champ d'étoiles */}
      <div className="absolute inset-0 lunar-stars" />

      {/* Astéroïdes décoratifs */}
      <div className="lunar-asteroid lunar-asteroid-tl" />
      <div className="lunar-asteroid lunar-asteroid-br" />
    </div>
  );
}
