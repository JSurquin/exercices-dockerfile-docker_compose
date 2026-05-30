"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { normalizeStoredTheme } from "@/lib/themes";

type Props = {
  starCount?: number;
  cometIntervalMs?: number;
};

export function CosmicBackground(_props: Props) {
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  const current = normalizeStoredTheme(resolvedTheme ?? theme);
  if (current !== "moonskin") return null;

  return (
    <div className="cb-root cb-fixed" aria-hidden="true">
      <div className="cb-nebula" />
      <div className="cb-star-layer cb-star-layer--1" />
      <div className="cb-star-layer cb-star-layer--2" />
      <div className="cb-star-layer cb-star-layer--3" />
      <div className="cb-comets" aria-hidden="true">
        <div className="cb-comet-fixed cb-comet-fixed--1" />
        <div className="cb-comet-fixed cb-comet-fixed--2" />
        <div className="cb-comet-fixed cb-comet-fixed--3" />
      </div>
      <div className="cb-debris cb-debris--1" />
      <div className="cb-debris cb-debris--2" />
      <div className="cb-debris cb-debris--3" />
      <div className="cb-vignette" />
    </div>
  );
}
