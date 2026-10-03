/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { User } from "@/lib/types";

let authUser: User | null = null;

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt = "" }: { alt?: string }) => <img alt={alt} />,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({ user: authUser, isLoading: false }),
}));

jest.mock("@/components/providers/currency-provider", () => ({
  useCurrency: () => ({ selectedCurrency: "EUR" }),
}));

jest.mock("@/components/providers/locale-provider", () => ({
  useLocale: () => ({
    locale: "fr",
    messages: {
      common: { loading: "Chargement..." },
      nav: {
        missions: "Missions",
        giveaways: "Concours",
        wallet: {
          label: "Portefeuille",
          fragmentsHint: "Hint fragments",
          earnFragments: "En gagner",
          availableFragments: "Fragments disponibles",
          availableBalance: "Solde disponible",
          pendingBalance: "Solde en attente",
          viewBalance: "Voir le solde",
          withdraw: "Retirer",
          history: "Historique des transactions",
          actionLabel: "Actions du portefeuille",
        },
      },
    },
  }),
}));

import { NavWallet, NavWalletSkeleton } from "@/components/layout/nav-wallet";

function userFixture(overrides: Partial<User> = {}): User {
  return {
    id: "u1",
    steamId64: "76561198000000000",
    username: "Preview",
    avatar: "",
    kycStatus: "VERIFIED",
    totalVolume: 0,
    xp: 0,
    level: 1,
    tickets: 0,
    fragments: 0,
    joinedAt: new Date(),
    ...overrides,
  };
}

function renderWallet() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      <NavWallet />
    </QueryClientProvider>
  );
}

describe("NavWallet", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  });

  beforeEach(() => {
    authUser = null;
    global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch;
  });

  it("n'affiche rien si l'utilisateur n'est pas connecté", () => {
    const { container } = renderWallet();
    expect(container).toBeEmptyDOMElement();
  });

  it("réserve la taille du bloc et montre un skeleton pendant le chargement du solde", () => {
    authUser = userFixture({ fragments: 12 });
    renderWallet();

    const trigger = screen.getByRole("button", { name: "Portefeuille, Chargement..." });
    const chip = trigger.closest("[data-slot='nav-wallet']");
    expect(chip).toHaveAttribute("aria-busy", "true");
    expect(chip).toHaveClass("h-9");
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Actions du portefeuille" })).toBeInTheDocument();
  });

  it("affiche un solde à 0 sans le masquer", async () => {
    authUser = userFixture({ fragments: 0 });
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/user/balance")) {
        return {
          ok: true,
          json: async () => ({ availableCents: 0, pendingBalanceCents: 0 }),
        } as Response;
      }
      return { ok: false, json: async () => ({}) } as Response;
    }) as unknown as typeof fetch;

    renderWallet();

    await waitFor(() => {
      expect(screen.getByLabelText(/0\.00€/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/portefeuille: 0, 0\.00€/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/chargement/i)).not.toBeInTheDocument();
  });

  it("abrège les valeurs longues et expose la valeur exacte", async () => {
    authUser = userFixture({ fragments: 1_234_567 });
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ availableCents: 1_234_567, pendingBalanceCents: 0 }),
    })) as unknown as typeof fetch;

    renderWallet();

    await waitFor(() => {
      expect(screen.getByText("1,2M")).toBeInTheDocument();
      expect(screen.getByText("12,3k€")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /1\s?234\s?567/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /12345\.67€/ })).toBeInTheDocument();
  });

  it("conserve le skeleton à la même hauteur que le bloc final", () => {
    const { container } = render(<NavWalletSkeleton />);
    const chip = container.querySelector("[data-slot='nav-wallet']");
    expect(chip).toHaveClass("h-9");
    expect(chip).toHaveClass("min-w-[10.25rem]");
  });
});
