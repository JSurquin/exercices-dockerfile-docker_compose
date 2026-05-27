"use client";

/**
 * Fond spatial chrome/lunaire — étoiles, comètes argentées, nébuleuse diffuse.
 */
export function SpaceBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      {/* Nébuleuse */}
      <div className="absolute inset-0 lunar-nebula" />

      {/* Champ d'étoiles */}
      <div className="absolute inset-0 lunar-stars" />

      {/* Comètes */}
      <div className="lunar-comet lunar-comet-1" />
      <div className="lunar-comet lunar-comet-2" />
      <div className="lunar-comet lunar-comet-3" />

      {/* Astéroïdes décoratifs */}
      <div className="lunar-asteroid lunar-asteroid-tl" />
      <div className="lunar-asteroid lunar-asteroid-br" />
    </div>
  );
}
