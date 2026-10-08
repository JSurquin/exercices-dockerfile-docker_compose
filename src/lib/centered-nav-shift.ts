/** Minimum flex gap kept between logo, nav links, and the right actions. */
export const DESKTOP_NAV_MIN_GAP_PX = 24;

/** Flex gap between items inside the actions cluster (Tailwind `gap-1`). */
export const DESKTOP_NAV_ACTIONS_GAP_PX = 4;

export function desktopNavFits(params: {
  barWidth: number;
  logoWidth: number;
  linksWidth: number;
  actionsWidth: number;
  minGap?: number;
}): boolean {
  const minGap = params.minGap ?? DESKTOP_NAV_MIN_GAP_PX;
  if (
    params.barWidth <= 0 ||
    params.logoWidth <= 0 ||
    params.linksWidth <= 0 ||
    params.actionsWidth <= 0
  ) {
    return false;
  }

  const needed =
    params.logoWidth + minGap + params.linksWidth + minGap + params.actionsWidth;
  return params.barWidth >= needed;
}

export function clusterWidth(parts: number[], gapPx: number = DESKTOP_NAV_ACTIONS_GAP_PX): number {
  const present = parts.filter((width) => width > 0);
  if (present.length === 0) return 0;
  return present.reduce((sum, width) => sum + width, 0) + gapPx * (present.length - 1);
}
