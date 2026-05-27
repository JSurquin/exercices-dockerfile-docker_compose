"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { normalizeStoredTheme } from "@/lib/themes";

type Props = {
  starCount?: number;
  cometIntervalMs?: number;
};

export function CosmicBackground({ starCount = 160, cometIntervalMs = 4200 }: Props) {
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cometLayerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  const current = normalizeStoredTheme(resolvedTheme ?? theme);
  if (current !== "moonskin") return null;

  return (
    <CosmicCanvas
      canvasRef={canvasRef}
      cometLayerRef={cometLayerRef}
      starCount={starCount}
      cometIntervalMs={cometIntervalMs}
    />
  );
}

function CosmicCanvas({
  canvasRef,
  cometLayerRef,
  starCount,
  cometIntervalMs,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  cometLayerRef: React.RefObject<HTMLDivElement | null>;
  starCount: number;
  cometIntervalMs: number;
}) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    type Star = { x: number; y: number; r: number; a: number; s: number; p: number };
    let stars: Star[] = [];
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      stars = Array.from({ length: starCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: (Math.random() * 1.1 + 0.2) * dpr,
        a: Math.random() * 0.6 + 0.2,
        s: Math.random() * 0.008 + 0.002,
        p: Math.random() * Math.PI * 2,
      }));
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        const tw = 0.55 + Math.sin(t * s.s + s.p) * 0.45;
        ctx.globalAlpha = s.a * tw;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [canvasRef, starCount]);

  useEffect(() => {
    const layer = cometLayerRef.current;
    if (!layer) return;
    let alive = true;

    const spawn = () => {
      if (!alive) return;
      const el = document.createElement("div");
      el.className = "cb-comet";
      const top = Math.random() * 60;
      const left = -10 + Math.random() * 20;
      const dur = 2.2 + Math.random() * 1.8;
      const scale = 0.7 + Math.random() * 0.8;
      el.style.top = top + "%";
      el.style.left = left + "%";
      el.style.setProperty("--cb-dur", dur + "s");
      el.style.setProperty("--cb-scale", String(scale));
      layer.appendChild(el);
      setTimeout(() => el.remove(), dur * 1000 + 200);
    };

    spawn();
    const id = setInterval(() => {
      if (Math.random() > 0.25) spawn();
    }, cometIntervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [cometLayerRef, cometIntervalMs]);

  return (
    <div className="cb-root cb-fixed" aria-hidden="true">
      <style>{css}</style>
      <div className="cb-nebula" />
      <canvas ref={canvasRef} className="cb-stars" />
      <div ref={cometLayerRef} className="cb-comets" />
      <div className="cb-debris cb-debris--1" />
      <div className="cb-debris cb-debris--2" />
      <div className="cb-debris cb-debris--3" />
      <div className="cb-vignette" />
    </div>
  );
}

const css = `
.cb-root {
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  background: #060608;
  background-image:
    radial-gradient(ellipse at 20% 50%, rgba(140,150,170,0.05) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 20%, rgba(160,160,180,0.04) 0%, transparent 50%);
  z-index: -10;
}
.cb-fixed { position: fixed; }

.cb-nebula {
  position: absolute; inset: -10%;
  background:
    radial-gradient(circle at 30% 40%, rgba(180,190,220,0.05), transparent 55%),
    radial-gradient(circle at 70% 70%, rgba(120,130,160,0.04), transparent 60%);
  filter: blur(40px);
  animation: cb-nebula-drift 28s ease-in-out infinite alternate;
}
@keyframes cb-nebula-drift {
  0%   { transform: translate3d(0,0,0) scale(1); }
  100% { transform: translate3d(2%, -1.5%, 0) scale(1.05); }
}

.cb-stars {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  display: block;
}

.cb-comets { position: absolute; inset: 0; }
.cb-comet {
  position: absolute;
  width: 220px; height: 2px;
  background: linear-gradient(90deg,
    rgba(255,255,255,0) 0%,
    rgba(220,225,235,0.5) 40%,
    rgba(255,255,255,0.95) 95%,
    #ffffff 100%);
  border-radius: 999px;
  filter: blur(0.6px) drop-shadow(0 0 6px rgba(200,210,230,0.55));
  transform-origin: right center;
  transform: rotate(20deg) scale(var(--cb-scale, 1));
  opacity: 0;
  animation: cb-comet-fly var(--cb-dur, 3s) cubic-bezier(.45,.02,.2,1) forwards;
}
.cb-comet::after {
  content: ""; position: absolute; right: -3px; top: 50%;
  width: 6px; height: 6px; border-radius: 50%;
  background: #ffffff;
  transform: translateY(-50%);
  box-shadow: 0 0 12px 2px rgba(220,230,255,0.8);
}
@keyframes cb-comet-fly {
  0%   { transform: translate3d(0,0,0) rotate(20deg) scale(var(--cb-scale,1)); opacity: 0; }
  10%  { opacity: 1; }
  100% { transform: translate3d(120vw, 60vh, 0) rotate(20deg) scale(var(--cb-scale,1)); opacity: 0; }
}

.cb-debris {
  position: absolute;
  border-radius: 38% 62% 55% 45% / 50% 45% 55% 50%;
  background: radial-gradient(circle at 30% 30%, #4a4d57, #1a1c22 70%, #0a0b0f 100%);
  box-shadow: inset -4px -6px 14px rgba(0,0,0,0.6), 0 0 18px rgba(160,170,190,0.05);
  opacity: 0.18;
  filter: blur(0.3px);
}
.cb-debris--1 { width: 90px; height: 90px; top: 8%;  left: 4%;  animation: cb-spin 60s linear infinite, cb-float 12s ease-in-out infinite alternate; }
.cb-debris--2 { width: 56px; height: 56px; bottom: 12%; right: 6%; animation: cb-spin 80s linear infinite reverse, cb-float 16s ease-in-out infinite alternate; }
.cb-debris--3 { width: 36px; height: 36px; top: 65%; left: 80%; opacity: 0.12; animation: cb-spin 100s linear infinite, cb-float 18s ease-in-out infinite alternate; }
@keyframes cb-spin   { to { transform: rotate(360deg); } }
@keyframes cb-float  { 0% { translate: 0 0; } 100% { translate: 10px -14px; } }

.cb-vignette {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%);
}

@media (prefers-reduced-motion: reduce) {
  .cb-nebula, .cb-debris, .cb-comet { animation: none !important; }
}
`;
