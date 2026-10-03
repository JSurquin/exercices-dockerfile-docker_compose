import { formatWalletFragments, formatWalletMoney } from "@/lib/nav-wallet-format";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

describe("formatWalletFragments", () => {
  it("affiche 0 sans le masquer", () => {
    expect(formatWalletFragments(0, "fr-FR")).toEqual({
      display: "0",
      exact: "0",
      abbreviated: false,
    });
  });

  it("garde les valeurs sous le seuil en format exact", () => {
    const result = formatWalletFragments(9999, "fr-FR");
    expect(result.abbreviated).toBe(false);
    expect(result.display).toBe(result.exact);
    expect(digitsOnly(result.exact)).toBe("9999");
  });

  it("abrège au-delà de 10 000 et à partir du million", () => {
    const thousands = formatWalletFragments(12_345, "fr-FR");
    expect(thousands).toMatchObject({ display: "12,3k", abbreviated: true });
    expect(digitsOnly(thousands.exact)).toBe("12345");

    const millions = formatWalletFragments(1_234_567, "fr-FR");
    expect(millions).toMatchObject({ display: "1,2M", abbreviated: true });
    expect(digitsOnly(millions.exact)).toBe("1234567");
  });
});

describe("formatWalletMoney", () => {
  it("affiche un solde à 0 avec le format prix existant", () => {
    expect(formatWalletMoney(0, "EUR", "fr-FR")).toEqual({
      display: "0.00€",
      exact: "0.00€",
      abbreviated: false,
    });
  });

  it("abrège les montants longs et conserve le prix exact", () => {
    expect(formatWalletMoney(1_234_567, "EUR", "fr-FR")).toEqual({
      display: "12,3k€",
      exact: "12345.67€",
      abbreviated: true,
    });
    expect(formatWalletMoney(123_456_700, "USD", "en-US")).toEqual({
      display: "$1.2M",
      exact: "$1234567.00",
      abbreviated: true,
    });
  });
});
