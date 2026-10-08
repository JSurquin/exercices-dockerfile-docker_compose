import { computeCenteredNavShift, DESKTOP_NAV_MIN_GAP_PX } from "@/lib/centered-nav-shift";

describe("computeCenteredNavShift", () => {
  it("garde le centrage optique quand les 24 px tiennent de chaque côté", () => {
    expect(
      computeCenteredNavShift({
        logoRight: 160,
        navLeft: 400,
        navRight: 800,
        actionsLeft: 1100,
        currentShift: 0,
      })
    ).toBe(0);
  });

  it("décale à droite juste assez pour coller l’écart minimum avec le logo", () => {
    expect(
      computeCenteredNavShift({
        logoRight: 200,
        navLeft: 210,
        navRight: 610,
        actionsLeft: 1100,
        currentShift: 0,
      })
    ).toBe(DESKTOP_NAV_MIN_GAP_PX - 10);
  });

  it("décale à gauche juste assez pour coller l’écart minimum avec les actions", () => {
    expect(
      computeCenteredNavShift({
        logoRight: 100,
        navLeft: 400,
        navRight: 900,
        actionsLeft: 910,
        currentShift: 0,
      })
    ).toBe(-(DESKTOP_NAV_MIN_GAP_PX - 10));
  });

  it("recentre dans l’espace restant si les deux côtés débordent", () => {
    expect(
      computeCenteredNavShift({
        logoRight: 200,
        navLeft: 300,
        navRight: 900,
        actionsLeft: 840,
        currentShift: 0,
      })
    ).toBe(-80);
  });

  it("recalcule à partir de la position naturelle même si un shift est déjà appliqué", () => {
    expect(
      computeCenteredNavShift({
        logoRight: 200,
        navLeft: 224,
        navRight: 624,
        actionsLeft: 1100,
        currentShift: 14,
      })
    ).toBe(DESKTOP_NAV_MIN_GAP_PX - 10);
  });
});
