/** Minimum space kept between logo, centered nav links, and the right actions. */
export const DESKTOP_NAV_MIN_GAP_PX = 32;

export function computeCenteredNavShift(params: {
  logoRight: number;
  navLeft: number;
  navRight: number;
  actionsLeft: number;
  currentShift: number;
  minGap?: number;
}): number {
  const minGap = params.minGap ?? DESKTOP_NAV_MIN_GAP_PX;
  const naturalLeft = params.navLeft - params.currentShift;
  const naturalRight = params.navRight - params.currentShift;
  const navWidth = naturalRight - naturalLeft;
  const minLeft = params.logoRight + minGap;
  const maxRight = params.actionsLeft - minGap;
  const available = maxRight - minLeft;

  if (available >= navWidth) {
    if (naturalLeft < minLeft) return minLeft - naturalLeft;
    if (naturalRight > maxRight) return maxRight - naturalRight;
    return 0;
  }

  const slotCenter = (minLeft + maxRight) / 2;
  const naturalCenter = (naturalLeft + naturalRight) / 2;
  return slotCenter - naturalCenter;
}
