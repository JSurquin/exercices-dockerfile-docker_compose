import { auth } from "~/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { prisma } from "~/prisma/prisma";

const handler = toNextJsHandler(auth);

/**
 * Pour les endpoints two-factor/*, on vérifie que l'utilisateur n'est pas
 * ADMIN ou MODERATOR. On lit son ID soit depuis la session normale (si connecté)
 * soit depuis le cookie temporaire Better Auth 2FA ("better-auth.two-factor").
 */
async function blockTwoFactorForPrivilegedRoles(
  request: Request,
): Promise<Response | null> {
  const pathname = new URL(request.url).pathname;
  if (!pathname.includes("/two-factor/")) {
    return null;
  }

  // Tentative via session normale
  let userId: string | null = null;
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (session?.user?.id) {
      userId = session.user.id;
    }
  } catch {
    // Session absente = flow 2FA login en cours, chercher le cookie temporaire
  }

  // Si pas de session, lire le cookie temporaire Better Auth 2FA
  if (!userId) {
    const cookieHeader = request.headers.get("cookie") || "";
    // Better Auth stocke l'userId en clair dans better-auth.two_factor (base64 ou JSON)
    const match = cookieHeader.match(/better-auth\.two[_-]factor=([^;]+)/);
    if (match) {
      try {
        const decoded = Buffer.from(
          decodeURIComponent(match[1]),
          "base64",
        ).toString("utf-8");
        const parsed = JSON.parse(decoded);
        userId = parsed?.userId ?? parsed?.id ?? null;
      } catch {
        // Cookie non lisible = on laisse passer, Better Auth rejettera si invalide
      }
    }
  }

  if (!userId) return null;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (dbUser?.role === "ADMIN" || dbUser?.role === "MODERATOR") {
      return new Response(
        JSON.stringify({
          error: "Two-factor authentication is not available for this account.",
        }),
        {
          status: 403,
          headers: { "content-type": "application/json" },
        },
      );
    }
  } catch {
    // En cas d'erreur DB, on laisse passer Better Auth gérer
  }

  return null;
}

export const GET = async (request: Request) => {
  const blocked = await blockTwoFactorForPrivilegedRoles(request);
  if (blocked) return blocked;
  return handler.GET(request);
};

export const POST = async (request: Request) => {
  const blocked = await blockTwoFactorForPrivilegedRoles(request);
  if (blocked) return blocked;
  return handler.POST(request);
};
