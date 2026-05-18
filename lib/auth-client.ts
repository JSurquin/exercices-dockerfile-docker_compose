"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields, twoFactorClient, adminClient } from "better-auth/client/plugins";
import type { BetterAuthClientPlugin } from "better-auth/client";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  plugins: [
    inferAdditionalFields<typeof auth>(),
    // Better Auth 1.2.12 a un bug de typage sur viewBackupCodes (GET avec body).
    // Le cast est sans impact runtime — le plugin fonctionne normalement.
    twoFactorClient({
      onTwoFactorRedirect() {
        const current = typeof window !== "undefined" ? window.location.pathname : "/dashboard";
        window.location.href = `/two-factor?mode=verify&redirect=${encodeURIComponent(current)}`;
      },
    }) as unknown as BetterAuthClientPlugin,
    adminClient(),
  ],
});

// Helper functions pour l'authentification
export const signInWithDiscord = async () => {
  try {
    const data = await authClient.signIn.social({
      provider: "discord",
    });
    return data;
  } catch (error) {
    console.error("Discord sign-in error:", error);
    throw error;
  }
};

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
