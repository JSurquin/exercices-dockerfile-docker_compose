import { auth } from "~/lib/auth";
import { prisma } from "~/prisma/prisma";

export async function getCurrentUserForTwoFactor(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session?.user?.id) return { error: "Unauthorized", status: 401 as const };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, steamId: true },
  });

  if (!user) return { error: "User not found", status: 404 as const };
  if (user.role === "ADMIN" || user.role === "MODERATOR") {
    return { error: "2FA is disabled for this role", status: 403 as const };
  }

  return { user, session };
}

/**
 * Pour les comptes Steam, le mot de passe réel est dérivé du steamId en interne.
 * On le transmet toujours côté serveur, l'UI n'a pas à le connaître.
 */
export function resolveTwoFactorPassword(
  userSteamId: string | null,
  providedPassword?: string,
): string {
  if (providedPassword && providedPassword.trim().length > 0) {
    return providedPassword;
  }
  if (userSteamId) {
    return `steam-auth-${userSteamId}`;
  }
  // Ne devrait pas arriver pour un compte email normal sans mot de passe fourni
  return "";
}

/**
 * Construit les headers à transmettre au handler Better Auth interne,
 * en incluant le cookie de session et l'Origin (requis par Better Auth).
 */
export function buildInternalHeaders(incomingHeaders: Headers): Headers {
  const outgoing = new Headers();
  const cookie = incomingHeaders.get("cookie");
  if (cookie) outgoing.set("cookie", cookie);
  outgoing.set("content-type", "application/json");
  // Better Auth vérifie l'Origin — on le propage ou on utilise la base URL configurée
  const origin = incomingHeaders.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  outgoing.set("origin", origin);
  return outgoing;
}
