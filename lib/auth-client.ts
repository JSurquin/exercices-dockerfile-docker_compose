"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  plugins: [inferAdditionalFields<typeof auth>()],
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

