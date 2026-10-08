import {
  clusterWidth,
  desktopNavFits,
  DESKTOP_NAV_ACTIONS_GAP_PX,
  DESKTOP_NAV_MIN_GAP_PX,
} from "@/lib/centered-nav-shift";

describe("desktopNavFits", () => {
  it("garde 24 px d’écart minimum entre les trois blocs", () => {
    expect(DESKTOP_NAV_MIN_GAP_PX).toBe(24);
  });

  it("accepte la navbar desktop quand logo, liens et actions tiennent avec les deux écarts", () => {
    expect(
      desktopNavFits({
        barWidth: 1400,
        logoWidth: 180,
        linksWidth: 640,
        actionsWidth: 420,
      })
    ).toBe(true);
  });

  it("refuse dès que les 24 px de chaque côté ne tiennent plus", () => {
    const logoWidth = 180;
    const linksWidth = 720;
    const actionsWidth = 480;
    const needed = logoWidth + DESKTOP_NAV_MIN_GAP_PX + linksWidth + DESKTOP_NAV_MIN_GAP_PX + actionsWidth;

    expect(
      desktopNavFits({
        barWidth: needed,
        logoWidth,
        linksWidth,
        actionsWidth,
      })
    ).toBe(true);

    expect(
      desktopNavFits({
        barWidth: needed - 1,
        logoWidth,
        linksWidth,
        actionsWidth,
      })
    ).toBe(false);
  });

  it("refuse tant qu’une zone n’est pas mesurée", () => {
    expect(
      desktopNavFits({
        barWidth: 1600,
        logoWidth: 180,
        linksWidth: 0,
        actionsWidth: 400,
      })
    ).toBe(false);
  });

  it("bascule plus tôt avec des libellés français plus longs que l’anglais", () => {
    const barWidth = 1280;
    const logoWidth = 168;
    const actionsWidth = 420;
    const englishLinks = 520;
    const frenchLinks = 720;

    expect(
      desktopNavFits({ barWidth, logoWidth, linksWidth: englishLinks, actionsWidth })
    ).toBe(true);
    expect(
      desktopNavFits({ barWidth, logoWidth, linksWidth: frenchLinks, actionsWidth })
    ).toBe(false);
  });
});

describe("clusterWidth", () => {
  it("additionne les largeurs visibles avec le gap entre chaque paire", () => {
    expect(clusterWidth([36, 220, 36])).toBe(36 + 220 + 36 + DESKTOP_NAV_ACTIONS_GAP_PX * 2);
  });

  it("ignore les zones à largeur nulle", () => {
    expect(clusterWidth([0, 220])).toBe(220);
  });
});
