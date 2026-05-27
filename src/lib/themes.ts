export const APP_THEMES = ["moonskin", "colorful", "tertiary"] as const;
export type AppTheme = (typeof APP_THEMES)[number];

export const DEFAULT_THEME: AppTheme = "moonskin";

/** Anciennes valeurs next-themes → nouveau schéma */
export function normalizeStoredTheme(value: string | undefined): AppTheme {
  if (value === "colorful" || value === "tertiary" || value === "moonskin") {
    return value;
  }
  if (value === "dark") return "tertiary";
  if (value === "light") return "moonskin";
  return DEFAULT_THEME;
}

export function isDarkAppTheme(theme: string | undefined): boolean {
  const t = normalizeStoredTheme(theme);
  return t === "moonskin" || t === "colorful" || t === "tertiary";
}
