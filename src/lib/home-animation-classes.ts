/** Classes utilitaires pour les animations CSS de la page d'accueil. */

export const homeEnter = {
  left: "home-enter-left",
  right: "home-enter-right",
  up: "home-enter-up",
  upLg: "home-enter-up-lg",
} as const;

export const homeDelay = {
  200: "home-delay-200",
  300: "home-delay-300",
  400: "home-delay-400",
  500: "home-delay-500",
  600: "home-delay-600",
  650: "home-delay-650",
  700: "home-delay-700",
} as const;

export const homeReveal = {
  up: "home-reveal-up",
  upSm: "home-reveal-up-sm",
  upMd: "home-reveal-up-md",
  left: "home-reveal-left",
  right: "home-reveal-right",
  scale: "home-reveal-scale",
  fade: "home-reveal-fade",
} as const;

export function homeStagger(index: number): string {
  const clamped = Math.min(Math.max(index, 0), 12);
  return `home-stagger-${clamped}`;
}

export const homeHover = {
  scale: "home-hover-scale",
  lift: "home-hover-lift",
} as const;

export const homeExpand = {
  grid: "home-expand-grid",
} as const;
