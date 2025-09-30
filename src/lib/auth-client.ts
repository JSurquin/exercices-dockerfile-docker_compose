import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
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

export const signOut = async () => {
  try {
    await authClient.signOut();
  } catch (error) {
    console.error("Sign-out error:", error);
    throw error;
  }
};

export const getSession = async () => {
  try {
    const session = await authClient.getSession();
    return session;
  } catch (error) {
    console.error("Get session error:", error);
    return null;
  }
};
