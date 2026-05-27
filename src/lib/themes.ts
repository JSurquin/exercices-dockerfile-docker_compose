export const APP_THEMES = ["moonskin", "light", "cs2"] as const;
export type AppTheme = (typeof APP_THEMES)[number];

export const DEFAULT_THEME: AppTheme = "moonskin";

export function normalizeStoredTheme(value: string | undefined): AppTheme {
  if (value === "moonskin" || value === "light" || value === "cs2") return value;
  if (value === "dark" || value === "tertiary" || value === "colorful") return "cs2";
  return DEFAULT_THEME;
}

export function isDarkAppTheme(theme: string | undefined): boolean {
  return normalizeStoredTheme(theme) !== "light";
}
