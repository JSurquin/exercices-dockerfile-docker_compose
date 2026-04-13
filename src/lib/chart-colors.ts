/**
 * Palette centralisée pour les graphiques D3 et Recharts.
 * Ces valeurs hex correspondent aux tokens Tailwind du design system.
 */
export const CHART_COLORS = {
  // Couleur principale de la marque
  orange: '#f97316',   // orange-500

  // Palette multi-séries (donut, barres groupées, etc.)
  cyan: '#06b6d4',     // cyan-500
  purple: '#8b5cf6',  // violet-500
  green: '#10b981',   // emerald-500
  amber: '#f59e0b',   // amber-500
  red: '#ef4444',     // red-500

  // Neutres (axes, grilles, textes)
  slate900: '#1e293b', // slate-900 – fond séparateur donut
  slate800: '#1f2937', // gray-800  – fond tooltip Recharts
  slate700: '#374151', // gray-700  – bordures grille
  slate600: '#475569', // slate-600 – axes D3
  slate400: '#9ca3af', // gray-400  – axes Recharts
  slate300: '#cbd5e1', // slate-300 – labels D3
  slate200: '#e2e8f0', // slate-200 – value labels D3
  slate100: '#f3f4f6', // gray-100  – tooltip labels Recharts
  white: '#ffffff',
} as const;

export type ChartColor = keyof typeof CHART_COLORS;

/** Palette ordonnée pour les graphiques multi-séries */
export const CHART_PALETTE: string[] = [
  CHART_COLORS.orange,
  CHART_COLORS.cyan,
  CHART_COLORS.purple,
  CHART_COLORS.green,
  CHART_COLORS.amber,
  CHART_COLORS.red,
];

/** Style commun pour les tooltips Recharts */
export const RECHARTS_TOOLTIP_STYLE = {
  backgroundColor: CHART_COLORS.slate800,
  border: `1px solid ${CHART_COLORS.slate700}`,
  borderRadius: '8px',
  fontSize: '14px',
} as const;
